-- ============================================================================
-- Phase 1 gap: `fragrance_notes` and `product_fragrance_notes` existed with zero
-- rows, so the olfactory pyramid saved by the admin product form had nothing to
-- read back, and the customer product page could only show family and intensity.
--
-- The project's own catalogue definition in src/data/products.ts records the
-- top/heart/base composition for these six formulas, and those six products are
-- already present in `products` with matching slugs. This migration copies that
-- existing formulation data into the relational notes model. Nothing is invented,
-- nothing is altered and nothing is removed; every statement is an insert guarded
-- by the tables' existing UNIQUE constraints, so it is safe to re-run.
-- ============================================================================

insert into public.fragrance_notes (name, category)
values
    ('Amber', 'base'),
    ('Ambroxan', 'base'),
    ('Bergamot', 'top'),
    ('Black Pepper', 'top'),
    ('Bulgarian Rose', 'heart'),
    ('Cardamom', 'top'),
    ('Cashmere Wood', 'heart'),
    ('Cedar', 'heart'),
    ('Cedarwood', 'base'),
    ('Cinnamon', 'heart'),
    ('Grapefruit', 'top'),
    ('Iris', 'heart'),
    ('Jasmine', 'heart'),
    ('Leather', 'base'),
    ('Mandarin', 'top'),
    ('Musk', 'base'),
    ('Nutmeg', 'top'),
    ('Orange Blossom', 'heart'),
    ('Oud Wood', 'heart'),
    ('Pear', 'top'),
    ('Peony', 'heart'),
    ('Pink Pepper', 'top'),
    ('Pink Peppercorn', 'top'),
    ('Praline', 'heart'),
    ('Raspberry', 'top'),
    ('Saffron', 'top'),
    ('Sage', 'heart'),
    ('Sandalwood', 'base'),
    ('Smoked Woods', 'base'),
    ('Suede', 'base'),
    ('Tobacco Leaf', 'heart'),
    ('Tonka Bean', 'base'),
    ('Tuberose', 'heart'),
    ('Turkish Rose', 'heart'),
    ('Vanilla', 'base'),
    ('Vetiver', 'heart'),
    ('Violet', 'heart'),
    ('White Musk', 'base')
on conflict (name) do nothing;

-- Composition links, resolved by slug so the statements never hard-code uuids.
-- Mystic Oud (mystic-oud)
insert into public.product_fragrance_notes (product_id, note_id, note_type)
select p.id, fn.id, 'top' from public.products p join public.fragrance_notes fn on fn.name = 'Saffron'
where p.slug = 'mystic-oud' and not exists (select 1 from public.product_fragrance_notes x where x.product_id = p.id and x.note_id = fn.id and x.note_type = 'top');
insert into public.product_fragrance_notes (product_id, note_id, note_type)
select p.id, fn.id, 'top' from public.products p join public.fragrance_notes fn on fn.name = 'Bergamot'
where p.slug = 'mystic-oud' and not exists (select 1 from public.product_fragrance_notes x where x.product_id = p.id and x.note_id = fn.id and x.note_type = 'top');
insert into public.product_fragrance_notes (product_id, note_id, note_type)
select p.id, fn.id, 'top' from public.products p join public.fragrance_notes fn on fn.name = 'Pink Pepper'
where p.slug = 'mystic-oud' and not exists (select 1 from public.product_fragrance_notes x where x.product_id = p.id and x.note_id = fn.id and x.note_type = 'top');
insert into public.product_fragrance_notes (product_id, note_id, note_type)
select p.id, fn.id, 'heart' from public.products p join public.fragrance_notes fn on fn.name = 'Bulgarian Rose'
where p.slug = 'mystic-oud' and not exists (select 1 from public.product_fragrance_notes x where x.product_id = p.id and x.note_id = fn.id and x.note_type = 'heart');
insert into public.product_fragrance_notes (product_id, note_id, note_type)
select p.id, fn.id, 'heart' from public.products p join public.fragrance_notes fn on fn.name = 'Oud Wood'
where p.slug = 'mystic-oud' and not exists (select 1 from public.product_fragrance_notes x where x.product_id = p.id and x.note_id = fn.id and x.note_type = 'heart');
insert into public.product_fragrance_notes (product_id, note_id, note_type)
select p.id, fn.id, 'heart' from public.products p join public.fragrance_notes fn on fn.name = 'Cedar'
where p.slug = 'mystic-oud' and not exists (select 1 from public.product_fragrance_notes x where x.product_id = p.id and x.note_id = fn.id and x.note_type = 'heart');
insert into public.product_fragrance_notes (product_id, note_id, note_type)
select p.id, fn.id, 'base' from public.products p join public.fragrance_notes fn on fn.name = 'Amber'
where p.slug = 'mystic-oud' and not exists (select 1 from public.product_fragrance_notes x where x.product_id = p.id and x.note_id = fn.id and x.note_type = 'base');
insert into public.product_fragrance_notes (product_id, note_id, note_type)
select p.id, fn.id, 'base' from public.products p join public.fragrance_notes fn on fn.name = 'Vanilla'
where p.slug = 'mystic-oud' and not exists (select 1 from public.product_fragrance_notes x where x.product_id = p.id and x.note_id = fn.id and x.note_type = 'base');
insert into public.product_fragrance_notes (product_id, note_id, note_type)
select p.id, fn.id, 'base' from public.products p join public.fragrance_notes fn on fn.name = 'Leather'
where p.slug = 'mystic-oud' and not exists (select 1 from public.product_fragrance_notes x where x.product_id = p.id and x.note_id = fn.id and x.note_type = 'base');

