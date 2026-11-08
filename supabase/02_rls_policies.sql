-- =====================================================================
-- 02_rls_policies.sql
-- Row Level Security: who can read and change which rows.
-- Run this file SECOND, after 01_schema.sql.
--
-- Who is who:
--   anon           = guest, a visitor who is not logged in (not a database user)
--   authenticated  = logged-in user, either a customer or an admin
--                    (see profiles.role)
-- =====================================================================

-- ---------- Helper: is the current user an admin? ----------
-- SECURITY DEFINER lets the function read profiles without triggering
-- the profiles policies again (which would cause infinite recursion).
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- Trigger functions must not be callable from the browser.
revoke all on function public.handle_new_user()          from public, anon, authenticated;
revoke all on function public.touch_updated_at()         from public, anon, authenticated;
revoke all on function public.reset_new_order()          from public, anon, authenticated;
revoke all on function public.set_order_item_details()   from public, anon, authenticated;
revoke all on function public.recalculate_order_total()  from public, anon, authenticated;

-- ---------- Turn on RLS for every application table ----------
alter table public.profiles         enable row level security;
alter table public.categories       enable row level security;
alter table public.products         enable row level security;
alter table public.product_variants enable row level security;
alter table public.custom_designs   enable row level security;
alter table public.orders           enable row level security;
alter table public.order_items      enable row level security;

-- ---------- Table privileges (the first lock) ----------
-- Start from nothing, then grant only what is needed.
-- The RLS policies below are the second lock on top of these.
revoke all on public.profiles, public.categories, public.products,
              public.product_variants, public.custom_designs,
              public.orders, public.order_items
  from anon, authenticated;

grant select on public.categories, public.products, public.product_variants
  to anon, authenticated;
grant insert, update, delete on public.categories, public.products, public.product_variants
  to authenticated;

grant select on public.profiles to authenticated;
-- Users may only edit these two columns. Nobody can edit "role" from the browser.
grant update (full_name, phone) on public.profiles to authenticated;

grant select, insert, update, delete on public.custom_designs to authenticated;
grant select, insert, update on public.orders to authenticated;
grant select, insert on public.order_items to authenticated;

-- ---------- profiles ----------
create policy "profiles_select_own_or_admin" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or public.is_admin());

create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- ---------- categories ----------
-- Guests see active categories. Admins also see hidden ones.
create policy "categories_select_active_or_admin" on public.categories
  for select to anon, authenticated
  using (is_active or public.is_admin());

create policy "categories_insert_admin" on public.categories
  for insert to authenticated
  with check (public.is_admin());

create policy "categories_update_admin" on public.categories
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "categories_delete_admin" on public.categories
  for delete to authenticated
  using (public.is_admin());

-- ---------- products ----------
-- Guests see active products. Admins also see hidden ones.
create policy "products_select_active_or_admin" on public.products
  for select to anon, authenticated
  using (is_active or public.is_admin());

create policy "products_insert_admin" on public.products
  for insert to authenticated
  with check (public.is_admin());

create policy "products_update_admin" on public.products
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "products_delete_admin" on public.products
  for delete to authenticated
  using (public.is_admin());

-- ---------- product_variants ----------
-- A variant is visible when it is active AND its product is visible
-- (the products policy applies inside the subquery). Admins see everything.
create policy "product_variants_select_visible" on public.product_variants
  for select to anon, authenticated
  using (
    (is_active or public.is_admin())
    and exists (
      select 1 from public.products p where p.id = product_variants.product_id
    )
  );

create policy "product_variants_insert_admin" on public.product_variants
  for insert to authenticated
  with check (public.is_admin());

create policy "product_variants_update_admin" on public.product_variants
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "product_variants_delete_admin" on public.product_variants
  for delete to authenticated
  using (public.is_admin());

-- ---------- custom_designs (private to the owner) ----------
create policy "custom_designs_select_own" on public.custom_designs
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "custom_designs_insert_own" on public.custom_designs
  for insert to authenticated
  with check (user_id = (select auth.uid()));

-- A design that is already part of an order is locked, so the customer
-- cannot change what the workshop is producing.
create policy "custom_designs_update_own_unordered" on public.custom_designs
  for update to authenticated
  using (
    user_id = (select auth.uid())
    and not exists (
      select 1 from public.order_items i where i.custom_design_id = custom_designs.id
    )
  )
  with check (user_id = (select auth.uid()));

create policy "custom_designs_delete_own_unordered" on public.custom_designs
  for delete to authenticated
  using (
    user_id = (select auth.uid())
    and not exists (
      select 1 from public.order_items i where i.custom_design_id = custom_designs.id
    )
  );

-- ---------- orders ----------
-- Customers see and create only their own orders. Only admins change the status.
create policy "orders_select_own_or_admin" on public.orders
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

create policy "orders_insert_own" on public.orders
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "orders_update_admin" on public.orders
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------- order_items ----------
-- Visible when the parent order is visible (orders policy applies in the subquery).
create policy "order_items_select_visible" on public.order_items
  for select to authenticated
  using (exists (
    select 1 from public.orders o where o.id = order_items.order_id
  ));

-- A customer can add items only to their own pending order, and may attach
-- only their own custom design.
create policy "order_items_insert_own_pending" on public.order_items
  for insert to authenticated
  with check (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and o.user_id = (select auth.uid())
        and o.status = 'pending'
    )
    and (
      custom_design_id is null
      or exists (
        select 1 from public.custom_designs d
        where d.id = order_items.custom_design_id
          and d.user_id = (select auth.uid())
      )
    )
  );
