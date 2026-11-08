-- =====================================================================
-- 00_reset.sql  (DEVELOPMENT ONLY - DELETES ALL APPLICATION DATA)
-- Removes every table and function created by these scripts, including the
-- tables from the earlier version of this project. Run it only if you
-- already ran an older 01_schema.sql. Do not run it on real customer data.
-- It does not touch Supabase Auth users.
-- =====================================================================

drop trigger if exists on_auth_user_created on auth.users;

drop table if exists
  public.order_items,
  public.orders,
  public.custom_designs,
  public.saved_designs,
  public.product_variants,
  public.product_colors,
  public.products,
  public.categories,
  public.profiles
cascade;

-- Storage policies from 04_storage.sql (the bucket and its files are kept).
drop policy if exists "custom_designs_files_select_own"   on storage.objects;
drop policy if exists "custom_designs_files_insert_own"   on storage.objects;
drop policy if exists "custom_designs_files_update_own"   on storage.objects;
drop policy if exists "custom_designs_files_delete_own"   on storage.objects;
drop policy if exists "custom_designs_files_select_admin" on storage.objects;

drop function if exists public.handle_new_user();
drop function if exists public.touch_updated_at();
drop function if exists public.reset_new_order();
drop function if exists public.set_order_item_price();
drop function if exists public.set_order_item_details();
drop function if exists public.recalculate_order_total();
drop function if exists public.is_admin();