-- Un Kimmy (un-kimmy)
insert into public.product_fragrance_notes (product_id, note_id, note_type)
select p.id, fn.id, 'top' from public.products p join public.fragrance_notes fn on fn.name = 'Bergamot'
where p.slug = 'un-kimmy' and not exists (select 1 from public.product_fragrance_notes x where x.product_id = p.id and x.note_id = fn.id and x.note_type = 'top');
insert into public.product_fragrance_notes (product_id, note_id, note_type)
select p.id, fn.id, 'top' from public.products p join public.fragrance_notes fn on fn.name = 'Cardamom'
where p.slug = 'un-kimmy' and not exists (select 1 from public.product_fragrance_notes x where x.product_id = p.id and x.note_id = fn.id and x.note_type = 'top');
insert into public.product_fragrance_notes (product_id, note_id, note_type)
select p.id, fn.id, 'top' from public.products p join public.fragrance_notes fn on fn.name = 'Grapefruit'
where p.slug = 'un-kimmy' and not exists (select 1 from public.product_fragrance_notes x where x.product_id = p.id and x.note_id = fn.id and x.note_type = 'top');
insert into public.product_fragrance_notes (product_id, note_id, note_type)
select p.id, fn.id, 'heart' from public.products p join public.fragrance_notes fn on fn.name = 'Vetiver'
where p.slug = 'un-kimmy' and not exists (select 1 from public.product_fragrance_notes x where x.product_id = p.id and x.note_id = fn.id and x.note_type = 'heart');
insert into public.product_fragrance_notes (product_id, note_id, note_type)
select p.id, fn.id, 'heart' from public.products p join public.fragrance_notes fn on fn.name = 'Iris'
where p.slug = 'un-kimmy' and not exists (select 1 from public.product_fragrance_notes x where x.product_id = p.id and x.note_id = fn.id and x.note_type = 'heart');
insert into public.product_fragrance_notes (product_id, note_id, note_type)
select p.id, fn.id, 'heart' from public.products p join public.fragrance_notes fn on fn.name = 'Sage'
where p.slug = 'un-kimmy' and not exists (select 1 from public.product_fragrance_notes x where x.product_id = p.id and x.note_id = fn.id and x.note_type = 'heart');
insert into public.product_fragrance_notes (product_id, note_id, note_type)
select p.id, fn.id, 'base' from public.products p join public.fragrance_notes fn on fn.name = 'Musk'
where p.slug = 'un-kimmy' and not exists (select 1 from public.product_fragrance_notes x where x.product_id = p.id and x.note_id = fn.id and x.note_type = 'base');
insert into public.product_fragrance_notes (product_id, note_id, note_type)
select p.id, fn.id, 'base' from public.products p join public.fragrance_notes fn on fn.name = 'Cedarwood'
where p.slug = 'un-kimmy' and not exists (select 1 from public.product_fragrance_notes x where x.product_id = p.id and x.note_id = fn.id and x.note_type = 'base');
insert into public.product_fragrance_notes (product_id, note_id, note_type)
select p.id, fn.id, 'base' from public.products p join public.fragrance_notes fn on fn.name = 'Ambroxan'
where p.slug = 'un-kimmy' and not exists (select 1 from public.product_fragrance_notes x where x.product_id = p.id and x.note_id = fn.id and x.note_type = 'base');

