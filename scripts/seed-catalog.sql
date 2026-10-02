-- ====================================================================
-- HM SIGNATURE — INITIAL CATALOG SEED (development / first-deployment)
-- Additive and idempotent: every statement no-ops if the row already
-- exists (ON CONFLICT / WHERE NOT EXISTS). Safe to re-run.
-- Will NEVER overwrite existing production products or prices.
-- Apply via: npx supabase db query --linked "$(cat scripts/seed-catalog.sql | tr '\n' ' ')"
-- ====================================================================

-- Idempotent catalog seed for HM Signature (additive only, ON CONFLICT/no-op guards)

INSERT INTO public.categories (name, slug, active) VALUES
  ('Woody Oriental','woody-oriental',true),
  ('Fresh Woods','fresh-woods',true),
  ('Floral Amber','floral-amber',true),
  ('Spicy Woody','spicy-woody',true),
  ('Floral Musk','floral-musk',true),
  ('Amber Vanilla','amber-vanilla',true)
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.collections (name, slug, featured, active) VALUES
  ('Men''s Collection','mens-collection',true,true),
  ('Women''s Collection','womens-collection',true,true),
  ('Unisex Collection','unisex-collection',true,true)
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.products (sku,name,slug,description,full_description,base_price,category_id,collection_id,gender,featured,bestseller,new_arrival,active)
SELECT 'HM-MYS','Mystic Oud','mystic-oud',
 'Deep, smoky oud layered with saffron and Bulgarian rose for an uncompromising signature.',
 'A dark, meditative extrait built on aged Cambodian oud, saffron and Taif rose. Handcrafted in small batches and aged in dark oak casks.',
 4500,(SELECT id FROM public.categories WHERE name='Woody Oriental'),(SELECT id FROM public.collections WHERE name='Unisex Collection'),'unisex',true,true,false,true
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE slug='mystic-oud');

INSERT INTO public.products (sku,name,slug,description,full_description,base_price,category_id,collection_id,gender,featured,bestseller,new_arrival,active)
SELECT 'HM-UNK','Un Kimmy','un-kimmy',
 'Clean, modern woods with a crisp citrus opening — effortlessly everyday.',
 'Bright bergamot and pink pepper melt into cedar and white musk. A refined daily scent with quiet confidence.',
 2800,(SELECT id FROM public.categories WHERE name='Fresh Woods'),(SELECT id FROM public.collections WHERE name='Men''s Collection'),'men',true,false,false,true
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE slug='un-kimmy');

INSERT INTO public.products (sku,name,slug,description,full_description,base_price,category_id,collection_id,gender,featured,bestseller,new_arrival,active)
SELECT 'HM-HRL','Harm Land','harm-land',
 'Romantic amber and rose with a powdery velvet finish.',
 'Damask rose and jasmine absolute wrapped in warm amber and vanilla — made for unforgettable evenings.',
 3600,(SELECT id FROM public.categories WHERE name='Floral Amber'),(SELECT id FROM public.collections WHERE name='Women''s Collection'),'women',true,true,false,true
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE slug='harm-land');

INSERT INTO public.products (sku,name,slug,description,full_description,base_price,category_id,collection_id,gender,featured,bestseller,new_arrival,active)
SELECT 'HM-AUR','Aura Nocturne','aura-nocturne',
 'Smoky spices and leather for the after-dark hours.',
 'Black pepper, incense and oud combine with a leather base — magnetic, intense, long-wearing.',
 4200,(SELECT id FROM public.categories WHERE name='Spicy Woody'),(SELECT id FROM public.collections WHERE name='Men''s Collection'),'men',false,true,false,true
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE slug='aura-nocturne');

INSERT INTO public.products (sku,name,slug,description,full_description,base_price,category_id,collection_id,gender,featured,bestseller,new_arrival,active)
SELECT 'HM-RSE','Rose Ember','rose-ember',
 'Elegant modern rose with a warm musky ember glow.',
 'Fresh-cut rose petals over patchouli and white musk — elegant, contemporary, unmistakable.',
 3200,(SELECT id FROM public.categories WHERE name='Floral Musk'),(SELECT id FROM public.collections WHERE name='Women''s Collection'),'women',false,true,false,true
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE slug='rose-ember');

