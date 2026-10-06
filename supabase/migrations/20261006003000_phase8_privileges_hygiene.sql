-- Phase 8 privileges hygiene.
--
-- Supabase's default privileges hand anon and authenticated SELECT on every table created in the
-- public schema. Row-level security is what actually protects these rows, and it does — but a
-- balance, a points ledger, a gift card and a customer's waitlist entry are not something an
-- anonymous key should be able to even ask for. Revoking the grant means an unauthorised read is
-- refused at the permission check instead of relying on one policy being right forever.
--
-- Verified as intended by the live reads at the bottom: a shopper with no session can still see the
-- catalogue and the discovery tags (both genuinely public), and cannot see any of the private tables.

begin;

revoke select on public.product_views from anon;
revoke select on public.loyalty_ledger from anon;
revoke select on public.gift_cards from anon;
revoke select on public.gift_card_redemptions from anon;
revoke select on public.vip_tiers from anon;
revoke select on public.pre_orders from anon;
revoke select on public.waitlists from anon;
revoke select on public.recommendation_rules from anon;

-- Discovery tags stay readable without a session: the discovery page must be able to show which
-- characters exist before anyone signs in.
grant select on public.product_discovery_tags to anon;

select 'phase8_hygiene '
  || 'views_anon ' || has_table_privilege('anon', 'public.product_views', 'select')
  || ' | ledger_anon ' || has_table_privilege('anon', 'public.loyalty_ledger', 'select')
  || ' | cards_anon ' || has_table_privilege('anon', 'public.gift_cards', 'select')
  || ' | redemptions_anon ' || has_table_privilege('anon', 'public.gift_card_redemptions', 'select')
  || ' | tiers_anon ' || has_table_privilege('anon', 'public.vip_tiers', 'select')
  || ' | preorders_anon ' || has_table_privilege('anon', 'public.pre_orders', 'select')
  || ' | waitlists_anon ' || has_table_privilege('anon', 'public.waitlists', 'select')
  || ' | rules_anon ' || has_table_privilege('anon', 'public.recommendation_rules', 'select')
  || ' | tags_anon_still_readable ' || has_table_privilege('anon', 'public.product_discovery_tags', 'select')
  || ' | ledger_customer_select_granted ' || has_table_privilege('authenticated', 'public.loyalty_ledger', 'select')
  || ' | cards_customer_select_granted ' || has_table_privilege('authenticated', 'public.gift_cards', 'select')
  || ' | catalogue_readable ' || (select count(*) from public.products where active);

commit;
