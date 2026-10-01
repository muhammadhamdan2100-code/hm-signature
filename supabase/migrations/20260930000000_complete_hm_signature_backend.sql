-- ====================================================================
-- HM SIGNATURE LUXURY FRAGRANCE - COMPLETE SUPABASE BACKEND MIGRATION
-- Migration Date: 2026-09-30
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ====================================================================
-- 2. DOMAIN 1: AUTHENTICATION, ROLES, PERMISSIONS & PROFILES
-- ====================================================================

-- ROLES TABLE
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL, -- e.g. 'super_admin', 'manager', 'order_manager', 'content_manager', 'customer'
    display_name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- PERMISSIONS TABLE
CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL, -- e.g. 'manage_products', 'manage_orders', 'verify_payments', 'manage_staff'
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ROLE PERMISSIONS JUNCTION
CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- PROFILES TABLE (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('super_admin', 'manager', 'order_manager', 'content_manager', 'customer')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    is_primary_admin BOOLEAN DEFAULT FALSE NOT NULL,
    last_sign_in_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- CUSTOMERS EXTENSION TABLE
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other', 'unspecified')),
    total_orders INT DEFAULT 0 CHECK (total_orders >= 0),
    total_spent NUMERIC(12, 2) DEFAULT 0 CHECK (total_spent >= 0),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Seed Default Roles
INSERT INTO public.roles (name, display_name, description) VALUES
('super_admin', 'Super Admin', 'Full unrestricted administrative access to all boutique systems'),
('manager', 'Manager', 'General management access excluding primary admin settings'),
('order_manager', 'Order Manager', 'Fulfillment, shipping, tracking, and order management'),
('content_manager', 'Content Manager', 'Product catalog, fragrance notes, collections, and CMS editor'),
('customer', 'Customer Client', 'Registered client shopping account')
ON CONFLICT (name) DO UPDATE SET display_name = EXCLUDED.display_name;

-- Seed Default Permissions
INSERT INTO public.permissions (code, description) VALUES
('manage_products', 'Create, edit, and delete products, pricing, and variants'),
('manage_orders', 'View, update status, and manage customer orders'),
('verify_payments', 'Inspect payment proofs and verify/reject transaction deposits'),
('manage_inventory', 'Adjust stock levels and view inventory logs'),
('manage_customers', 'View customer details and order history'),
('manage_cms', 'Update homepage, banners, and marketing campaigns'),
('manage_staff', 'Create and assign staff roles and credentials'),
('manage_settings', 'Modify site configurations and payment gateway settings')
ON CONFLICT (code) DO NOTHING;

-- Map Role Permissions
DO $$
DECLARE
    r_super UUID;
    r_mgr UUID;
    r_order UUID;
    r_content UUID;
    p_prod UUID;
    p_ord UUID;
    p_pay UUID;
    p_inv UUID;
    p_cust UUID;
    p_cms UUID;
    p_staff UUID;
    p_sett UUID;
BEGIN
    SELECT id INTO r_super FROM public.roles WHERE name = 'super_admin';
    SELECT id INTO r_mgr FROM public.roles WHERE name = 'manager';
    SELECT id INTO r_order FROM public.roles WHERE name = 'order_manager';
    SELECT id INTO r_content FROM public.roles WHERE name = 'content_manager';

    SELECT id INTO p_prod FROM public.permissions WHERE code = 'manage_products';
    SELECT id INTO p_ord FROM public.permissions WHERE code = 'manage_orders';
    SELECT id INTO p_pay FROM public.permissions WHERE code = 'verify_payments';
    SELECT id INTO p_inv FROM public.permissions WHERE code = 'manage_inventory';
    SELECT id INTO p_cust FROM public.permissions WHERE code = 'manage_customers';
    SELECT id INTO p_cms FROM public.permissions WHERE code = 'manage_cms';
    SELECT id INTO p_staff FROM public.permissions WHERE code = 'manage_staff';
    SELECT id INTO p_sett FROM public.permissions WHERE code = 'manage_settings';

    -- Super Admin gets ALL permissions
    INSERT INTO public.role_permissions (role_id, permission_id) VALUES
    (r_super, p_prod), (r_super, p_ord), (r_super, p_pay), (r_super, p_inv),
    (r_super, p_cust), (r_super, p_cms), (r_super, p_staff), (r_super, p_sett)
    ON CONFLICT DO NOTHING;

    -- Manager gets products, orders, payments, inventory, customers, cms
    INSERT INTO public.role_permissions (role_id, permission_id) VALUES
    (r_mgr, p_prod), (r_mgr, p_ord), (r_mgr, p_pay), (r_mgr, p_inv), (r_mgr, p_cust), (r_mgr, p_cms)
    ON CONFLICT DO NOTHING;

    -- Order Manager gets orders, payments, inventory, customers
    INSERT INTO public.role_permissions (role_id, permission_id) VALUES
    (r_order, p_ord), (r_order, p_pay), (r_order, p_inv), (r_order, p_cust)
    ON CONFLICT DO NOTHING;

    -- Content Manager gets products, cms, inventory
    INSERT INTO public.role_permissions (role_id, permission_id) VALUES
    (r_content, p_prod), (r_content, p_cms), (r_content, p_inv)
    ON CONFLICT DO NOTHING;
END $$;

-- Primary Admin Guard & Role Protection Trigger Function
CREATE OR REPLACE FUNCTION public.check_primary_admin_protection()
RETURNS TRIGGER AS $$
BEGIN
    -- Allow session bypass ONLY when explicitly set by internal bootstrap_primary_admin() function
    IF (current_setting('app.bypass_primary_admin_guard', true) = 'true') THEN
        RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
    END IF;

    -- Block deletion of Primary Admin profile
    IF (TG_OP = 'DELETE') THEN
        IF (OLD.email = 'muhammadhamdan2100@gmail.com' OR OLD.is_primary_admin = true) THEN
            RAISE EXCEPTION 'CRITICAL SECURITY: Primary Super Admin profile cannot be deleted.';
        END IF;
        RETURN OLD;
    END IF;

    -- Protect Primary Admin role & active status during updates
    IF (TG_OP = 'UPDATE') THEN
        IF (OLD.email = 'muhammadhamdan2100@gmail.com' OR OLD.is_primary_admin = true) THEN
            IF (NEW.status <> 'active') THEN
                RAISE EXCEPTION 'CRITICAL SECURITY: Primary Super Admin status cannot be deactivated or suspended.';
            END IF;
            IF (NEW.role <> 'super_admin') THEN
                RAISE EXCEPTION 'CRITICAL SECURITY: Primary Super Admin role cannot be modified.';
            END IF;
        END IF;

        -- Prevent non-staff users from self-elevating roles, statuses, or primary admin flags
        IF (NEW.role <> OLD.role OR NEW.status <> OLD.status OR NEW.is_primary_admin <> OLD.is_primary_admin) THEN
            IF NOT public.is_staff(auth.uid()) AND auth.uid() IS NOT NULL THEN
                RAISE EXCEPTION 'Access Denied: Only authorized staff members can modify user roles or account status.';
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_protect_primary_admin ON public.profiles;
CREATE TRIGGER trg_protect_primary_admin
BEFORE UPDATE OR DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.check_primary_admin_protection();

-- Function to safely bootstrap Primary Admin role (Zero parameters, strictly hardcoded)
CREATE OR REPLACE FUNCTION public.bootstrap_primary_admin()
RETURNS JSONB AS $$
DECLARE
    v_primary_email CONSTANT TEXT := 'muhammadhamdan2100@gmail.com';
    v_auth_user_id UUID;
    v_profile_exists BOOLEAN := FALSE;
BEGIN
    -- 1. Check if auth.users record exists for the hardcoded primary email
    SELECT id INTO v_auth_user_id
    FROM auth.users
    WHERE LOWER(email) = LOWER(v_primary_email)
    LIMIT 1;

    IF v_auth_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'email', v_primary_email,
            'error', 'AUTH_USER_NOT_FOUND',
            'message', 'No auth.users record found for muhammadhamdan2100@gmail.com. Please create the user in Supabase Auth first.'
        );
    END IF;

    -- 2. Set session flag to bypass guard during bootstrap execution
    PERFORM set_config('app.bypass_primary_admin_guard', 'true', true);

    -- 3. Check if profile exists
    SELECT EXISTS (
        SELECT 1 FROM public.profiles WHERE id = v_auth_user_id OR LOWER(email) = LOWER(v_primary_email)
    ) INTO v_profile_exists;

    -- 4. Upsert or update profile strictly linked to exact auth.users ID
    IF v_profile_exists THEN
        UPDATE public.profiles
        SET id = v_auth_user_id,
            email = LOWER(v_primary_email),
            role = 'super_admin',
            status = 'active',
            is_primary_admin = true,
            updated_at = NOW()
        WHERE id = v_auth_user_id OR LOWER(email) = LOWER(v_primary_email);
    ELSE
        INSERT INTO public.profiles (
            id, email, full_name, role, status, is_primary_admin, created_at, updated_at
        ) VALUES (
            v_auth_user_id,
            LOWER(v_primary_email),
            'Muhammad Hamdan',
            'super_admin',
            'active',
            true,
            NOW(),
            NOW()
        );
    END IF;

    -- 5. Reset session flag
    PERFORM set_config('app.bypass_primary_admin_guard', 'false', true);

    RETURN jsonb_build_object(
        'success', true,
        'email', v_primary_email,
        'user_id', v_auth_user_id,
        'role', 'super_admin',
        'status', 'active',
        'is_primary_admin', true,
        'message', 'Primary Super Admin account bootstrapped successfully for muhammadhamdan2100@gmail.com.'
    );