-- Harm Land (harm-land)
insert into public.product_fragrance_notes (product_id, note_id, note_type)
select p.id, fn.id, 'top' from public.products p join public.fragrance_notes fn on fn.name = 'Mandarin'
where p.slug = 'harm-land' and not exists (select 1 from public.product_fragrance_notes x where x.product_id = p.id and x.note_id = fn.id and x.note_type = 'top');
insert into public.product_fragrance_notes (product_id, note_id, note_type)
select p.id, fn.id, 'top' from public.products p join public.fragrance_notes fn on fn.name = 'Pear'
where p.slug = 'harm-land' and not exists (select 1 from public.product_fragrance_notes x where x.product_id = p.id and x.note_id = fn.id and x.note_type = 'top');
insert into public.product_fragrance_notes (product_id, note_id, note_type)
select p.id, fn.id, 'top' from public.products p join public.fragrance_notes fn on fn.name = 'Pink Peppercorn'
where p.slug = 'harm-land' and not exists (select 1 from public.product_fragrance_notes x where x.product_id = p.id and x.note_id = fn.id and x.note_type = 'top');
insert into public.product_fragrance_notes (product_id, note_id, note_type)
select p.id, fn.id, 'heart' from public.products p join public.fragrance_notes fn on fn.name = 'Jasmine'
where p.slug = 'harm-land' and not exists (select 1 from public.product_fragrance_notes x where x.product_id = p.id and x.note_id = fn.id and x.note_type = 'heart');
insert into public.product_fragrance_notes (product_id, note_id, note_type)
select p.id, fn.id, 'heart' from public.products p join public.fragrance_notes fn on fn.name = 'Tuberose'
where p.slug = 'harm-land' and not exists (select 1 from public.product_fragrance_notes x where x.product_id = p.id and x.note_id = fn.id and x.note_type = 'heart');
insert into public.product_fragrance_notes (product_id, note_id, note_type)
select p.id, fn.id, 'heart' from public.products p join public.fragrance_notes fn on fn.name = 'Orange Blossom'
where p.slug = 'harm-land' and not exists (select 1 from public.product_fragrance_notes x where x.product_id = p.id and x.note_id = fn.id and x.note_type = 'heart');
insert into public.product_fragrance_notes (product_id, note_id, note_type)
select p.id, fn.id, 'base' from public.products p join public.fragrance_notes fn on fn.name = 'Amber'
where p.slug = 'harm-land' and not exists (select 1 from public.product_fragrance_notes x where x.product_id = p.id and x.note_id = fn.id and x.note_type = 'base');
insert into public.product_fragrance_notes (product_id, note_id, note_type)
select p.id, fn.id, 'base' from public.products p join public.fragrance_notes fn on fn.name = 'Sandalwood'
where p.slug = 'harm-land' and not exists (select 1 from public.product_fragrance_notes x where x.product_id = p.id and x.note_id = fn.id and x.note_type = 'base');
insert into public.product_fragrance_notes (product_id, note_id, note_type)
select p.id, fn.id, 'base' from public.products p join public.fragrance_notes fn on fn.name = 'White Musk'
where p.slug = 'harm-land' and not exists (select 1 from public.product_fragrance_notes x where x.product_id = p.id and x.note_id = fn.id and x.note_type = 'base');

