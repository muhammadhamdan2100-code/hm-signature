-- Phase 7 — destination-aware shipping, tax and a currency snapshot on the order.
--
-- place_order already recomputes every amount from the database and ignores anything
-- the browser sends, so the new rules are added there rather than trusted from the
-- client. A matching quote_order() function exists so the figures a shopper sees before
-- confirming come from the same SQL as the figures written to the order.
--
-- Historical rows are untouched: the new columns arrive with defaults that describe the
-- store as it was (PKR, rate 1, no tax), and nothing here rewrites an existing order.

alter table public.orders
  add column if not exists destination_country text,
  add column if not exists tax_rate numeric(5, 2) not null default 0,
  add column if not exists tax_amount numeric(12, 2) not null default 0,
  add column if not exists tax_label text,
  add column if not exists currency text not null default 'PKR',
  add column if not exists currency_rate_to_base numeric(18, 6) not null default 1,
  add column if not exists total_in_currency numeric(12, 2);

comment on column public.orders.subtotal is
  'Always the base currency (PKR). The display currency of the sale is recorded separately.';
comment on column public.orders.currency is
  'The currency the shopper was shown at checkout. Snapshot only; totals remain in the base currency.';
comment on column public.orders.total_in_currency is
  'Order total expressed in `currency` at `currency_rate_to_base`, kept so a later rate change cannot alter a past order.';