EXCEPTION WHEN OTHERS THEN
    PERFORM set_config('app.bypass_primary_admin_guard', 'false', true);
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Revoke execution from public, authenticated, and anonymous roles
REVOKE EXECUTE ON FUNCTION public.bootstrap_primary_admin() FROM PUBLIC, authenticated, anon;
GRANT EXECUTE ON FUNCTION public.bootstrap_primary_admin() TO postgres, service_role;

-- Automatic Profile Creation Trigger on Auth Signup
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
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ====================================================================
-- 3. DOMAIN 2: CATALOG, PRODUCTS, VARIANTS & FRAGRANCE NOTES
-- ====================================================================

-- CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    active BOOLEAN DEFAULT TRUE NOT NULL,
    display_order INT DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- COLLECTIONS
CREATE TABLE IF NOT EXISTS public.collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    banner_url TEXT,
    featured BOOLEAN DEFAULT FALSE NOT NULL,
    active BOOLEAN DEFAULT TRUE NOT NULL,
    display_order INT DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    full_description TEXT,
    base_price NUMERIC(10, 2) NOT NULL CHECK (base_price >= 0), -- 50ml price serves as base
    sale_price NUMERIC(10, 2) CHECK (sale_price IS NULL OR sale_price < base_price),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    collection_id UUID REFERENCES public.collections(id) ON DELETE SET NULL,
    gender TEXT CHECK (gender IN ('men', 'women', 'unisex')) DEFAULT 'unisex' NOT NULL,
    fragrance_type TEXT DEFAULT 'Extrait de Parfum' NOT NULL,
    concentration TEXT DEFAULT 'Extrait de Parfum (25-30% Oil)' NOT NULL,
    featured BOOLEAN DEFAULT FALSE NOT NULL,
    bestseller BOOLEAN DEFAULT FALSE NOT NULL,
    new_arrival BOOLEAN DEFAULT TRUE NOT NULL,
    active BOOLEAN DEFAULT TRUE NOT NULL,
    seo_title TEXT,
    seo_description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- PRODUCT IMAGES
CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text TEXT,
    display_order INT DEFAULT 0 NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- PRODUCT VARIANTS (10ml, 30ml, 50ml, 100ml)
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    size TEXT NOT NULL CHECK (size IN ('10ml', '30ml', '50ml', '100ml')),
    sku TEXT UNIQUE NOT NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    sale_price NUMERIC(10, 2) CHECK (sale_price IS NULL OR sale_price < price),
    stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    low_stock_threshold INT NOT NULL DEFAULT 5 CHECK (low_stock_threshold >= 0),
    active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(product_id, size)
);

-- COLLECTION PRODUCTS JUNCTION
CREATE TABLE IF NOT EXISTS public.collection_products (
    collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    display_order INT DEFAULT 0 NOT NULL,
    PRIMARY KEY (collection_id, product_id)
);

-- FRAGRANCE NOTES
CREATE TABLE IF NOT EXISTS public.fragrance_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    category TEXT CHECK (category IN ('top', 'heart', 'base', 'general')) DEFAULT 'general' NOT NULL,
    description TEXT,
    icon_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- PRODUCT FRAGRANCE NOTES JUNCTION
CREATE TABLE IF NOT EXISTS public.product_fragrance_notes (
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    note_id UUID NOT NULL REFERENCES public.fragrance_notes(id) ON DELETE CASCADE,
    note_type TEXT NOT NULL CHECK (note_type IN ('top', 'heart', 'base')),
    PRIMARY KEY (product_id, note_id, note_type)
);

-- ====================================================================
-- 4. DOMAIN 3: INVENTORY & LOGS
-- ====================================================================

-- INVENTORY RECORD
CREATE TABLE IF NOT EXISTS public.inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_variant_id UUID UNIQUE NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
    quantity_on_hand INT NOT NULL DEFAULT 0 CHECK (quantity_on_hand >= 0),
    quantity_reserved INT NOT NULL DEFAULT 0 CHECK (quantity_reserved >= 0),
    reorder_level INT DEFAULT 5 NOT NULL,
    last_restocked_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- INVENTORY TRANSACTIONS AUDIT
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('sale', 'restock', 'adjustment', 'return', 'cancellation_release')),
    quantity_change INT NOT NULL,
    previous_stock INT NOT NULL,
    new_stock INT NOT NULL,
    reference_id TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ====================================================================
-- 5. DOMAIN 4: CART & WISHLIST
-- ====================================================================