-- Aura Nocturne (aura-nocturne)
insert into public.product_fragrance_notes (product_id, note_id, note_type)
select p.id, fn.id, 'top' from public.products p join public.fragrance_notes fn on fn.name = 'Black Pepper'
where p.slug = 'aura-nocturne' and not exists (select 1 from public.product_fragrance_notes x where x.product_id = p.id and x.note_id = fn.id and x.note_type = 'top');
insert into public.product_fragrance_notes (product_id, note_id, note_type)
select p.id, fn.id, 'top' from public.products p join public.fragrance_notes fn on fn.name = 'Nutmeg'
where p.slug = 'aura-nocturne' and not exists (select 1 from public.product_fragrance_notes x where x.product_id = p.id and x.note_id = fn.id and x.note_type = 'top');
insert into public.product_fragrance_notes (product_id, note_id, note_type)
select p.id, fn.id, 'top' from public.products p join public.fragrance_notes fn on fn.name = 'Cardamom'
where p.slug = 'aura-nocturne' and not exists (select 1 from public.product_fragrance_notes x where x.product_id = p.id and x.note_id = fn.id and x.note_type = 'top');
insert into public.product_fragrance_notes (product_id, note_id, note_type)
select p.id, fn.id, 'heart' from public.products p join public.fragrance_notes fn on fn.name = 'Cashmere Wood'
where p.slug = 'aura-nocturne' and not exists (select 1 from public.product_fragrance_notes x where x.product_id = p.id and x.note_id = fn.id and x.note_type = 'heart');
insert into public.product_fragrance_notes (product_id, note_id, note_type)
select p.id, fn.id, 'heart' from public.products p join public.fragrance_notes fn on fn.name = 'Tobacco Leaf'
where p.slug = 'aura-nocturne' and not exists (select 1 from public.product_fragrance_notes x where x.product_id = p.id and x.note_id = fn.id and x.note_type = 'heart');
insert into public.product_fragrance_notes (product_id, note_id, note_type)
select p.id, fn.id, 'heart' from public.products p join public.fragrance_notes fn on fn.name = 'Iris'
where p.slug = 'aura-nocturne' and not exists (select 1 from public.product_fragrance_notes x where x.product_id = p.id and x.note_id = fn.id and x.note_type = 'heart');
insert into public.product_fragrance_notes (product_id, note_id, note_type)
select p.id, fn.id, 'base' from public.products p join public.fragrance_notes fn on fn.name = 'Suede'
where p.slug = 'aura-nocturne' and not exists (select 1 from public.product_fragrance_notes x where x.product_id = p.id and x.note_id = fn.id and x.note_type = 'base');
insert into public.product_fragrance_notes (product_id, note_id, note_type)
select p.id, fn.id, 'base' from public.products p join public.fragrance_notes fn on fn.name = 'Amber'
where p.slug = 'aura-nocturne' and not exists (select 1 from public.product_fragrance_notes x where x.product_id = p.id and x.note_id = fn.id and x.note_type = 'base');
insert into public.product_fragrance_notes (product_id, note_id, note_type)
select p.id, fn.id, 'base' from public.products p join public.fragrance_notes fn on fn.name = 'Tonka Bean'
where p.slug = 'aura-nocturne' and not exists (select 1 from public.product_fragrance_notes x where x.product_id = p.id and x.note_id = fn.id and x.note_type = 'base');

-- Rose Ember (rose-ember)
insert into public.product_fragrance_notes (product_id, note_id, note_type)
select p.id, fn.id, 'top' from public.products p join public.fragrance_notes fn on fn.name = 'Raspberry'
where p.slug = 'rose-ember' and not exists (select 1 from public.product_fragrance_notes x where x.product_id = p.id and x.note_id = fn.id and x.note_type = 'top');
insert into public.product_fragrance_notes (product_id, note_id, note_type)
select p.id, fn.id, 'top' from public.products p join public.fragrance_notes fn on fn.name = 'Pink Pepper'
where p.slug = 'rose-ember' and not exists (select 1 from public.product_fragrance_notes x where x.product_id = p.id and x.note_id = fn.id and x.note_type = 'top');
insert into public.product_fragrance_notes (product_id, note_id, note_type)
select p.id, fn.id, 'top' from public.products p join public.fragrance_notes fn on fn.name = 'Bergamot'
where p.slug = 'rose-ember' and not exists (select 1 from public.product_fragrance_notes x where x.product_id = p.id and x.note_id = fn.id and x.note_type = 'top');
insert into public.product_fragrance_notes (product_id, note_id, note_type)
select p.id, fn.id, 'heart' from public.products p join public.fragrance_notes fn on fn.name = 'Turkish Rose'
where p.slug = 'rose-ember' and not exists (select 1 from public.product_fragrance_notes x where x.product_id = p.id and x.note_id = fn.id and x.note_type = 'heart');
insert into public.product_fragrance_notes (product_id, note_id, note_type)
select p.id, fn.id, 'heart' from public.products p join public.fragrance_notes fn on fn.name = 'Peony'
where p.slug = 'rose-ember' and not exists (select 1 from public.product_fragrance_notes x where x.product_id = p.id and x.note_id = fn.id and x.note_type = 'heart');
insert into public.product_fragrance_notes (product_id, note_id, note_type)
select p.id, fn.id, 'heart' from public.products p join public.fragrance_notes fn on fn.name = 'Violet'
where p.slug = 'rose-ember' and not exists (select 1 from public.product_fragrance_notes x where x.product_id = p.id and x.note_id = fn.id and x.note_type = 'heart');
insert into public.product_fragrance_notes (product_id, note_id, note_type)
select p.id, fn.id, 'base' from public.products p join public.fragrance_notes fn on fn.name = 'Smoked Woods'
where p.slug = 'rose-ember' and not exists (select 1 from public.product_fragrance_notes x where x.product_id = p.id and x.note_id = fn.id and x.note_type = 'base');
insert into public.product_fragrance_notes (product_id, note_id, note_type)
select p.id, fn.id, 'base' from public.products p join public.fragrance_notes fn on fn.name = 'Musk'
where p.slug = 'rose-ember' and not exists (select 1 from public.product_fragrance_notes x where x.product_id = p.id and x.note_id = fn.id and x.note_type = 'base');
insert into public.product_fragrance_notes (product_id, note_id, note_type)
select p.id, fn.id, 'base' from public.products p join public.fragrance_notes fn on fn.name = 'Vanilla'
where p.slug = 'rose-ember' and not exists (select 1 from public.product_fragrance_notes x where x.product_id = p.id and x.note_id = fn.id and x.note_type = 'base');

