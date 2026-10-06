-- Phase 8 (8.10) companion: the admin needs one guarded way to open and close a pre-order on a
-- fragrance. Without it the storefront could only honour pre-orders somebody set in SQL.

begin;

create or replace function public.save_product_pre_order(
  p_product_id uuid,
  p_enabled boolean,
  p_release_on date,
  p_max_quantity integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reserved integer;
begin
  if not public.has_permission(auth.uid(), 'manage_products') and not public.is_super_admin() then
    raise exception 'You are not authorised to change pre-orders.';
  end if;
  if not exists (select 1 from public.products where id = p_product_id) then
    raise exception 'That fragrance does not exist.';
  end if;

  if coalesce(p_enabled, false) then
    if p_release_on is null then
      raise exception 'A pre-order needs the date the fragrance is due.';
    end if;
    if p_release_on <= current_date then
      raise exception 'That release date has already passed.';
    end if;
    if p_max_quantity is not null and p_max_quantity < 1 then
      raise exception 'The number of pieces on offer must be at least one.';
    end if;

    -- Opening a pre-order below what is already promised would strand those reservations.
    if p_max_quantity is not null then
      select coalesce(sum(quantity), 0)::integer into v_reserved
      from public.pre_orders
      where product_id = p_product_id and status <> 'Cancelled';
      if v_reserved > p_max_quantity then
        raise exception '% pieces are already reserved, which is more than the % you are offering.', v_reserved, p_max_quantity;
      end if;
    end if;
  end if;

  update public.products
     set pre_order_enabled = coalesce(p_enabled, false),
         pre_order_release_on = case when coalesce(p_enabled, false) then p_release_on else null end,
         pre_order_max_quantity = case when coalesce(p_enabled, false) then p_max_quantity else null end,
         updated_at = now()
   where id = p_product_id;

  return jsonb_build_object('success', true);
end;
$$;

comment on function public.save_product_pre_order(uuid, boolean, date, integer) is
  'Opens or closes a pre-order. Refuses a past date and refuses to cap below what is already reserved.';

revoke execute on function public.save_product_pre_order(uuid, boolean, date, integer) from public, anon;
grant execute on function public.save_product_pre_order(uuid, boolean, date, integer) to authenticated, service_role;

select 'phase8e_preorder_writer '
  || 'secdef ' || (select prosecdef from pg_proc where oid = 'public.save_product_pre_order(uuid, boolean, date, integer)'::regprocedure)
  || ' | anon_exec ' || has_function_privilege('anon', 'public.save_product_pre_order(uuid, boolean, date, integer)', 'execute')
  || ' | products_open_now ' || (select count(*) from public.products where pre_order_enabled);

commit;