-- CART
CREATE TABLE IF NOT EXISTS public.cart (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- CART ITEMS
CREATE TABLE IF NOT EXISTS public.cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID NOT NULL REFERENCES public.cart(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(cart_id, variant_id)
);

-- WISHLISTS
CREATE TABLE IF NOT EXISTS public.wishlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- WISHLIST ITEMS
CREATE TABLE IF NOT EXISTS public.wishlist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wishlist_id UUID NOT NULL REFERENCES public.wishlists(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(wishlist_id, product_id)
);

-- ABANDONED CARTS AUDIT
CREATE TABLE IF NOT EXISTS public.abandoned_carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID REFERENCES public.cart(id) ON DELETE SET NULL,
    customer_email TEXT NOT NULL,
    customer_name TEXT,
    items_snapshot JSONB NOT NULL,
    total_value NUMERIC(10, 2) NOT NULL DEFAULT 0,
    recovered BOOLEAN DEFAULT FALSE NOT NULL,
    recovery_email_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ====================================================================
-- 6. DOMAIN 5: SHIPPING, SHIPPING ZONES & COUPONS
-- ====================================================================

-- SHIPPING ZONES
CREATE TABLE IF NOT EXISTS public.shipping_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    countries TEXT[] DEFAULT '{"Pakistan"}'::TEXT[],
    regions TEXT[] DEFAULT '{}'::TEXT[],
    active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- SHIPPING METHODS
CREATE TABLE IF NOT EXISTS public.shipping_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id UUID REFERENCES public.shipping_zones(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    courier_name TEXT,
    base_cost NUMERIC(10, 2) DEFAULT 0 NOT NULL CHECK (base_cost >= 0),
    free_shipping_threshold NUMERIC(10, 2) CHECK (free_shipping_threshold IS NULL OR free_shipping_threshold >= 0),
    estimated_days_min INT DEFAULT 2,
    estimated_days_max INT DEFAULT 5,
    active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- COUPONS
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed')),
    value NUMERIC(10, 2) NOT NULL CHECK (value > 0),
    min_spend NUMERIC(10, 2) DEFAULT 0 CHECK (min_spend >= 0),
    max_discount NUMERIC(10, 2) CHECK (max_discount IS NULL OR max_discount >= 0),
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    usage_limit INT CHECK (usage_limit IS NULL OR usage_limit > 0),
    used_count INT DEFAULT 0 CHECK (used_count >= 0),
    active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ====================================================================
-- 7. DOMAIN 6: ORDERS, ORDER ITEMS & SHIPMENTS
-- ====================================================================

-- ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE NOT NULL,
    customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    shipping_address JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Returned')),
    payment_status TEXT NOT NULL DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Verification Pending', 'Verified', 'Paid', 'Failed', 'Rejected', 'Refunded')),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('COD', 'JazzCash', 'Raast', 'Bank Transfer', 'PayFast', 'Cash on Delivery')),
    subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
    discount_amount NUMERIC(10, 2) DEFAULT 0 NOT NULL CHECK (discount_amount >= 0),
    shipping_cost NUMERIC(10, 2) DEFAULT 0 NOT NULL CHECK (shipping_cost >= 0),
    total NUMERIC(10, 2) NOT NULL CHECK (total >= 0),
    coupon_code TEXT,
    courier_name TEXT,
    tracking_id TEXT,
    tracking_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    variant_size TEXT NOT NULL,
    sku TEXT NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
    quantity INT NOT NULL CHECK (quantity > 0),
    line_total NUMERIC(10, 2) NOT NULL CHECK (line_total >= 0),
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ORDER STATUS HISTORY
CREATE TABLE IF NOT EXISTS public.order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    note TEXT,
    changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- SHIPMENTS TABLE
CREATE TABLE IF NOT EXISTS public.shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID UNIQUE NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    courier_name TEXT NOT NULL,
    tracking_number TEXT UNIQUE NOT NULL,
    tracking_url TEXT,
    status TEXT NOT NULL DEFAULT 'Dispatched' CHECK (status IN ('Preparing', 'Dispatched', 'In Transit', 'Out for Delivery', 'Delivered', 'Failed Attempt', 'Returned')),
    dispatch_date TIMESTAMPTZ DEFAULT NOW(),
    estimated_delivery DATE,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- COUPON USAGE TRACKING
CREATE TABLE IF NOT EXISTS public.coupon_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    discount_amount NUMERIC(10, 2) NOT NULL CHECK (discount_amount >= 0),
    used_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ====================================================================
-- 8. DOMAIN 7: PAYMENTS & PAYMENT EVENTS
-- ====================================================================

-- PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    order_number TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
    method TEXT NOT NULL CHECK (method IN ('COD', 'JazzCash', 'Raast', 'Bank Transfer', 'PayFast', 'Cash on Delivery')),
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Verification Pending', 'Verified', 'Paid', 'Failed', 'Rejected', 'Refunded')),
    reference_id TEXT,
    proof_file_path TEXT, -- Storage path in private 'payment-proofs' bucket
    proof_note TEXT,
    verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- PAYMENT EVENTS AUDIT LOG
CREATE TABLE IF NOT EXISTS public.payment_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('proof_uploaded', 'verification_started', 'approved', 'rejected', 'refund_issued', 'status_change')),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notes TEXT,
    payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ====================================================================
-- 9. DOMAIN 8: REVIEWS, CMS, MARKETING & SETTINGS
-- ====================================================================

-- REVIEWS TABLE
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    comment TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Approved', 'Pending', 'Rejected')),
    verified_purchase BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- HOMEPAGE SECTIONS CMS
CREATE TABLE IF NOT EXISTS public.homepage_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_key TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT,
    content JSONB NOT NULL DEFAULT '{}'::JSONB,
    display_order INT DEFAULT 0 NOT NULL,
    active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- BANNERS CMS
CREATE TABLE IF NOT EXISTS public.banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subtitle TEXT,
    image_url TEXT NOT NULL,
    link_url TEXT,
    button_text TEXT DEFAULT 'Explore Collection',
    position TEXT DEFAULT 'hero' CHECK (position IN ('hero', 'top_announcement', 'mid_page', 'footer')),
    display_order INT DEFAULT 0 NOT NULL,
    active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- MARKETING CAMPAIGNS
CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('email', 'discount_push', 'social_ad', 'newsletter')),
    subject TEXT,
    content TEXT,
    target_audience TEXT DEFAULT 'all',
    sent_count INT DEFAULT 0,
    status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft', 'Scheduled', 'Sending', 'Completed', 'Cancelled')),
    scheduled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- NOTIFICATION TEMPLATES