-- ---------------------------------------------------------------------------
-- Shared pricing helper
-- ---------------------------------------------------------------------------
-- Both the quote and the real order call this, so the two can never disagree.
create or replace function public.compute_order_pricing(
  p_items jsonb,
  p_country_code text,
  p_currency text,
  p_coupon_code text,
  p_buyer uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_row record;
  v_subtotal numeric(12, 2) := 0;
  v_discount numeric(12, 2) := 0;
  v_shipping numeric(12, 2) := 0;
  v_tax numeric(12, 2) := 0;
  v_total numeric(12, 2) := 0;
  v_goods numeric(12, 2);
  v_country public.countries%rowtype;
  v_currency public.currencies%rowtype;
  v_coupon public.coupons%rowtype;
  v_personal_uses int := 0;
  v_unit_price numeric(12, 2);
  v_quantity int;
  v_requested text := nullif(trim(coalesce(p_country_code, '')), '');
  v_currency_code text := nullif(trim(coalesce(upper(p_currency), '')), '');
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    return jsonb_build_object('error', 'Your bag is empty. Add a fragrance before placing an order.');
  end if;

  -- Goods price comes from the variant row every time, never from the caller.
  -- Ids and quantities stay text until they have been validated, so a malformed
  -- payload answers with a sentence instead of a Postgres cast error.
  for v_row in
    select ci.value ->> 'variant_id' as variant_id,
           ci.value ->> 'quantity' as quantity
    from jsonb_array_elements(p_items) as ci(value)
  loop
    if v_row.variant_id is null
       or v_row.variant_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
      return jsonb_build_object('error', 'One of the items in your bag is not recognised.');
    end if;

    if v_row.quantity is null or v_row.quantity !~ '^[1-9][0-9]{0,2}$' then
      return jsonb_build_object('error', 'Invalid item quantity.');
    end if;
    v_quantity := v_row.quantity::int;

    if v_quantity > 50 then
      return jsonb_build_object('error', 'Orders are limited to 50 units of a single size. Please contact the concierge for larger requirements.');
    end if;

    select coalesce(pv.sale_price, pv.price) into v_unit_price
    from public.product_variants pv
    where pv.id = v_row.variant_id::uuid and pv.active and pv.stock >= v_quantity;

    if v_unit_price is null then
      return jsonb_build_object('error', 'A selected size is no longer available in that quantity.');
    end if;

    v_subtotal := v_subtotal + (v_unit_price * v_quantity);
  end loop;

  -- Destination: explicit code wins, otherwise the shipping address country text.
  if v_requested is not null and v_requested !~ '^[A-Z]{2}$' then
    return jsonb_build_object('error', 'That destination is not recognised.');
  end if;

  select * into v_country
  from public.countries c
  where v_requested is not null and c.code = v_requested;

  if v_country.code is null and v_requested is null then
    return jsonb_build_object('error', 'Choose a delivery country before checking out.');
  end if;

  if v_country.code is null then
    return jsonb_build_object('error', 'We do not deliver to that destination yet.');
  end if;

  if not v_country.enabled then
    return jsonb_build_object('error', format('Delivery to %s is not available yet. The atelier can still be contacted about it.', v_country.name));
  end if;

  if v_country.shipping_fee is null then
    return jsonb_build_object('error', format('Shipping to %s has not been priced yet. Please choose another destination.', v_country.name));
  end if;

  -- Coupon, evaluated exactly as place_order will evaluate it again at write time.
  if p_coupon_code is not null and trim(p_coupon_code) <> '' then
    select * into v_coupon from public.coupons where upper(code) = upper(trim(p_coupon_code));

    if not found then
      return jsonb_build_object('error', format('The promotion code %s is not recognised.', trim(p_coupon_code)));
    end if;
    if not v_coupon.active then
      return jsonb_build_object('error', format('The promotion %s is no longer active.', v_coupon.code));
    end if;
    if v_coupon.min_spend is not null and v_subtotal < v_coupon.min_spend then
      return jsonb_build_object('error', format('A minimum spend is required for %s.', v_coupon.code));
    end if;
    if v_coupon.usage_limit is not null and v_coupon.used_count >= v_coupon.usage_limit then
      return jsonb_build_object('error', format('The promotion %s has reached its usage limit.', v_coupon.code));
    end if;
    if v_coupon.per_user_limit > 0 and p_buyer is not null then
      select count(*) into v_personal_uses from public.coupon_usage
      where coupon_id = v_coupon.id and user_id = p_buyer;
      if v_personal_uses >= v_coupon.per_user_limit then
        return jsonb_build_object('error', format('The promotion %s has already been used on this account.', v_coupon.code));
      end if;
    end if;

    if v_coupon.type = 'percentage' then
      v_discount := (v_subtotal * v_coupon.value) / 100.0;
      if v_coupon.max_discount is not null and v_discount > v_coupon.max_discount then
        v_discount := v_coupon.max_discount;
      end if;
    else
      v_discount := least(v_coupon.value, v_subtotal);
    end if;
  end if;

  v_goods := greatest(0, v_subtotal - v_discount);

  if v_country.free_shipping_threshold is not null and v_goods >= v_country.free_shipping_threshold then
    v_shipping := 0;
  else
    v_shipping := v_country.shipping_fee;
  end if;

  -- The store's own configured percentage. Nothing here claims to know a country's law.
  if v_country.tax_enabled and coalesce(v_country.tax_rate, 0) > 0 then
    v_tax := round((v_goods + v_shipping) * v_country.tax_rate / 100.0, 2);
  end if;

  v_total := v_goods + v_shipping + v_tax;

  -- Display currency. The stored totals stay in the base currency; this is a snapshot
  -- of what the shopper was quoted.
  select * into v_currency from public.currencies where code = coalesce(v_currency_code, 'PKR');

  if v_currency.code is null then
    return jsonb_build_object('error', 'That currency is not supported.');
  end if;

  if not v_currency.enabled then
    return jsonb_build_object('error', 'That currency is not available for display right now.');
  end if;

  return jsonb_build_object(
    'subtotal', round(v_subtotal, 2),
    'discount', round(v_discount, 2),
    'shipping', round(v_shipping, 2),
    'tax', round(v_tax, 2),
    'tax_rate', coalesce(v_country.tax_rate, 0),
    'tax_label', v_country.tax_label,
    'total', round(v_total, 2),
    'country_code', v_country.code,
    'country_name', v_country.name,
    'delivery_method', v_country.delivery_method,
    'delivery_days_min', v_country.delivery_days_min,
    'delivery_days_max', v_country.delivery_days_max,
    'currency', v_currency.code,
    'currency_symbol', v_currency.symbol,
    'currency_minor_units', v_currency.minor_units,
    'currency_rate_to_base', v_currency.rate_to_base,
    'total_in_currency', round(v_total / v_currency.rate_to_base, v_currency.minor_units),
    'rate_source', v_currency.rate_source
  );
end;
$$;

-- What the storefront shows before confirmation. Read-only.
create or replace function public.quote_order(
  p_items jsonb,
  p_country_code text default null,
  p_currency text default 'PKR',
  p_coupon_code text default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  return public.compute_order_pricing(p_items, p_country_code, p_currency, p_coupon_code, auth.uid());
end;
$$;

-- ---------------------------------------------------------------------------
-- place_order, extended
-- ---------------------------------------------------------------------------
-- The previous 8-parameter overload is dropped first: leaving it in place would keep
-- the old PKR-only, no-tax totals reachable and make the RPC ambiguous for callers
-- that omit the new arguments. The two new parameters are trailing and defaulted, so
-- every existing call site keeps working against the single remaining version.
drop function if exists public.place_order(uuid, text, text, text, jsonb, text, text, jsonb);

create or replace function public.place_order(
  p_customer_id uuid,
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_shipping_address jsonb,
  p_payment_method text,
  p_coupon_code text default null,
  p_items jsonb default '[]'::jsonb,
  p_country_code text default null,
  p_currency text default 'PKR'
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_order_id uuid;
    v_order_number text;
    v_subtotal numeric(12, 2) := 0;
    v_discount numeric(12, 2) := 0;
    v_shipping numeric(12, 2) := 0;
    v_tax numeric(12, 2) := 0;
    v_total numeric(12, 2) := 0;
    v_quote jsonb;
    v_item jsonb;
    v_variant_id uuid;
    v_quantity int;
    v_variant record;
    v_product record;
    v_unit_price numeric(12, 2);
    v_line_total numeric(12, 2);
    v_coupon public.coupons%rowtype;
    v_coupon_id uuid;
    v_image text;
    v_buyer uuid := auth.uid();
    v_country_code text;
    v_country_name text;
    v_tax_rate numeric(5, 2);
    v_tax_label text;
    v_currency text;
    v_currency_rate numeric(18, 6);
    v_total_in_currency numeric(12, 2);
begin
    if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
        raise exception 'Your bag is empty. Add a fragrance before placing an order.';
    end if;

    -- A signed-in session may only order for itself; guests pass NULL.
    if v_buyer is not null and p_customer_id is not null and p_customer_id <> v_buyer
       and not public.is_staff(v_buyer) then
        raise exception 'Orders can only be placed for the signed-in account.';
    end if;

    if p_payment_method not in ('COD', 'Cash on Delivery', 'JazzCash', 'Raast', 'Bank Transfer', 'PayFast') then
        raise exception 'Unsupported payment method: %', p_payment_method;
    end if;

    -- Same rules the shopper was quoted, computed again here from stored prices.
    v_quote := public.compute_order_pricing(p_items, p_country_code, p_currency, p_coupon_code, v_buyer);
    if v_quote ? 'error' then
        raise exception '%', v_quote ->> 'error';
    end if;

    v_subtotal := (v_quote ->> 'subtotal')::numeric;
    v_discount := (v_quote ->> 'discount')::numeric;
    v_shipping := (v_quote ->> 'shipping')::numeric;
    v_tax := (v_quote ->> 'tax')::numeric;
    v_total := (v_quote ->> 'total')::numeric;
    v_country_code := v_quote ->> 'country_code';
    v_country_name := v_quote ->> 'country_name';
    v_tax_rate := coalesce((v_quote ->> 'tax_rate')::numeric, 0);
    v_tax_label := nullif(v_quote ->> 'tax_label', '');
    v_currency := v_quote ->> 'currency';
    v_currency_rate := (v_quote ->> 'currency_rate_to_base')::numeric;
    v_total_in_currency := (v_quote ->> 'total_in_currency')::numeric;

    loop
        v_order_number := 'HMS-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(floor(random() * 10000)::text, 4, '0');
        exit when not exists (select 1 from public.orders where order_number = v_order_number);
    end loop;
    v_order_id := gen_random_uuid();

    -- Stock is reserved row by row, exactly as before.
    for v_item in select * from jsonb_array_elements(p_items)
    loop
        v_variant_id := (v_item ->> 'variant_id')::uuid;
        v_quantity := (v_item ->> 'quantity')::int;

        if v_quantity is null or v_quantity <= 0 then
            raise exception 'Invalid item quantity.';
        end if;
        if v_quantity > 50 then
            raise exception 'Orders are limited to 50 units of a single size. Please contact the concierge for larger requirements.';
        end if;

        select * into v_variant from public.product_variants where id = v_variant_id for update;
        if not found then
            raise exception 'The selected bottle size is no longer available.';
        end if;
        if not v_variant.active then
            raise exception '% is currently unavailable.', v_variant.sku;
        end if;
        if v_variant.stock < v_quantity then
            raise exception 'Only % of % remains in stock.', v_variant.stock, v_variant.size;
        end if;

        select * into v_product from public.products where id = v_variant.product_id;
        if not found or not v_product.active then
            raise exception '% is no longer offered.', v_variant.sku;
        end if;

        update public.product_variants set stock = stock - v_quantity, updated_at = now()
        where id = v_variant_id;

        insert into public.inventory_transactions (
            variant_id, transaction_type, quantity_change, previous_stock, new_stock, reference_id, notes
        ) values (
            v_variant_id, 'sale', -v_quantity, v_variant.stock, v_variant.stock - v_quantity, v_order_number, 'Customer Order Acquisition'
        );
    end loop;

    if p_coupon_code is not null and trim(p_coupon_code) <> '' and v_discount > 0 then
        select * into v_coupon from public.coupons where upper(code) = upper(trim(p_coupon_code)) for update;
        if found then
            v_coupon_id := v_coupon.id;
            update public.coupons set used_count = used_count + 1 where id = v_coupon_id;
        end if;
    end if;

    insert into public.orders (
        id, order_number, customer_id, customer_name, customer_email, customer_phone,
        shipping_address, status, payment_status, payment_method, subtotal,
        discount_amount, shipping_cost, total, coupon_code,
        destination_country, tax_rate, tax_amount, tax_label,
        currency, currency_rate_to_base, total_in_currency
    ) values (
        v_order_id, v_order_number, v_buyer, p_customer_name, coalesce(p_customer_email, ''), p_customer_phone,
        -- The resolved destination code is recorded inside the address too, so any
        -- consumer of shipping_address sees the country that was actually priced.
        coalesce(p_shipping_address, '{}'::jsonb) || jsonb_build_object('countryCode', v_country_code, 'countryName', v_country_name),
        'Pending', 'Pending', p_payment_method, v_subtotal,
        v_discount, v_shipping, v_total, nullif(trim(p_coupon_code), ''),
        v_country_code, coalesce(v_tax_rate, 0), v_tax, v_tax_label,
        v_currency, v_currency_rate, v_total_in_currency
    );

    for v_item in select * from jsonb_array_elements(p_items)
    loop
        v_variant_id := (v_item ->> 'variant_id')::uuid;
        v_quantity := (v_item ->> 'quantity')::int;

        select * into v_variant from public.product_variants where id = v_variant_id;
        select * into v_product from public.products where id = v_variant.product_id;
        v_unit_price := coalesce(v_variant.sale_price, v_variant.price);
        v_line_total := v_unit_price * v_quantity;

        select image_url into v_image from public.product_images
        where product_id = v_product.id and (variant_id = v_variant_id or variant_id is null)
        order by variant_id nulls last, is_primary desc, display_order asc
        limit 1;

        insert into public.order_items (
            order_id, product_id, variant_id, product_name, variant_size, sku,
            unit_price, quantity, line_total, image_url
        ) values (
            v_order_id, v_product.id, v_variant.id, v_product.name, v_variant.size, v_variant.sku,
            v_unit_price, v_quantity, v_line_total, v_image
        );
    end loop;

    insert into public.payments (
        order_id, order_number, customer_name, customer_email, amount, method, status
    ) values (
        v_order_id, v_order_number, p_customer_name, coalesce(p_customer_email, ''), v_total, p_payment_method, 'Pending'
    );

    insert into public.order_status_history (order_id, status, note, changed_by)
    values (v_order_id, 'Pending', 'Order created and payment pending.', v_buyer);

    if v_discount > 0 and v_coupon_id is not null then
        insert into public.coupon_usage (coupon_id, user_id, order_id, discount_amount)
        values (v_coupon_id, v_buyer, v_order_id, v_discount);
    end if;

    return jsonb_build_object(
        'order_id', v_order_id,
        'order_number', v_order_number,
        'subtotal', v_subtotal,
        'discount', v_discount,
        'shipping', v_shipping,
        'tax', v_tax,
        'total', v_total,
        'currency', v_currency,
        'currency_rate_to_base', v_currency_rate,
        'total_in_currency', v_total_in_currency,
        'destination_country', v_country_code,
        'status', 'Pending'
    );
end;
$$;

alter function public.compute_order_pricing(jsonb, text, text, text, uuid) owner to postgres;
alter function public.quote_order(jsonb, text, text, text) owner to postgres;
alter function public.place_order(uuid, text, text, text, jsonb, text, text, jsonb, text, text) owner to postgres;

-- Execute rights mirror the dropped function exactly: guests (anon) and shoppers
-- (authenticated) may place an order, and the function itself decides what it allows.
revoke execute on function public.place_order(uuid, text, text, text, jsonb, text, text, jsonb, text, text) from public;
grant execute on function public.place_order(uuid, text, text, text, jsonb, text, text, jsonb, text, text) to anon, authenticated, service_role;

-- Anyone may price a basket: it exposes only public prices and shipping rules, and it
-- reads nothing private.
revoke execute on function public.quote_order(jsonb, text, text, text) from public, anon;
grant execute on function public.quote_order(jsonb, text, text, text) to anon, authenticated, service_role;

-- The helper is internal: callers go through quote_order or place_order.
revoke execute on function public.compute_order_pricing(jsonb, text, text, text, uuid) from public, anon, authenticated;
grant execute on function public.compute_order_pricing(jsonb, text, text, text, uuid) to service_role;

comment on function public.compute_order_pricing(jsonb, text, text, text, uuid) is
  'Internal. Single source of truth for goods, coupon, destination shipping and configured tax. Returns {error} rather than raising so a quote can be displayed.';
comment on function public.quote_order(jsonb, text, text, text) is
  'Pre-checkout pricing shown to the shopper. Read-only; place_order recomputes the same way.';
comment on function public.place_order(uuid, text, text, text, jsonb, text, text, jsonb, text, text) is
  'Creates the order. All amounts derive from stored prices and country rules; nothing is taken from the browser except variant ids, quantities, destination and display currency.';
