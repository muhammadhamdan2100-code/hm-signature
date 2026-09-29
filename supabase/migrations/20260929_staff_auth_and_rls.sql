-- ====================================================================
-- HM SIGNATURE: SUPABASE STAFF AUTHENTICATION & RLS POLICIES
-- Migration File: 20260929_staff_auth_and_rls.sql
-- ====================================================================

-- 1. Create Profiles Table Linked to auth.users.id
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (
    role IN (
      'customer',
      'super_admin',
      'manager',
      'order_manager',
      'content_manager',
      'support'
    )
  ),
  status TEXT NOT NULL DEFAULT 'active' CHECK (
    status IN ('active', 'inactive', 'suspended')
  ),
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for speedy role & status queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);

-- 2. Helper Functions (SECURITY DEFINER, STABLE)
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.profiles WHERE id = user_id),
    'customer'
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_status(user_id UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT status FROM public.profiles WHERE id = user_id),
    'active'
  );
$$;

-- Checks if current user is active staff
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND status = 'active'
    AND role IN ('super_admin', 'manager', 'order_manager', 'content_manager', 'support')
  );
$$;

-- Checks if current user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND status = 'active'
    AND role = 'super_admin'
  );
$$;

-- 3. Enable Row Level Security (RLS) across all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- 4. RLS POLICIES FOR PROFILES
DROP POLICY IF EXISTS "Users read own profile or staff read all" ON public.profiles;
DROP POLICY IF EXISTS "Users update own non-role fields" ON public.profiles;
DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;

CREATE POLICY "Users read own profile or staff read all"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_staff());

CREATE POLICY "Users update own non-role fields"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_super_admin())
  WITH CHECK (
    -- Customer cannot change role or status
    (auth.uid() = id AND role = public.get_user_role(auth.uid()) AND status = public.get_user_status(auth.uid()))
    OR public.is_super_admin()
  );

CREATE POLICY "Users insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id OR public.is_super_admin());

-- 5. RLS POLICIES FOR PRODUCTS, CATEGORIES, COLLECTIONS
DROP POLICY IF EXISTS "Public read active products" ON public.products;
DROP POLICY IF EXISTS "Staff manage products" ON public.products;

CREATE POLICY "Public read active products"
  ON public.products FOR SELECT
  USING (active = true OR public.is_staff());

CREATE POLICY "Staff manage products"
  ON public.products FOR ALL
  USING (public.is_staff());

-- Categories & Collections
DROP POLICY IF EXISTS "Public read active categories" ON public.categories;
DROP POLICY IF EXISTS "Staff manage categories" ON public.categories;

CREATE POLICY "Public read active categories"
  ON public.categories FOR SELECT
  USING (active = true OR public.is_staff());

CREATE POLICY "Staff manage categories"
  ON public.categories FOR ALL
  USING (public.is_staff());

DROP POLICY IF EXISTS "Public read active collections" ON public.collections;
DROP POLICY IF EXISTS "Staff manage collections" ON public.collections;

CREATE POLICY "Public read active collections"
  ON public.collections FOR SELECT
  USING (active = true OR public.is_staff());

CREATE POLICY "Staff manage collections"
  ON public.collections FOR ALL
  USING (public.is_staff());

-- 6. RLS POLICIES FOR ORDERS
DROP POLICY IF EXISTS "Customers read own orders or staff read all" ON public.orders;
DROP POLICY IF EXISTS "Customers insert orders" ON public.orders;
DROP POLICY IF EXISTS "Staff update orders" ON public.orders;

CREATE POLICY "Customers read own orders or staff read all"
  ON public.orders FOR SELECT
  USING (customer_id = auth.uid() OR public.is_staff());

CREATE POLICY "Customers insert orders"
  ON public.orders FOR INSERT
  WITH CHECK (customer_id = auth.uid() OR auth.uid() IS NOT NULL OR public.is_staff());

CREATE POLICY "Staff update orders"
  ON public.orders FOR UPDATE
  USING (public.is_staff());

-- 7. TRIGGER FOR AUTO-CREATING PROFILE ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer'),
    'active'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. PRIMARY ADMIN SEEDING
-- Ensures muhammadhamdan2100@gmail.com is set to super_admin and active
UPDATE public.profiles
SET role = 'super_admin', status = 'active'
WHERE email = 'muhammadhamdan2100@gmail.com';