CREATE TABLE IF NOT EXISTS public.notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    body_template TEXT NOT NULL,
    active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- NOTIFICATIONS LOG
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    recipient_email TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- SITE SETTINGS
CREATE TABLE IF NOT EXISTS public.site_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- SEO SETTINGS
CREATE TABLE IF NOT EXISTS public.seo_settings (
    page_path TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    keywords TEXT[] DEFAULT '{}'::TEXT[],
    og_image_url TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ====================================================================
-- 10. INDEXES FOR PERFORMANCE
-- ====================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_collection ON public.products(collection_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_variants_product ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_sku ON public.product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_cart_user ON public.cart(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_session ON public.cart(session_token);

-- ====================================================================
-- 11. DATABASE FUNCTIONS & TRIGGERS
-- ====================================================================

-- Helper: Check if User is Staff
CREATE OR REPLACE FUNCTION public.is_staff(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    IF p_user_id IS NULL THEN
        RETURN FALSE;
    END IF;
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = p_user_id
          AND role IN ('super_admin', 'manager', 'order_manager', 'content_manager')
          AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper: Check Permission Code
CREATE OR REPLACE FUNCTION public.has_permission(p_user_id UUID, p_perm_code TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    u_role TEXT;
BEGIN
    IF p_user_id IS NULL THEN
        RETURN FALSE;
    END IF;

    SELECT role INTO u_role FROM public.profiles WHERE id = p_user_id AND status = 'active';
    IF u_role = 'super_admin' THEN
        RETURN TRUE;
    END IF;

    RETURN EXISTS (
        SELECT 1
        FROM public.profiles pr
        JOIN public.roles r ON r.name = pr.role
        JOIN public.role_permissions rp ON rp.role_id = r.id
        JOIN public.permissions p ON p.id = rp.permission_id
        WHERE pr.id = p_user_id
          AND pr.status = 'active'
          AND p.code = p_perm_code
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atomic Server-Side Function: Place Order
CREATE OR REPLACE FUNCTION public.place_order(
    p_customer_id UUID,
    p_customer_name TEXT,
    p_customer_email TEXT,
    p_customer_phone TEXT,
    p_shipping_address JSONB,
    p_payment_method TEXT,
    p_coupon_code TEXT DEFAULT NULL,
    p_items JSONB DEFAULT '[]'::JSONB -- Array of { variant_id: "uuid", quantity: int }
)
RETURNS JSONB AS $$
DECLARE
    v_order_id UUID;
    v_order_number TEXT;
    v_subtotal NUMERIC(10, 2) := 0;
    v_discount NUMERIC(10, 2) := 0;
    v_shipping NUMERIC(10, 2) := 0;
    v_total NUMERIC(10, 2) := 0;
    v_item JSONB;
    v_variant_id UUID;
    v_quantity INT;
    v_variant RECORD;
    v_product RECORD;
    v_unit_price NUMERIC(10, 2);
    v_line_total NUMERIC(10, 2);
    v_coupon RECORD;
BEGIN
    IF jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'Cannot place order with an empty cart.';
    END IF;

    -- Generate unique order number
    v_order_number := 'HMS-' || to_char(NOW(), 'YYYYMMDD') || '-' || lpad(floor(random() * 10000)::text, 4, '0');
    v_order_id := gen_random_uuid();

    -- Calculate subtotal & validate stock per variant
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_variant_id := (v_item->>'variant_id')::UUID;
        v_quantity := (v_item->>'quantity')::INT;

        IF v_quantity <= 0 THEN
            RAISE EXCEPTION 'Invalid item quantity %', v_quantity;
        END IF;

        -- Lock variant row for update
        SELECT * INTO v_variant FROM public.product_variants WHERE id = v_variant_id FOR UPDATE;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Product variant % not found.', v_variant_id;
        END IF;

        IF NOT v_variant.active THEN
            RAISE EXCEPTION 'Product variant SKU % is currently unavailable.', v_variant.sku;
        END IF;

        IF v_variant.stock < v_quantity THEN
            RAISE EXCEPTION 'Insufficient stock for SKU %. Available: %, Requested: %', v_variant.sku, v_variant.stock, v_quantity;
        END IF;

        SELECT * INTO v_product FROM public.products WHERE id = v_variant.product_id;

        -- Determine server-side authoritative price
        v_unit_price := COALESCE(v_variant.sale_price, v_variant.price);
        v_line_total := v_unit_price * v_quantity;
        v_subtotal := v_subtotal + v_line_total;

        -- Deduct stock safely
        UPDATE public.product_variants
        SET stock = stock - v_quantity,
            updated_at = NOW()
        WHERE id = v_variant_id;

        -- Audit Inventory Transaction
        INSERT INTO public.inventory_transactions (
            variant_id, transaction_type, quantity_change, previous_stock, new_stock, reference_id, notes
        ) VALUES (
            v_variant_id, 'sale', -v_quantity, v_variant.stock, v_variant.stock - v_quantity, v_order_number, 'Customer Order Acquisition'
        );
    END LOOP;

    -- Calculate Coupon Discount if applicable
    IF p_coupon_code IS NOT NULL AND TRIM(p_coupon_code) <> '' THEN
        SELECT * INTO v_coupon FROM public.coupons
        WHERE UPPER(code) = UPPER(TRIM(p_coupon_code)) AND active = TRUE FOR UPDATE;

        IF FOUND THEN
            IF (v_coupon.start_date IS NULL OR NOW() >= v_coupon.start_date) AND
               (v_coupon.end_date IS NULL OR NOW() <= v_coupon.end_date) AND
               (v_coupon.min_spend IS NULL OR v_subtotal >= v_coupon.min_spend) AND
               (v_coupon.usage_limit IS NULL OR v_coupon.used_count < v_coupon.usage_limit) THEN
                
                IF v_coupon.type = 'percentage' THEN
                    v_discount := (v_subtotal * v_coupon.value) / 100.0;
                    IF v_coupon.max_discount IS NOT NULL AND v_discount > v_coupon.max_discount THEN
                        v_discount := v_coupon.max_discount;
                    END IF;
                ELSE
                    v_discount := LEAST(v_coupon.value, v_subtotal);
                END IF;

                -- Update coupon usage count
                UPDATE public.coupons SET used_count = used_count + 1 WHERE id = v_coupon.id;
            END IF;
        END IF;
    END IF;

    -- Calculate Shipping Fee (Free for orders >= Rs 10,000, else standard Rs 250)
    IF v_subtotal >= 10000 THEN
        v_shipping := 0;
    ELSE
        v_shipping := 250;
    END IF;

    v_total := GREATEST(0, v_subtotal - v_discount) + v_shipping;

    -- Create Order Record
    INSERT INTO public.orders (
        id, order_number, customer_id, customer_name, customer_email, customer_phone,
        shipping_address, status, payment_status, payment_method, subtotal,
        discount_amount, shipping_cost, total, coupon_code
    ) VALUES (
        v_order_id, v_order_number, p_customer_id, p_customer_name, p_customer_email, p_customer_phone,
        p_shipping_address, 'Pending', 'Pending', p_payment_method, v_subtotal,
        v_discount, v_shipping, v_total, p_coupon_code
    );

    -- Create Order Items Snapshots
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_variant_id := (v_item->>'variant_id')::UUID;
        v_quantity := (v_item->>'quantity')::INT;

        SELECT * INTO v_variant FROM public.product_variants WHERE id = v_variant_id;
        SELECT * INTO v_product FROM public.products WHERE id = v_variant.product_id;

        v_unit_price := COALESCE(v_variant.sale_price, v_variant.price);
        v_line_total := v_unit_price * v_quantity;

        INSERT INTO public.order_items (
            order_id, product_id, variant_id, product_name, variant_size, sku, unit_price, quantity, line_total
        ) VALUES (
            v_order_id, v_product.id, v_variant.id, v_product.name, v_variant.size, v_variant.sku, v_unit_price, v_quantity, v_line_total
        );
    END LOOP;

    -- Create Initial Payment Record
    INSERT INTO public.payments (
        order_id, order_number, customer_name, customer_email, amount, method, status
    ) VALUES (
        v_order_id, v_order_number, p_customer_name, p_customer_email, v_total, p_payment_method, 'Pending'
    );

    -- Create Order Status History
    INSERT INTO public.order_status_history (
        order_id, status, note
    ) VALUES (
        v_order_id, 'Pending', 'Order created and payment pending.'
    );

    -- Create Coupon Usage Record if applied
    IF v_discount > 0 AND v_coupon.id IS NOT NULL THEN
        INSERT INTO public.coupon_usage (coupon_id, user_id, order_id, discount_amount)
        VALUES (v_coupon.id, p_customer_id, v_order_id, v_discount);
    END IF;

    RETURN jsonb_build_object(
        'order_id', v_order_id,
        'order_number', v_order_number,
        'subtotal', v_subtotal,
        'discount', v_discount,
        'shipping', v_shipping,
        'total', v_total,
        'status', 'Pending'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Server-Side Function: Verify Payment
CREATE OR REPLACE FUNCTION public.verify_payment(
    p_payment_id UUID,
    p_staff_id UUID,
    p_new_status TEXT, -- 'Verified', 'Paid', 'Rejected', 'Failed'
    p_note TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_payment RECORD;
BEGIN
    IF NOT public.is_staff(p_staff_id) THEN
        RAISE EXCEPTION 'Access Denied: Only authorized staff members can verify payments.';
    END IF;

    SELECT * INTO v_payment FROM public.payments WHERE id = p_payment_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Payment record % not found.', p_payment_id;
    END IF;

    IF p_new_status NOT IN ('Verified', 'Paid', 'Rejected', 'Failed') THEN
        RAISE EXCEPTION 'Invalid payment status: %', p_new_status;
    END IF;

    -- Update payment
    UPDATE public.payments
    SET status = p_new_status,
        verified_by = p_staff_id,
        verified_at = NOW(),
        updated_at = NOW()
    WHERE id = p_payment_id;

    -- Update order payment_status & order_status
    IF p_new_status IN ('Verified', 'Paid') THEN
        UPDATE public.orders
        SET payment_status = 'Paid',
            status = CASE WHEN status = 'Pending' THEN 'Confirmed' ELSE status END,
            updated_at = NOW()
        WHERE id = v_payment.order_id;
    ELSIF p_new_status IN ('Rejected', 'Failed') THEN
        UPDATE public.orders
        SET payment_status = 'Failed',
            updated_at = NOW()
        WHERE id = v_payment.order_id;
    END IF;

    -- Audit Payment Event
    INSERT INTO public.payment_events (
        payment_id, event_type, actor_id, notes
    ) VALUES (
        p_payment_id,
        CASE WHEN p_new_status IN ('Verified', 'Paid') THEN 'approved' ELSE 'rejected' END,
        p_staff_id,
        COALESCE(p_note, 'Payment status updated to ' || p_new_status)
    );

    RETURN jsonb_build_object('success', true, 'payment_id', p_payment_id, 'status', p_new_status);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Server-Side Function: Atomic Inventory Stock Adjustment
CREATE OR REPLACE FUNCTION public.adjust_inventory_stock(
    p_variant_id UUID,
    p_quantity_change INT,
    p_transaction_type TEXT DEFAULT 'adjustment',
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_staff_id UUID := auth.uid();
    v_old_stock INT;
    v_new_stock INT;
    v_variant RECORD;
BEGIN
    -- Security Check: Only authorized staff can adjust inventory stock
    IF NOT public.is_staff(v_staff_id) THEN
        RAISE EXCEPTION 'Access Denied: Only authorized staff members can adjust inventory stock.';
    END IF;

    -- Validate transaction type
    IF p_transaction_type NOT IN ('sale', 'restock', 'adjustment', 'return', 'cancellation_release') THEN
        RAISE EXCEPTION 'Invalid transaction type: %', p_transaction_type;
    END IF;

    -- Lock variant row for update to guarantee atomic update
    SELECT * INTO v_variant
    FROM public.product_variants
    WHERE id = p_variant_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Product variant % not found.', p_variant_id;
    END IF;

    v_old_stock := v_variant.stock;
    v_new_stock := v_old_stock + p_quantity_change;

    IF v_new_stock < 0 THEN
        RAISE EXCEPTION 'Cannot adjust stock below 0. Current stock: %, Change: %', v_old_stock, p_quantity_change;
    END IF;

    -- Update variant stock
    UPDATE public.product_variants
    SET stock = v_new_stock,
        updated_at = NOW()
    WHERE id = p_variant_id;

    -- Insert audit log
    INSERT INTO public.inventory_transactions (
        variant_id, transaction_type, quantity_change, previous_stock, new_stock, created_by, notes
    ) VALUES (
        p_variant_id, p_transaction_type, p_quantity_change, v_old_stock, v_new_stock, v_staff_id, COALESCE(p_notes, 'Manual inventory adjustment')
    );

    RETURN jsonb_build_object(
        'success', true,
        'variant_id', p_variant_id,
        'previous_stock', v_old_stock,
        'new_stock', v_new_stock,
        'quantity_change', p_quantity_change
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- ====================================================================
-- 12. ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fragrance_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_fragrance_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_settings ENABLE ROW LEVEL SECURITY;

-- Catalog Policies (Public Read, Staff Write)
DROP POLICY IF EXISTS "Public Read Active Categories" ON public.categories;
DROP POLICY IF EXISTS "Staff Manage Categories" ON public.categories;
CREATE POLICY "Public Read Active Categories" ON public.categories FOR SELECT USING (active = true OR public.is_staff(auth.uid()));
CREATE POLICY "Staff Manage Categories" ON public.categories FOR ALL USING (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Public Read Active Collections" ON public.collections;
DROP POLICY IF EXISTS "Staff Manage Collections" ON public.collections;
CREATE POLICY "Public Read Active Collections" ON public.collections FOR SELECT USING (active = true OR public.is_staff(auth.uid()));
CREATE POLICY "Staff Manage Collections" ON public.collections FOR ALL USING (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Public Read Active Products" ON public.products;
DROP POLICY IF EXISTS "Staff Manage Products" ON public.products;
CREATE POLICY "Public Read Active Products" ON public.products FOR SELECT USING (active = true OR public.is_staff(auth.uid()));
CREATE POLICY "Staff Manage Products" ON public.products FOR ALL USING (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Public Read Product Images" ON public.product_images;
DROP POLICY IF EXISTS "Staff Manage Product Images" ON public.product_images;
CREATE POLICY "Public Read Product Images" ON public.product_images FOR SELECT USING (true);
CREATE POLICY "Staff Manage Product Images" ON public.product_images FOR ALL USING (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Public Read Active Variants" ON public.product_variants;
DROP POLICY IF EXISTS "Staff Manage Product Variants" ON public.product_variants;
CREATE POLICY "Public Read Active Variants" ON public.product_variants FOR SELECT USING (active = true OR public.is_staff(auth.uid()));
CREATE POLICY "Staff Manage Product Variants" ON public.product_variants FOR ALL USING (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Public Read Collection Products" ON public.collection_products;
DROP POLICY IF EXISTS "Staff Manage Collection Products" ON public.collection_products;
CREATE POLICY "Public Read Collection Products" ON public.collection_products FOR SELECT USING (true);
CREATE POLICY "Staff Manage Collection Products" ON public.collection_products FOR ALL USING (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Public Read Notes" ON public.fragrance_notes;
DROP POLICY IF EXISTS "Staff Manage Notes" ON public.fragrance_notes;
CREATE POLICY "Public Read Notes" ON public.fragrance_notes FOR SELECT USING (true);
CREATE POLICY "Staff Manage Notes" ON public.fragrance_notes FOR ALL USING (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Public Read Product Notes" ON public.product_fragrance_notes;
DROP POLICY IF EXISTS "Staff Manage Product Notes" ON public.product_fragrance_notes;
CREATE POLICY "Public Read Product Notes" ON public.product_fragrance_notes FOR SELECT USING (true);
CREATE POLICY "Staff Manage Product Notes" ON public.product_fragrance_notes FOR ALL USING (public.is_staff(auth.uid()));

-- Profile & Customer Policies
DROP POLICY IF EXISTS "Users Read Own Profile" ON public.profiles;
DROP POLICY IF EXISTS "Users Update Own Profile" ON public.profiles;
DROP POLICY IF EXISTS "Staff Manage Profiles" ON public.profiles;
CREATE POLICY "Users Read Own Profile" ON public.profiles FOR SELECT USING (auth.uid() = id OR public.is_staff(auth.uid()));
CREATE POLICY "Users Update Own Profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Staff Manage Profiles" ON public.profiles FOR ALL USING (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Users Read Own Customer Record" ON public.customers;
DROP POLICY IF EXISTS "Staff Manage Customers" ON public.customers;
CREATE POLICY "Users Read Own Customer Record" ON public.customers FOR SELECT USING (profile_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "Staff Manage Customers" ON public.customers FOR ALL USING (public.is_staff(auth.uid()));

-- Orders & Payments Policies
DROP POLICY IF EXISTS "Users Read Own Orders" ON public.orders;
DROP POLICY IF EXISTS "Staff Manage Orders" ON public.orders;
CREATE POLICY "Users Read Own Orders" ON public.orders FOR SELECT USING (customer_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "Staff Manage Orders" ON public.orders FOR ALL USING (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Users Read Own Order Items" ON public.order_items;
DROP POLICY IF EXISTS "Staff Manage Order Items" ON public.order_items;
CREATE POLICY "Users Read Own Order Items" ON public.order_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders WHERE id = order_items.order_id AND (customer_id = auth.uid() OR public.is_staff(auth.uid())))
);
CREATE POLICY "Staff Manage Order Items" ON public.order_items FOR ALL USING (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Users Read Own Payments" ON public.payments;
DROP POLICY IF EXISTS "Staff Manage Payments" ON public.payments;
CREATE POLICY "Users Read Own Payments" ON public.payments FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders WHERE id = payments.order_id AND (customer_id = auth.uid() OR public.is_staff(auth.uid())))
);
CREATE POLICY "Staff Manage Payments" ON public.payments FOR ALL USING (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff Manage Payment Events" ON public.payment_events;
DROP POLICY IF EXISTS "Staff Manage Inventory" ON public.inventory;
DROP POLICY IF EXISTS "Staff Manage Inventory Logs" ON public.inventory_transactions;
CREATE POLICY "Staff Manage Payment Events" ON public.payment_events FOR ALL USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff Manage Inventory" ON public.inventory FOR ALL USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff Manage Inventory Logs" ON public.inventory_transactions FOR ALL USING (public.is_staff(auth.uid()));

-- Cart & Wishlist Policies
DROP POLICY IF EXISTS "User Manage Own Cart" ON public.cart;
DROP POLICY IF EXISTS "User Manage Own Cart Items" ON public.cart_items;
CREATE POLICY "User Manage Own Cart" ON public.cart FOR ALL USING (user_id = auth.uid() OR session_token IS NOT NULL);
CREATE POLICY "User Manage Own Cart Items" ON public.cart_items FOR ALL USING (
    EXISTS (SELECT 1 FROM public.cart WHERE id = cart_items.cart_id AND (user_id = auth.uid() OR session_token IS NOT NULL))
);

DROP POLICY IF EXISTS "User Manage Own Wishlist" ON public.wishlists;
DROP POLICY IF EXISTS "User Manage Own Wishlist Items" ON public.wishlist_items;
CREATE POLICY "User Manage Own Wishlist" ON public.wishlists FOR ALL USING (user_id = auth.uid());
CREATE POLICY "User Manage Own Wishlist Items" ON public.wishlist_items FOR ALL USING (
    EXISTS (SELECT 1 FROM public.wishlists WHERE id = wishlist_items.wishlist_id AND user_id = auth.uid())
);

-- Reviews Policies
DROP POLICY IF EXISTS "Public Read Approved Reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users Create Reviews" ON public.reviews;
DROP POLICY IF EXISTS "Staff Manage Reviews" ON public.reviews;
CREATE POLICY "Public Read Approved Reviews" ON public.reviews FOR SELECT USING (status = 'Approved' OR public.is_staff(auth.uid()));
CREATE POLICY "Users Create Reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Staff Manage Reviews" ON public.reviews FOR ALL USING (public.is_staff(auth.uid()));

-- CMS & Settings Policies
DROP POLICY IF EXISTS "Public Read CMS Sections" ON public.homepage_sections;
DROP POLICY IF EXISTS "Staff Manage CMS Sections" ON public.homepage_sections;
CREATE POLICY "Public Read CMS Sections" ON public.homepage_sections FOR SELECT USING (active = true OR public.is_staff(auth.uid()));
CREATE POLICY "Staff Manage CMS Sections" ON public.homepage_sections FOR ALL USING (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Public Read Banners" ON public.banners;
DROP POLICY IF EXISTS "Staff Manage Banners" ON public.banners;
CREATE POLICY "Public Read Banners" ON public.banners FOR SELECT USING (active = true OR public.is_staff(auth.uid()));
CREATE POLICY "Staff Manage Banners" ON public.banners FOR ALL USING (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Public Read Settings" ON public.site_settings;
DROP POLICY IF EXISTS "Staff Manage Settings" ON public.site_settings;
CREATE POLICY "Public Read Settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Staff Manage Settings" ON public.site_settings FOR ALL USING (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Public Read SEO Settings" ON public.seo_settings;
DROP POLICY IF EXISTS "Staff Manage SEO Settings" ON public.seo_settings;
CREATE POLICY "Public Read SEO Settings" ON public.seo_settings FOR SELECT USING (true);
CREATE POLICY "Staff Manage SEO Settings" ON public.seo_settings FOR ALL USING (public.is_staff(auth.uid()));

-- ====================================================================
-- 13. STORAGE BUCKETS & STORAGE OBJECT RLS POLICIES
-- ====================================================================

-- Insert Default Storage Buckets
INSERT INTO storage.buckets (id, name, public) VALUES
('products', 'products', true),
('categories', 'categories', true),
('collections', 'collections', true),
('homepage', 'homepage', true),
('banners', 'banners', true),
('reviews', 'reviews', true),
('avatars', 'avatars', true),
('payment-proofs', 'payment-proofs', false) -- MUST BE PRIVATE!
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- Storage Policies for Public Buckets
DROP POLICY IF EXISTS "Public Storage Read Access" ON storage.objects;
DROP POLICY IF EXISTS "Staff Storage All Access" ON storage.objects;
CREATE POLICY "Public Storage Read Access" ON storage.objects FOR SELECT USING (bucket_id IN ('products', 'categories', 'collections', 'homepage', 'banners', 'reviews', 'avatars'));
CREATE POLICY "Staff Storage All Access" ON storage.objects FOR ALL USING (public.is_staff(auth.uid()));

-- Strict Private Storage Policies for 'payment-proofs' Bucket
DROP POLICY IF EXISTS "Customer Upload Payment Proof" ON storage.objects;
DROP POLICY IF EXISTS "Customer & Staff Read Payment Proof" ON storage.objects;
CREATE POLICY "Customer Upload Payment Proof" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'payment-proofs' AND auth.role() = 'authenticated'
);

CREATE POLICY "Customer & Staff Read Payment Proof" ON storage.objects FOR SELECT USING (
    bucket_id = 'payment-proofs' AND (
        auth.uid() = owner OR public.is_staff(auth.uid())
    )
);
