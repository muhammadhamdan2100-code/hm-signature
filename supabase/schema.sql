-- ====================================================================
-- HM SIGNATURE LUXURY FRAGRANCE - SUPABASE POSTGRESQL SCHEMA & SEEDS
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
DO $$ BEGIN
    CREATE TYPE user_role_type AS ENUM ('Super Admin', 'Manager', 'Order Manager', 'Content Manager', 'Customer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_status_type AS ENUM ('Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Refunded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status_type AS ENUM ('Pending', 'Paid', 'Failed', 'Refunded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. PROFILES TABLE (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    role user_role_type DEFAULT 'Customer'::user_role_type NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. ROLES & PERMISSIONS
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL, -- e.g., 'manage_products', 'manage_orders'
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- 5. CATEGORIES & COLLECTIONS
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    banner_url TEXT,
    featured BOOLEAN DEFAULT FALSE NOT NULL,
    active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 6. PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    full_description TEXT,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    sale_price NUMERIC(10, 2) CHECK (sale_price IS NULL OR sale_price < price),
    stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    low_stock_threshold INT NOT NULL DEFAULT 5 CHECK (low_stock_threshold >= 0),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    collection_id UUID REFERENCES public.collections(id) ON DELETE SET NULL,
    gender TEXT CHECK (gender IN ('men', 'women', 'unisex')) DEFAULT 'unisex' NOT NULL,
    fragrance_type TEXT DEFAULT 'Extrait de Parfum' NOT NULL,
    size TEXT DEFAULT '100ML' NOT NULL,
    concentration TEXT DEFAULT 'Extrait de Parfum (25-30% Oil)' NOT NULL,
    top_notes TEXT[] DEFAULT '{}'::TEXT[],
    heart_notes TEXT[] DEFAULT '{}'::TEXT[],
    base_notes TEXT[] DEFAULT '{}'::TEXT[],
    images TEXT[] DEFAULT '{}'::TEXT[],
    photos TEXT[] DEFAULT '{}'::TEXT[],
    featured BOOLEAN DEFAULT FALSE NOT NULL,
    bestseller BOOLEAN DEFAULT FALSE NOT NULL,
    new_arrival BOOLEAN DEFAULT TRUE NOT NULL,
    active BOOLEAN DEFAULT TRUE NOT NULL,
    seo_title TEXT,
    seo_description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Collection Products Pivot Table
CREATE TABLE IF NOT EXISTS public.collection_products (
    collection_id UUID REFERENCES public.collections(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    PRIMARY KEY (collection_id, product_id)
);

-- 7. CUSTOMERS & ADDRESSES
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    status TEXT DEFAULT 'Active' NOT NULL,
    total_spent NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    orders_count INT DEFAULT 0 NOT NULL,
    joined_date DATE DEFAULT CURRENT_DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    title TEXT DEFAULT 'Home',
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    country TEXT DEFAULT 'Pakistan' NOT NULL,
    is_default BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 8. ORDERS & ORDER ITEMS
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT UNIQUE NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    shipping_address JSONB NOT NULL,
    status order_status_type DEFAULT 'Pending'::order_status_type NOT NULL,
    payment_status payment_status_type DEFAULT 'Pending'::payment_status_type NOT NULL,
    payment_method TEXT DEFAULT 'Stripe / Credit Card' NOT NULL,
    stripe_session_id TEXT,
    subtotal NUMERIC(10, 2) NOT NULL,
    discount_amount NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    shipping_cost NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    total NUMERIC(10, 2) NOT NULL,
    coupon_code TEXT,
    courier TEXT DEFAULT 'DHL Express Luxury',
    tracking_number TEXT,
    shipping_status TEXT DEFAULT 'Processing',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    product_sku TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    total NUMERIC(10, 2) NOT NULL,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.order_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    status order_status_type NOT NULL,
    note TEXT,
    created_by TEXT DEFAULT 'System',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 9. INVENTORY & INVENTORY TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('Sale', 'Restock', 'Adjustment', 'Return')) NOT NULL,
    quantity_change INT NOT NULL,
    new_stock INT NOT NULL,
    reference_id TEXT, -- Order ID or Batch Number
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 10. COUPONS & USAGE
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    type TEXT CHECK (type IN ('percentage', 'fixed')) NOT NULL,
    value NUMERIC(10, 2) NOT NULL CHECK (value > 0),
    min_spend NUMERIC(10, 2) DEFAULT 0.00,
    max_discount NUMERIC(10, 2),
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    usage_limit INT,
    used_count INT DEFAULT 0 NOT NULL,
    per_user_limit INT DEFAULT 1,
    active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.coupon_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coupon_id UUID REFERENCES public.coupons(id) ON DELETE CASCADE,
    customer_email TEXT NOT NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    used_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 11. REVIEWS
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    status TEXT CHECK (status IN ('Approved', 'Pending', 'Rejected')) DEFAULT 'Pending' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 12. CARTS & CART ITEMS
CREATE TABLE IF NOT EXISTS public.cart (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cart_id UUID REFERENCES public.cart(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(cart_id, product_id)
);

-- 13. WISHLISTS & WISHLIST ITEMS
CREATE TABLE IF NOT EXISTS public.wishlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.wishlist_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wishlist_id UUID REFERENCES public.wishlists(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(wishlist_id, product_id)
);

-- 14. HOMEPAGE SECTIONS & BANNERS (CMS)
CREATE TABLE IF NOT EXISTS public.homepage_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL, -- e.g. 'announcement_bar', 'hero', 'brand_values'
    title TEXT,
    subtitle TEXT,
    content JSONB NOT NULL,
    active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.banners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    subtitle TEXT,
    image_url TEXT NOT NULL,
    link_url TEXT,
    position TEXT DEFAULT 'hero',
    active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 15. MARKETING CAMPAIGNS & NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    subject TEXT NOT NULL,
    target_audience TEXT DEFAULT 'All VIP Members',
    status TEXT DEFAULT 'Scheduled',
    scheduled_at TIMESTAMPTZ,
    sent_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT CHECK (type IN ('order', 'inventory', 'customer', 'system')) DEFAULT 'system',
    read BOOLEAN DEFAULT FALSE NOT NULL,
    link TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.abandoned_carts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    items JSONB NOT NULL,
    cart_value NUMERIC(10, 2) NOT NULL,
    recovery_status TEXT DEFAULT 'Pending Recovery',
    last_reminded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 16. SHIPPING METHODS & ZONES
CREATE TABLE IF NOT EXISTS public.shipping_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    carrier TEXT DEFAULT 'DHL Express',
    rate NUMERIC(10, 2) NOT NULL CHECK (rate >= 0),
    free_above NUMERIC(10, 2),
    estimated_days TEXT DEFAULT '1-2 Days',
    active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 17. PAYMENTS & PAYMENT EVENTS
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    stripe_session_id TEXT UNIQUE,
    stripe_payment_intent TEXT,
    amount NUMERIC(10, 2) NOT NULL,
    currency TEXT DEFAULT 'PKR',
    status payment_status_type DEFAULT 'Pending'::payment_status_type NOT NULL,
    raw_payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 18. SITE SETTINGS & SEO SETTINGS
CREATE TABLE IF NOT EXISTS public.site_settings (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    store_name TEXT DEFAULT 'HM Signature Luxury Fragrance',
    contact_email TEXT DEFAULT 'concierge@hmsignature.com',
    contact_phone TEXT DEFAULT '+92 300 8472910',
    whatsapp_number TEXT DEFAULT '+923008472910',
    address TEXT DEFAULT 'Gulberg III, Lahore, Punjab, Pakistan',
    currency TEXT DEFAULT 'PKR',
    currency_symbol TEXT DEFAULT 'Rs.',
    maintenance_mode BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.seo_settings (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    meta_title TEXT DEFAULT 'HM Signature — Luxury Fragrance & Extrait de Parfum',
    meta_description TEXT DEFAULT 'Discover luxury extrait de parfum handcrafted with rare Bulgarian Rose, French Lavender, Indian Amber, and Royal Cambodian Oud.',
    keywords TEXT DEFAULT 'perfume, luxury fragrance, oud, extrait de parfum, hm signature',
    og_image TEXT DEFAULT '/logo.png',
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ====================================================================
-- INDEXES FOR PERFORMANCE
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(active);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_sections ENABLE ROW LEVEL SECURITY;

-- Products: Public can read active products, Admin can read/write all
CREATE POLICY "Public Read Active Products" ON public.products FOR SELECT USING (active = true);
CREATE POLICY "Admin Full Access Products" ON public.products FOR ALL USING (
    auth.jwt() ->> 'email' IN (SELECT email FROM public.profiles WHERE role IN ('Super Admin', 'Manager', 'Content Manager'))
);

-- Categories & Collections: Public can read, Admin write
CREATE POLICY "Public Read Categories" ON public.categories FOR SELECT USING (active = true);
CREATE POLICY "Admin Full Access Categories" ON public.categories FOR ALL USING (true);
CREATE POLICY "Public Read Collections" ON public.collections FOR SELECT USING (active = true);
CREATE POLICY "Admin Full Access Collections" ON public.collections FOR ALL USING (true);

-- Reviews: Public can read approved reviews, customers insert, admin manage
CREATE POLICY "Public Read Approved Reviews" ON public.reviews FOR SELECT USING (status = 'Approved');
CREATE POLICY "Customers Insert Reviews" ON public.reviews FOR INSERT WITH CHECK (true);

-- Orders: Customer can read own orders, Admin full access
CREATE POLICY "Customer Read Own Orders" ON public.orders FOR SELECT USING (
    customer_email = auth.jwt() ->> 'email'
);
CREATE POLICY "Admin Full Access Orders" ON public.orders FOR ALL USING (true);

-- Profiles: Users manage own profile, Admin manage all
CREATE POLICY "Users Read Own Profile" ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users Update Own Profile" ON public.profiles FOR UPDATE USING (id = auth.uid());

-- ====================================================================
-- SEED DATA SETUP
-- ====================================================================
INSERT INTO public.site_settings (id, store_name, contact_email)
VALUES (1, 'HM Signature Luxury Fragrance', 'concierge@hmsignature.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.seo_settings (id, meta_title)
VALUES (1, 'HM Signature — Luxury Fragrance & Extrait de Parfum')
ON CONFLICT (id) DO NOTHING;

-- Seed Categories
INSERT INTO public.categories (name, slug, description, active) VALUES
('Woody Oriental', 'woody-oriental', 'Opulent Indian Sandalwood, Rare Oud, and Rich Amber', true),
('Floral Amber', 'floral-amber', 'Bulgarian Damask Rose married with Golden Amber', true),
('Fresh Citrus', 'fresh-citrus', 'Italian Bergamot, Sun-drenched Lemon, and Sparkling Neroli', true),
('Leathery Musk', 'leathery-musk', 'Tuscan Leather, Velvet Saffron, and White Musk', true)
ON CONFLICT (slug) DO NOTHING;

-- Seed Collections
INSERT INTO public.collections (name, slug, description, featured, active) VALUES
('Royal Extrait Collection', 'royal-extrait-collection', 'Masterpiece extraits infused with 30% pure fragrance oil', true, true),
('Private Blend Series', 'private-blend-series', 'Limited edition artisan formulations for fragrance connoisseurs', true, true),
('Unisex Collection', 'unisex-collection', 'Genderless luxury scents crafted for universal elegance', false, true)
ON CONFLICT (slug) DO NOTHING;

-- Seed Fragrance Products
INSERT INTO public.products (
    sku, name, slug, description, full_description, price, sale_price, stock, low_stock_threshold,
    gender, fragrance_type, size, concentration, top_notes, heart_notes, base_notes,
    featured, bestseller, new_arrival, active, seo_title
) VALUES
(
    'HM-OUD-001', 'Oud Royale', 'oud-royale',
    'A majestic blend of aged Cambodian Oud, Bulgarian Rose, and Golden Amber.',
    'Oud Royale is the crowning jewel of the HM Signature collection. Handcrafted in small batches, this extrait de parfum contains 30% pure fragrance oil concentrate. Opening with luminous saffron and bergamot, it leads into a deep heart of rare Bulgarian Damask rose before settling into a warm, smoky base of 25-year aged Cambodian agarwood and amber resins.',
    4200, 3800, 45, 10, 'unisex', 'Extrait de Parfum', '100ML', 'Extrait de Parfum (30% Oil)',
    ARRAY['Saffron', 'Bergamot', 'Cardamom'], ARRAY['Bulgarian Rose', 'Oud Wood', 'Patchouli'], ARRAY['Cambodian Agarwood', 'Amber', 'Vanilla Bean'],
    true, true, true, true, 'Oud Royale — HM Signature Extrait de Parfum'
),
(
    'HM-VEL-002', 'Velvet Rose', 'velvet-rose',
    'Sensual Damask Rose layered over White Musk and Vanilla Bean.',
    'Velvet Rose encapsulates pure romantic sophistication. Intense crimson rose petals hand-harvested at dawn are blended with soft white musk and rich Madagascan vanilla.',
    3800, NULL, 60, 15, 'women', 'Extrait de Parfum', '100ML', 'Extrait de Parfum (25% Oil)',
    ARRAY['Pink Pepper', 'Mandarin', 'Pear'], ARRAY['Damask Rose', 'Peony', 'Iris'], ARRAY['White Musk', 'Madagascar Vanilla', 'Cedarwood'],
    true, true, false, true, 'Velvet Rose — Luxury Fragrance'
),
(
    'HM-AMB-003', 'Amber Noir', 'amber-noir',
    'Smoky Amber, Tonka Bean, and Tuscan Leather in dark harmony.',
    'An intoxicating evening fragrance featuring rich obsidian amber resins paired with supple Tuscan leather and roasted tonka bean.',
    3950, NULL, 30, 8, 'men', 'Extrait de Parfum', '100ML', 'Extrait de Parfum (28% Oil)',
    ARRAY['Cinnamon', 'Nutmeg', 'Grapefruit'], ARRAY['Tuscan Leather', 'Amber Resin', 'Cacao'], ARRAY['Tonka Bean', 'Smoky Vetiver', 'Sandalwood'],
    true, false, true, true, 'Amber Noir — Luxury Fragrance'
),
(
    'HM-AUR-004', 'Aura Nocturne', 'aura-nocturne',
    'Midnight Lavender, Incense, and Cashmere Wood.',
    'Evoking the quiet mystery of midnight under desert stars, Aura Nocturne brings together French lavender, smoked incense, and soothing cashmere wood.',
    3600, 3400, 25, 10, 'unisex', 'Extrait de Parfum', '100ML', 'Extrait de Parfum (25% Oil)',
    ARRAY['French Lavender', 'Bergamot'], ARRAY['Smoked Incense', 'Geranium'], ARRAY['Cashmere Wood', 'Musk', 'Oud'],
    false, true, true, true, 'Aura Nocturne — Extrait de Parfum'
),
(
    'HM-MYS-005', 'Mystic Oud', 'mystic-oud',
    'Rare Royal Oud enveloped in Sweet Tobacco and Dark Honey.',
    'Mystic Oud is an enigmatic creation combining royal agarwood with sweet pipe tobacco leaves and raw golden honey.',
    4500, NULL, 18, 5, 'unisex', 'Extrait de Parfum', '100ML', 'Extrait de Parfum (30% Oil)',
    ARRAY['Honey', 'Sweet Spice'], ARRAY['Pipe Tobacco', 'Agarwood'], ARRAY['Dark Oud', 'Labdanum', 'Benzoin'],
    true, true, false, true, 'Mystic Oud — HM Signature'
)
ON CONFLICT (sku) DO NOTHING;

-- Seed Initial Coupons
INSERT INTO public.coupons (code, type, value, min_spend, active) VALUES
('HMSIGNATURE10', 'percentage', 10, 3000, true),
('VIPLUXURY500', 'fixed', 500, 5000, true)
ON CONFLICT (code) DO NOTHING;
