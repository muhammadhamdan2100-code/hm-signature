-- ====================================================================
-- HM SIGNATURE: UNIFIED AUTHENTICATION & ROW LEVEL SECURITY (RLS)
-- Migration File: 20260929_unify_auth_and_rls.sql
-- ====================================================================

-- 1. Create Profile / User Table with Strict Role Constraint
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (
    role IN (
      'customer',
      'super_admin',
      'admin',
      'manager',
      'order_manager',
      'content_manager',
      'support'
    )
  ),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for speedy role resolution
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 2. Security Helper Functions (SECURITY DEFINER, STABLE)
-- Returns user role from database
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

-- Checks if current authenticated user is a staff member
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('super_admin', 'admin', 'manager', 'order_manager', 'content_manager', 'support')
  );
$$;

-- Checks if current authenticated user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(required_role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND (role = required_role OR role = 'super_admin')
  );
$$;

-- Checks if current authenticated user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
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
-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can read own profile or staff read all" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile non-role" ON public.profiles;
DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;

-- Read: Users read own profile; staff read all profiles
CREATE POLICY "Users can read own profile or staff read all"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_staff());

-- Update: Users can edit profile details, BUT NEVER CAN CHANGE THEIR OWN ROLE
CREATE POLICY "Users update own profile non-role"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_super_admin())
  WITH CHECK (
    -- Customer cannot change role column
    (auth.uid() = id AND role = public.get_user_role(auth.uid()))
    OR public.is_super_admin()
  );

-- Insert: On signup or super admin action
CREATE POLICY "Users insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id OR public.is_super_admin());

-- 5. RLS POLICIES FOR PUBLIC CATALOG (Products, Categories, Collections)
DROP POLICY IF EXISTS "Public read active products" ON public.products;
DROP POLICY IF EXISTS "Staff manage products" ON public.products;

CREATE POLICY "Public read active products"
  ON public.products FOR SELECT
  USING (active = true OR public.is_staff());

CREATE POLICY "Staff manage products"
  ON public.products FOR ALL
  USING (public.is_staff());

-- Categories
DROP POLICY IF EXISTS "Public read active categories" ON public.categories;
DROP POLICY IF EXISTS "Staff manage categories" ON public.categories;

CREATE POLICY "Public read active categories"
  ON public.categories FOR SELECT
  USING (active = true OR public.is_staff());

CREATE POLICY "Staff manage categories"
  ON public.categories FOR ALL
  USING (public.is_staff());

-- Collections
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
DROP POLICY IF EXISTS "Customers insert own order or staff manage" ON public.orders;
DROP POLICY IF EXISTS "Staff update orders" ON public.orders;

CREATE POLICY "Customers read own orders or staff read all"
  ON public.orders FOR SELECT
  USING (customer_id = auth.uid() OR public.is_staff());

CREATE POLICY "Customers insert own order or staff manage"
  ON public.orders FOR INSERT
  WITH CHECK (customer_id = auth.uid() OR auth.uid() IS NOT NULL OR public.is_staff());

CREATE POLICY "Staff update orders"
  ON public.orders FOR UPDATE
  USING (public.is_staff());

-- 7. RLS POLICIES FOR REVIEWS
DROP POLICY IF EXISTS "Public read approved reviews" ON public.reviews;
DROP POLICY IF EXISTS "Customers create reviews" ON public.reviews;
DROP POLICY IF EXISTS "Staff manage reviews" ON public.reviews;

CREATE POLICY "Public read approved reviews"
  ON public.reviews FOR SELECT
  USING (status = 'Approved' OR public.is_staff());

CREATE POLICY "Customers create reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Staff manage reviews"
  ON public.reviews FOR ALL
  USING (public.is_staff());

-- 8. AUTOMATIC PROFILE CREATION TRIGGER ON AUTH SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind trigger to auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. INITIAL PRIMARY ADMIN PROFILE SEEDING
-- Ensures muhammadhamdan2100@gmail.com retains Super Admin status
UPDATE public.profiles
SET role = 'super_admin'
WHERE email = 'muhammadhamdan2100@gmail.com';
