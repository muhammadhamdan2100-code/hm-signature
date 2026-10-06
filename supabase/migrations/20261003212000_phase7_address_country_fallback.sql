-- Keep today's checkout working while the storefront gains a destination selector.
--
-- The previous migration made place_order require a delivery country, which would have
-- refused every existing caller: the storefront still sends only an address whose
-- "country" text is "Pakistan". Rather than loosening the server-side rule, resolve that
-- text against the countries table so the destination is still decided by the database.
-- An address that names nothing recognised is still refused, and a shopper who explicitly
-- passes p_country_code keeps the strict two-letter path.

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
    v_address_country text := trim(coalesce(p_shipping_address ->> 'country', ''));
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

    -- Destination: an explicit code wins, otherwise the address country text is resolved
    -- through the countries table. The database still decides what can be delivered.
    v_country_code := nullif(trim(coalesce(p_country_code, '')), '');

    if v_country_code is null then
        select c.code into v_country_code
        from public.countries c
        where c.name = v_address_country
           or c.code = upper(v_address_country)
           or upper(c.code) = upper(trim(coalesce(p_shipping_address ->> 'countryCode', '')))
        limit 1;
    end if;

    -- Same rules the shopper was quoted, computed again here from stored prices.
    v_quote := public.compute_order_pricing(p_items, v_country_code, p_currency, p_coupon_code, v_buyer);
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
        -- The resolved destination is recorded inside the address too, so any consumer
        -- of shipping_address sees the country that was actually priced.
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

alter function public.place_order(uuid, text, text, text, jsonb, text, text, jsonb, text, text) owner to postgres;
revoke execute on function public.place_order(uuid, text, text, text, jsonb, text, text, jsonb, text, text) from public;
grant execute on function public.place_order(uuid, text, text, text, jsonb, text, text, jsonb, text, text) to anon, authenticated, service_role;

comment on function public.place_order(uuid, text, text, text, jsonb, text, text, jsonb, text, text) is
  'Creates the order. All amounts derive from stored prices and country rules; nothing is taken from the browser except variant ids, quantities, destination and display currency.';