INSERT INTO public.products (sku,name,slug,description,full_description,base_price,category_id,collection_id,gender,featured,bestseller,new_arrival,active)
SELECT 'HM-GDH','Golden Hour','golden-hour',
 'Sun-warmed amber vanilla — pure comfort in a flacon.',
 'Saffron and honey pour over tonka, vanilla and sandalwood for a glowing, skin-like drydown.',
 2500,(SELECT id FROM public.categories WHERE name='Amber Vanilla'),(SELECT id FROM public.collections WHERE name='Unisex Collection'),'unisex',false,false,true,true
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE slug='golden-hour');

INSERT INTO public.product_variants (product_id,size,sku,price,stock)
SELECT p.id, v.size, v.sku, v.price, v.stock
FROM public.products p
JOIN LATERAL (VALUES
  ('10ml', p.sku || '-10ML',  CASE p.slug WHEN 'mystic-oud' THEN 1300 WHEN 'un-kimmy' THEN 850  WHEN 'harm-land' THEN 1100 WHEN 'aura-nocturne' THEN 1300 WHEN 'rose-ember' THEN 1000 ELSE 750  END,
                              CASE p.slug WHEN 'mystic-oud' THEN 33   WHEN 'un-kimmy' THEN 52   WHEN 'harm-land' THEN 30   WHEN 'aura-nocturne' THEN 40   WHEN 'rose-ember' THEN 37   ELSE 47   END),
  ('30ml', p.sku || '-30ML',  CASE p.slug WHEN 'mystic-oud' THEN 3200 WHEN 'un-kimmy' THEN 2000 WHEN 'harm-land' THEN 2500 WHEN 'aura-nocturne' THEN 2900 WHEN 'rose-ember' THEN 2200 ELSE 1750  END,
                              CASE p.slug WHEN 'mystic-oud' THEN 37   WHEN 'un-kimmy' THEN 58   WHEN 'harm-land' THEN 34   WHEN 'aura-nocturne' THEN 45   WHEN 'rose-ember' THEN 42   ELSE 53   END),
  ('50ml', p.sku || '-50ML',  p.base_price,
                              CASE p.slug WHEN 'mystic-oud' THEN 42   WHEN 'un-kimmy' THEN 65   WHEN 'harm-land' THEN 38   WHEN 'aura-nocturne' THEN 51   WHEN 'rose-ember' THEN 47   ELSE 59   END),
  ('100ml', p.sku || '-100ML', CASE p.slug WHEN 'mystic-oud' THEN 7700 WHEN 'un-kimmy' THEN 4800 WHEN 'harm-land' THEN 6100 WHEN 'aura-nocturne' THEN 7100 WHEN 'rose-ember' THEN 5400 ELSE 4250  END,
                              CASE p.slug WHEN 'mystic-oud' THEN 46   WHEN 'un-kimmy' THEN 71   WHEN 'harm-land' THEN 41   WHEN 'aura-nocturne' THEN 56   WHEN 'rose-ember' THEN 51   ELSE 64   END)
) AS v(size, sku, price, stock)
ON TRUE
WHERE p.slug IN ('mystic-oud','un-kimmy','harm-land','aura-nocturne','rose-ember','golden-hour')
ON CONFLICT (product_id,size) DO NOTHING;

INSERT INTO public.coupons (code,type,value,min_spend,usage_limit,active)
SELECT 'WELCOME10','percentage',10,5000,100,true
WHERE NOT EXISTS (SELECT 1 FROM public.coupons WHERE code='WELCOME10');

-- Product photos (mirrors the static catalog mapping; idempotent)
INSERT INTO public.product_images (product_id, image_url, alt_text, display_order, is_primary)
SELECT p.id, v.url, p.name || ' photo', v.ord, v.ord = 0
FROM public.products p
JOIN (VALUES
 ('mystic-oud','/products/mystic-oud-1.jpg',0),
 ('mystic-oud','/products/mystic-oud-2.jpg',1),
 ('mystic-oud','/products/mystic-oud-3.jpg',2),
 ('mystic-oud','/products/mystic-oud-4.jpg',3),
 ('un-kimmy','/products/mystic-oud-3.jpg',0),
 ('harm-land','/products/mystic-oud-1.jpg',0),
 ('aura-nocturne','/products/aura-nocturne-1.jpg',0),
 ('aura-nocturne','/products/aura-nocturne-2.jpg',1),
 ('rose-ember','/products/mystic-oud-2.jpg',0),
 ('golden-hour','/products/brand-signature-box.jpg',0)
) AS v(slug, url, ord) ON v.slug = p.slug
WHERE NOT EXISTS (SELECT 1 FROM public.product_images pi WHERE pi.product_id = p.id AND pi.image_url = v.url);
