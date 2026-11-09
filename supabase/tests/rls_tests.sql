
drop table if exists pg_temp.rls_results;
create temp table rls_results (
  n        serial primary key,
  test     text,
  expected text,
  actual   text
);
grant all on rls_results to public;
grant usage on sequence rls_results_n_seq to public;


create or replace function pg_temp.attempt(statement text)
returns text
language plpgsql
as $$
declare
  affected bigint;
begin
  execute statement;
  get diagnostics affected = row_count;
  if affected = 0 then
    return 'blocked';
  end if;
  return 'allowed';
exception when others then
  return 'blocked';
end;
$$;
grant execute on function pg_temp.attempt(text) to public;

begin;

delete from public.orders
  where user_id in (select id from auth.users where email like 'rls-test-%@example.test');
delete from public.custom_designs
  where user_id in (select id from auth.users where email like 'rls-test-%@example.test');
delete from storage.objects
  where bucket_id = 'custom-designs'
    and (name like 'a1111111-1111-4111-8111-111111111111/%'
      or name like 'b2222222-2222-4222-8222-222222222222/%');
delete from auth.users where email like 'rls-test-%@example.test';
delete from public.products   where slug like 'rls-test-%';
delete from public.categories where slug like 'rls-test-%';

insert into auth.users (id, email, raw_user_meta_data) values
  ('a1111111-1111-4111-8111-111111111111', 'rls-test-a@example.test', '{"full_name":"Test A","phone":"99110001"}'),
  ('b2222222-2222-4222-8222-222222222222', 'rls-test-b@example.test', '{"full_name":"Test B","phone":"99110002"}'),
  ('c3333333-3333-4333-8333-333333333333', 'rls-test-admin@example.test', '{"full_name":"Test Admin","role":"admin"}');

insert into rls_results (test, expected, actual)
select 'Signup metadata "role: admin" is ignored (profile role)', 'customer', role
from public.profiles where id = 'c3333333-3333-4333-8333-333333333333';

update public.profiles set role = 'admin' where id = 'c3333333-3333-4333-8333-333333333333';

insert into public.categories (slug, name, is_active) values ('rls-test-hidden-cat', 'Test', false);

insert into public.products (id, slug, category_id, name, price, is_active) values
  ('d4444444-4444-4444-8444-444444444444', 'rls-test-visible',
   (select id from public.categories where slug = 'hoodie'), 'Test visible', 70000, true),
  ('f7777777-7777-4777-8777-777777777777', 'rls-test-hidden',
   (select id from public.categories where slug = 'hoodie'), 'Test hidden', 50000, false);

insert into public.product_variants (id, product_id, color_key, color_name, color_hex, size, stock_quantity, is_active) values
  ('e5555555-5555-4555-8555-555555555555', 'd4444444-4444-4444-8444-444444444444', 'black', 'Хар', '#1c1c1c', 'M', 5, true),
  ('e6666666-6666-4666-8666-666666666666', 'd4444444-4444-4444-8444-444444444444', 'white', 'Цагаан', '#f4f4f2', 'M', 5, false);

insert into public.custom_designs (id, user_id, product_id, design_json) values
  ('b0b0b0b0-0000-4000-8000-0000000000b2', 'b2222222-2222-4222-8222-222222222222',
   'd4444444-4444-4444-8444-444444444444', '{"front":{}}');

select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;

insert into rls_results (test, expected, actual)
select 'Guest sees the active product', '1', count(*)::text from public.products where slug = 'rls-test-visible';
insert into rls_results (test, expected, actual)
select 'Guest does not see the hidden product', '0', count(*)::text from public.products where slug = 'rls-test-hidden';
insert into rls_results (test, expected, actual)
select 'Guest sees only the active variant', '1', count(*)::text
from public.product_variants where product_id = 'd4444444-4444-4444-8444-444444444444';
insert into rls_results (test, expected, actual)
select 'Guest does not see the hidden category', '0', count(*)::text from public.categories where slug = 'rls-test-hidden-cat';
insert into rls_results values (default, 'Guest cannot insert a product', 'blocked', pg_temp.attempt(
  $q$insert into public.products (slug, category_id, name, price)
     values ('rls-test-guest', (select id from public.categories where slug = 'hoodie'), 'x', 1)$q$));
