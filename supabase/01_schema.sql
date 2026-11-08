-- =====================================================================
-- 01_schema.sql
-- Tables, primary keys, foreign keys, indexes and triggers.
-- Run this file FIRST in the Supabase SQL Editor.
--
-- Relationships (1 = one, N = many):
--   auth.users 1 --- 1 profiles
--   categories 1 --- N products
--   products   1 --- N product_colors
--   profiles   1 --- N saved_designs   (and products 1 --- N saved_designs)
--   profiles   1 --- N orders
--   orders     1 --- N order_items     (and products 1 --- N order_items)
--   => orders and products are many-to-many through order_items
-- =====================================================================

-- ---------- profiles (1:1 with auth.users) ----------
create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text,
  phone      text,
  role       text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now()
);

-- ---------- categories ----------
-- The id values are the same strings the React app already uses.
create table public.categories (
  id         text primary key,
  name       text not null,
  created_at timestamptz not null default now()
);

-- ---------- products ----------
-- id is a readable string (slug) such as 'classic-hoodie', as in the React app.
create table public.products (
  id          text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  category_id text not null references public.categories (id)
                on update cascade on delete restrict,
  name        text not null,
  description text not null default '',
  price       integer not null check (price >= 0),
  image_url   text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ---------- product_colors (1:N with products) ----------
create table public.product_colors (
  id         uuid primary key default gen_random_uuid(),
  product_id text not null references public.products (id)
               on update cascade on delete cascade,
  color_key  text not null,
  name       text not null,
  hex        text not null check (hex ~ '^#[0-9a-fA-F]{6}$'),
  sort_order integer not null default 0,
  unique (product_id, color_key)
);

-- ---------- saved_designs (one saved design per user and product) ----------
create table public.saved_designs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  product_id  text not null references public.products (id)
                on update cascade on delete cascade,
  design_json jsonb not null,
  front_image text,
  back_image  text,
  updated_at  timestamptz not null default now(),
  unique (user_id, product_id)
);

-- ---------- orders ----------
create table public.orders (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles (id) on delete restrict,
  status         text not null default 'pending'
                   check (status in ('pending', 'processing', 'completed', 'cancelled')),
  total_price    integer not null default 0 check (total_price >= 0),
  recipient_name text not null,
  phone          text not null,
  address        text not null,
  note           text,
  created_at     timestamptz not null default now()
);

-- ---------- order_items (1:N with orders) ----------
-- product_name and unit_price are copied from the product when the order is
-- placed, so old orders stay correct even if the product changes later.
create table public.order_items (
  id                 uuid primary key default gen_random_uuid(),
  order_id           uuid not null references public.orders (id) on delete cascade,
  product_id         text references public.products (id)
                       on update cascade on delete set null,
  product_name       text not null,
  unit_price         integer not null check (unit_price >= 0),
  color_name         text not null,
  size               text,
  quantity           integer not null check (quantity between 1 and 99),
  design_front_image text,
  design_back_image  text
);

-- ---------- indexes on foreign keys ----------
create index products_category_id_idx      on public.products (category_id);
create index product_colors_product_id_idx on public.product_colors (product_id);
create index saved_designs_user_id_idx     on public.saved_designs (user_id);
create index saved_designs_product_id_idx  on public.saved_designs (product_id);
create index orders_user_id_idx            on public.orders (user_id);
create index order_items_order_id_idx      on public.order_items (order_id);
create index order_items_product_id_idx    on public.order_items (product_id);

-- =====================================================================
-- Triggers
-- =====================================================================

-- Create a profile automatically when someone registers.
-- The role is ALWAYS 'customer' here, so nobody can register as an admin.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep saved_designs.updated_at current.
create function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger saved_designs_touch_updated_at
  before update on public.saved_designs
  for each row execute function public.touch_updated_at();

-- A new order always starts as pending with total 0.
-- Whatever the browser sends for these two columns is ignored.
create function public.reset_new_order()
returns trigger
language plpgsql
as $$
begin
  new.status := 'pending';
  new.total_price := 0;
  return new;
end;
$$;

create trigger orders_reset_new_order
  before insert on public.orders
  for each row execute function public.reset_new_order();

-- The price and name of an order item always come from the products table,
-- so a customer cannot send a fake price from the browser.
create function public.set_order_item_price()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_price integer;
  v_name  text;
begin
  select p.price, p.name into v_price, v_name
  from public.products p
  where p.id = new.product_id and p.is_active;

  if v_price is null then
    raise exception 'Product is not available';
  end if;

  new.unit_price := v_price;
  new.product_name := v_name;
  return new;
end;
$$;

create trigger order_items_set_price
  before insert on public.order_items
  for each row execute function public.set_order_item_price();

-- Recalculate the order total after an item is added.
create function public.recalculate_order_total()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.orders
  set total_price = coalesce(
    (select sum(i.unit_price * i.quantity)
     from public.order_items i
     where i.order_id = new.order_id), 0)
  where id = new.order_id;
  return new;
end;
$$;

create trigger order_items_recalculate_total
  after insert on public.order_items
  for each row execute function public.recalculate_order_total();