-- Golden Hour (golden-hour)
insert into public.product_fragrance_notes (product_id, note_id, note_type)
select p.id, fn.id, 'top' from public.products p join public.fragrance_notes fn on fn.name = 'Bergamot'
where p.slug = 'golden-hour' and not exists (select 1 from public.product_fragrance_notes x where x.product_id = p.id and x.note_id = fn.id and x.note_type = 'top');
insert into public.product_fragrance_notes (product_id, note_id, note_type)
select p.id, fn.id, 'top' from public.products p join public.fragrance_notes fn on fn.name = 'Mandarin'
where p.slug = 'golden-hour' and not exists (select 1 from public.product_fragrance_notes x where x.product_id = p.id and x.note_id = fn.id and x.note_type = 'top');
insert into public.product_fragrance_notes (product_id, note_id, note_type)
select p.id, fn.id, 'top' from public.products p join public.fragrance_notes fn on fn.name = 'Saffron'
where p.slug = 'golden-hour' and not exists (select 1 from public.product_fragrance_notes x where x.product_id = p.id and x.note_id = fn.id and x.note_type = 'top');
insert into public.product_fragrance_notes (product_id, note_id, note_type)
select p.id, fn.id, 'heart' from public.products p join public.fragrance_notes fn on fn.name = 'Amber'
where p.slug = 'golden-hour' and not exists (select 1 from public.product_fragrance_notes x where x.product_id = p.id and x.note_id = fn.id and x.note_type = 'heart');
insert into public.product_fragrance_notes (product_id, note_id, note_type)
select p.id, fn.id, 'heart' from public.products p join public.fragrance_notes fn on fn.name = 'Cinnamon'
where p.slug = 'golden-hour' and not exists (select 1 from public.product_fragrance_notes x where x.product_id = p.id and x.note_id = fn.id and x.note_type = 'heart');
insert into public.product_fragrance_notes (product_id, note_id, note_type)
select p.id, fn.id, 'heart' from public.products p join public.fragrance_notes fn on fn.name = 'Praline'
where p.slug = 'golden-hour' and not exists (select 1 from public.product_fragrance_notes x where x.product_id = p.id and x.note_id = fn.id and x.note_type = 'heart');
insert into public.product_fragrance_notes (product_id, note_id, note_type)
select p.id, fn.id, 'base' from public.products p join public.fragrance_notes fn on fn.name = 'Vanilla'
where p.slug = 'golden-hour' and not exists (select 1 from public.product_fragrance_notes x where x.product_id = p.id and x.note_id = fn.id and x.note_type = 'base');
insert into public.product_fragrance_notes (product_id, note_id, note_type)
select p.id, fn.id, 'base' from public.products p join public.fragrance_notes fn on fn.name = 'Tonka Bean'
where p.slug = 'golden-hour' and not exists (select 1 from public.product_fragrance_notes x where x.product_id = p.id and x.note_id = fn.id and x.note_type = 'base');
insert into public.product_fragrance_notes (product_id, note_id, note_type)
select p.id, fn.id, 'base' from public.products p join public.fragrance_notes fn on fn.name = 'Sandalwood'
where p.slug = 'golden-hour' and not exists (select 1 from public.product_fragrance_notes x where x.product_id = p.id and x.note_id = fn.id and x.note_type = 'base');