insert into rls_results values (default, 'Guest cannot read profiles', 'blocked', pg_temp.attempt('select * from public.profiles'));
insert into rls_results values (default, 'Guest cannot read orders', 'blocked', pg_temp.attempt('select * from public.orders'));
insert into rls_results values (default, 'Guest cannot read custom designs', 'blocked', pg_temp.attempt('select * from public.custom_designs'));


reset role;
select set_config('request.jwt.claims', '{"sub":"a1111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
set local role authenticated;

insert into rls_results (test, expected, actual)
select 'Customer A sees only the own profile', '1', count(*)::text from public.profiles;
insert into rls_results values (default, 'Customer A can edit the own name', 'allowed', pg_temp.attempt(
  $q$update public.profiles set full_name = 'Test A renamed' where id = 'a1111111-1111-4111-8111-111111111111'$q$));
insert into rls_results values (default, 'Customer A cannot make self admin', 'blocked', pg_temp.attempt(
  $q$update public.profiles set role = 'admin' where id = 'a1111111-1111-4111-8111-111111111111'$q$));
insert into rls_results values (default, 'Customer A cannot edit another profile', 'blocked', pg_temp.attempt(
  $q$update public.profiles set full_name = 'hacked' where id = 'b2222222-2222-4222-8222-222222222222'$q$));
insert into rls_results values (default, 'Customer A cannot insert a product', 'blocked', pg_temp.attempt(
  $q$insert into public.products (slug, category_id, name, price)
     values ('rls-test-a', (select id from public.categories where slug = 'hoodie'), 'x', 1)$q$));
insert into rls_results values (default, 'Customer A cannot change a product price', 'blocked', pg_temp.attempt(
  $q$update public.products set price = 1 where slug = 'rls-test-visible'$q$));
insert into rls_results values (default, 'Customer A cannot delete a product', 'blocked', pg_temp.attempt(
  $q$delete from public.products where slug = 'rls-test-visible'$q$));
insert into rls_results values (default, 'Customer A cannot change stock', 'blocked', pg_temp.attempt(
  $q$update public.product_variants set stock_quantity = 999 where id = 'e5555555-5555-4555-8555-555555555555'$q$));
insert into rls_results values (default, 'Customer A cannot insert a category', 'blocked', pg_temp.attempt(
  $q$insert into public.categories (slug, name) values ('rls-test-a', 'x')$q$));


insert into rls_results values (default, 'Customer A can create an own order', 'allowed', pg_temp.attempt(
  $q$insert into public.orders (id, user_id, status, total_price, recipient_name, phone, address)
     values ('a0a0a0a0-0000-4000-8000-000000000001', 'a1111111-1111-4111-8111-111111111111',
             'completed', 1, 'A', '99110001', 'Ulaanbaatar')$q$));
insert into rls_results (test, expected, actual)
select 'Fake status and total are ignored (status/total)', 'pending/0', status || '/' || total_price
from public.orders where id = 'a0a0a0a0-0000-4000-8000-000000000001';
insert into rls_results values (default, 'Customer A cannot create an order for B', 'blocked', pg_temp.attempt(
  $q$insert into public.orders (user_id, recipient_name, phone, address)
     values ('b2222222-2222-4222-8222-222222222222', 'x', '1', 'x')$q$));

insert into rls_results values (default, 'Customer A can add an order item', 'allowed', pg_temp.attempt(
  $q$insert into public.order_items (order_id, variant_id, quantity, product_name, unit_price)
     values ('a0a0a0a0-0000-4000-8000-000000000001', 'e5555555-5555-4555-8555-555555555555', 2, 'FAKE', 1)$q$));
insert into rls_results (test, expected, actual)
select 'Item price and name come from the database', '70000/Test visible', unit_price || '/' || product_name
from public.order_items where order_id = 'a0a0a0a0-0000-4000-8000-000000000001';
insert into rls_results (test, expected, actual)
select 'Order total is calculated (2 x 70000)', '140000', total_price::text
from public.orders where id = 'a0a0a0a0-0000-4000-8000-000000000001';
insert into rls_results (test, expected, actual)
select 'Stock goes down after the order (5 - 2)', '3', stock_quantity::text
from public.product_variants where id = 'e5555555-5555-4555-8555-555555555555';
insert into rls_results values (default, 'Ordering more than the stock is blocked', 'blocked', pg_temp.attempt(
  $q$insert into public.order_items (order_id, variant_id, quantity)
     values ('a0a0a0a0-0000-4000-8000-000000000001', 'e5555555-5555-4555-8555-555555555555', 9)$q$));
insert into rls_results values (default, 'Ordering an inactive variant is blocked', 'blocked', pg_temp.attempt(
  $q$insert into public.order_items (order_id, variant_id, quantity)
     values ('a0a0a0a0-0000-4000-8000-000000000001', 'e6666666-6666-4666-8666-666666666666', 1)$q$));
insert into rls_results values (default, 'Customer A cannot change the own order status', 'blocked', pg_temp.attempt(
  $q$update public.orders set status = 'completed' where id = 'a0a0a0a0-0000-4000-8000-000000000001'$q$));

insert into rls_results values (default, 'Customer A can save an own design', 'allowed', pg_temp.attempt(
  $q$insert into public.custom_designs (id, user_id, product_id, design_json)
     values ('a0a0a0a0-0000-4000-8000-0000000000d1', 'a1111111-1111-4111-8111-111111111111',
             'd4444444-4444-4444-8444-444444444444', '{"front":{}}')$q$));
insert into rls_results values (default, 'Customer A cannot save a design for B', 'blocked', pg_temp.attempt(
  $q$insert into public.custom_designs (user_id, product_id, design_json)
     values ('b2222222-2222-4222-8222-222222222222', 'f7777777-7777-4777-8777-777777777777', '{}')$q$));
insert into rls_results values (default, 'Customer A cannot order with the design of B', 'blocked', pg_temp.attempt(
  $q$insert into public.order_items (order_id, variant_id, quantity, custom_design_id)
     values ('a0a0a0a0-0000-4000-8000-000000000001', 'e5555555-5555-4555-8555-555555555555', 1,
             'b0b0b0b0-0000-4000-8000-0000000000b2')$q$));
insert into rls_results values (default, 'Customer A can order with the own design', 'allowed', pg_temp.attempt(
  $q$insert into public.order_items (order_id, variant_id, quantity, custom_design_id)
     values ('a0a0a0a0-0000-4000-8000-000000000001', 'e5555555-5555-4555-8555-555555555555', 1,
             'a0a0a0a0-0000-4000-8000-0000000000d1')$q$));
insert into rls_results values (default, 'An ordered design is locked (update)', 'blocked', pg_temp.attempt(
  $q$update public.custom_designs set design_json = '{"changed":true}'
     where id = 'a0a0a0a0-0000-4000-8000-0000000000d1'$q$));
insert into rls_results values (default, 'An ordered design is locked (delete)', 'blocked', pg_temp.attempt(
  $q$delete from public.custom_designs where id = 'a0a0a0a0-0000-4000-8000-0000000000d1'$q$));


insert into rls_results values (default, 'Customer A can upload into the own folder', 'allowed', pg_temp.attempt(
  $q$insert into storage.objects (bucket_id, name)
     values ('custom-designs', 'a1111111-1111-4111-8111-111111111111/test-front.png')$q$));
insert into rls_results values (default, 'Customer A cannot upload into the folder of B', 'blocked', pg_temp.attempt(
  $q$insert into storage.objects (bucket_id, name)
     values ('custom-designs', 'b2222222-2222-4222-8222-222222222222/test-front.png')$q$));


reset role;
select set_config('request.jwt.claims', '{"sub":"b2222222-2222-4222-8222-222222222222","role":"authenticated"}', true);
set local role authenticated;

insert into rls_results (test, expected, actual)
select 'Customer B does not see orders of A', '0', count(*)::text from public.orders;
insert into rls_results (test, expected, actual)
select 'Customer B does not see order items of A', '0', count(*)::text from public.order_items;
insert into rls_results (test, expected, actual)
select 'Customer B sees only the own design', '1', count(*)::text from public.custom_designs;
insert into rls_results values (default, 'Customer B cannot add items to the order of A', 'blocked', pg_temp.attempt(
  $q$insert into public.order_items (order_id, variant_id, quantity)
     values ('a0a0a0a0-0000-4000-8000-000000000001', 'e5555555-5555-4555-8555-555555555555', 1)$q$));
insert into rls_results values (default, 'Customer B cannot delete designs of A', 'blocked', pg_temp.attempt(
  $q$delete from public.custom_designs where id = 'a0a0a0a0-0000-4000-8000-0000000000d1'$q$));
insert into rls_results (test, expected, actual)
select 'Customer B cannot see the files of A', '0', count(*)::text
from storage.objects where bucket_id = 'custom-designs' and name like 'a1111111-%';


reset role;
select set_config('request.jwt.claims', '{"sub":"c3333333-3333-4333-8333-333333333333","role":"authenticated"}', true);
set local role authenticated;

insert into rls_results (test, expected, actual)
select 'Admin sees all test profiles', '3', count(*)::text
from public.profiles where id in ('a1111111-1111-4111-8111-111111111111',
  'b2222222-2222-4222-8222-222222222222', 'c3333333-3333-4333-8333-333333333333');
insert into rls_results (test, expected, actual)
select 'Admin sees the order of A', '1', count(*)::text from public.orders where id = 'a0a0a0a0-0000-4000-8000-000000000001';
insert into rls_results (test, expected, actual)
select 'Admin sees the hidden product', '1', count(*)::text from public.products where slug = 'rls-test-hidden';
insert into rls_results (test, expected, actual)
select 'Admin sees the inactive variant', '2', count(*)::text
from public.product_variants where product_id = 'd4444444-4444-4444-8444-444444444444';
insert into rls_results values (default, 'Admin can insert a product', 'allowed', pg_temp.attempt(
  $q$insert into public.products (slug, category_id, name, price)
     values ('rls-test-admin-product', (select id from public.categories where slug = 'tote'), 'Admin product', 15000)$q$));
insert into rls_results values (default, 'Admin can update a product', 'allowed', pg_temp.attempt(
  $q$update public.products set price = 16000 where slug = 'rls-test-admin-product'$q$));
insert into rls_results values (default, 'Admin can add a variant (inventory)', 'allowed', pg_temp.attempt(
  $q$insert into public.product_variants (product_id, color_key, color_name, color_hex, stock_quantity)
     values ((select id from public.products where slug = 'rls-test-admin-product'), 'black', 'Хар', '#1c1c1c', 20)$q$));
insert into rls_results values (default, 'Admin can change stock', 'allowed', pg_temp.attempt(
  $q$update public.product_variants set stock_quantity = 25
     where product_id = (select id from public.products where slug = 'rls-test-admin-product')$q$));
insert into rls_results values (default, 'Admin can delete a product', 'allowed', pg_temp.attempt(
  $q$delete from public.products where slug = 'rls-test-admin-product'$q$));
insert into rls_results values (default, 'Admin can change an order status', 'allowed', pg_temp.attempt(
  $q$update public.orders set status = 'processing' where id = 'a0a0a0a0-0000-4000-8000-000000000001'$q$));
insert into rls_results (test, expected, actual)
select 'Admin does not see private custom designs', '0', count(*)::text from public.custom_designs;
insert into rls_results values (default, 'Admin cannot change roles from the API', 'blocked', pg_temp.attempt(
  $q$update public.profiles set role = 'admin' where id = 'b2222222-2222-4222-8222-222222222222'$q$));
insert into rls_results (test, expected, actual)
select 'Admin can open the design files of customers', '1', count(*)::text
from storage.objects where bucket_id = 'custom-designs' and name like 'a1111111-%';

-- ---------- Cleanup (as the database owner) ----------
reset role;
delete from public.orders
  where user_id in (select id from auth.users where email like 'rls-test-%@example.test');
delete from public.custom_designs
  where user_id in (select id from auth.users where email like 'rls-test-%@example.test');
delete from storage.objects
  where bucket_id = 'custom-designs'
    and (name like 'a1111111-1111-4111-8111-111111111111/%'
      or name like 'b2222222-2222-4222-8222-222222222222/%');
delete from auth.users where email like 'rls-test-%@example.test';
delete from public.products   where slug like 'rls-test-%';
delete from public.categories where slug like 'rls-test-%';

commit;

-- ---------- Result: every row must say PASS ----------
select n, test, expected, actual,
       case when expected = actual then 'PASS' else 'FAIL' end as result
from rls_results
order by n;
