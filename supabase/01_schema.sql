-- =====================================================================
-- 01_schema.sql
-- Tables, primary keys, foreign keys, indexes and triggers.
-- Run this file FIRST in the Supabase SQL Editor.
--
-- Relationships (1 = one, N = many):
--   auth.users  1 --- 1 profiles
--   categories  1 --- N products
--   products    1 --- N product_variants   (color / size / stock)
--   profiles    1 --- N custom_designs     (and products 1 --- N custom_designs)
--   profiles    1 --- N orders
--   orders      1 --- N order_items
--   products    1 --- N order_items
--   => orders and products are many-to-many through order_items
-- Passwords are never stored here. Supabase Auth (auth.users) handles them.
-- =====================================================================

-- ---------- profiles (1:1 with auth.users) ----------
create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text check (char_length(full_name) <= 100),
  phone      text check (char_length(phone) <= 20),
  role       text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now()
);

-- ---------- categories ----------
-- slug is the value the React app already uses: 'hoodie' or 'tote'.
create table public.categories (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name       text not null,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- products ----------
-- slug keeps the old URLs working, for example /products/classic-hoodie
create table public.products (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  category_id uuid not null references public.categories (id) on delete restrict,
  name        text not null,
  description text not null default '',
  price       integer not null check (price >= 0),
  image_url   text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------- product_variants (color + size + inventory) ----------
-- Hoodies have a size (S..XXL). Tote bags have size = NULL.
create table public.product_variants (
  id             uuid primary key default gen_random_uuid(),
  product_id     uuid not null references public.products (id) on delete cascade,
  color_key      text not null check (color_key ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  color_name     text not null,
  color_hex      text not null check (color_hex ~ '^#[0-9a-fA-F]{6}$'),
  size           text check (size in ('S', 'M', 'L', 'XL', 'XXL')),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  is_active      boolean not null default true,
  sort_order     integer not null default 0,
  created_at     timestamptz not null default now(),
  unique nulls not distinct (product_id, color_key, size)
);

-- ---------- custom_designs (one saved design per user and product) ----------
-- design_json is the Fabric.js design. The preview images are stored in
-- Supabase Storage (bucket "custom-designs"), only the file paths are kept here.
create table public.custom_designs (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles (id) on delete cascade,
  product_id       uuid not null references public.products (id) on delete cascade,
  design_json      jsonb not null,
  front_image_path text,
  back_image_path  text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
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

-- ---------- order_items (links orders and products: many-to-many) ----------
-- The browser only sends order_id, variant_id, quantity and custom_design_id.
-- The product, name, color, size and price are filled in by a trigger below.
create table public.order_items (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid not null references public.orders (id) on delete cascade,
  product_id       uuid references public.products (id) on delete set null,
  variant_id       uuid references public.product_variants (id) on delete set null,
  custom_design_id uuid references public.custom_designs (id) on delete restrict,
  product_name     text not null default '',
  unit_price       integer not null default 0 check (unit_price >= 0),
  color_name       text not null default '',
  size             text,
  quantity         integer not null check (quantity between 1 and 99)
);

-- ---------- indexes on foreign keys ----------
create index products_category_id_idx         on public.products (category_id);
create index product_variants_product_id_idx  on public.product_variants (product_id);
create index custom_designs_user_id_idx       on public.custom_designs (user_id);
create index custom_designs_product_id_idx    on public.custom_designs (product_id);
create index orders_user_id_idx               on public.orders (user_id);
create index orders_status_idx                on public.orders (status);
create index order_items_order_id_idx         on public.order_items (order_id);
create index order_items_product_id_idx        on public.order_items (product_id);
create index order_items_variant_id_idx       on public.order_items (variant_id);
create index order_items_custom_design_id_idx on public.order_items (custom_design_id);

-- =====================================================================
-- Triggers
-- =====================================================================

-- Create a profile automatically when someone registers.
-- The role is ALWAYS 'customer' here, so nobody can register as an admin.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    left(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), 100),
    left(nullif(trim(new.raw_user_meta_data ->> 'phone'), ''), 20)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep updated_at current.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger products_touch_updated_at
  before update on public.products
  for each row execute function public.touch_updated_at();

create trigger custom_designs_touch_updated_at
  before update on public.custom_designs
  for each row execute function public.touch_updated_at();

create or replace function public.reset_new_order()
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

create or replace function public.set_order_item_details()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_product_id uuid;
  v_name       text;
  v_price      integer;
  v_color      text;
  v_size       text;
  v_stock      integer;
begin
  select p.id, p.name, p.price, v.color_name, v.size, v.stock_quantity
    into v_product_id, v_name, v_price, v_color, v_size, v_stock
  from public.product_variants v
  join public.products p on p.id = v.product_id
  where v.id = new.variant_id and v.is_active and p.is_active
  for update of v;

  if not found then
    raise exception 'Product variant is not available';
  end if;

  if v_stock < new.quantity then
    raise exception 'Not enough stock';
  end if;

  update public.product_variants
  set stock_quantity = stock_quantity - new.quantity
  where id = new.variant_id;

  new.product_id := v_product_id;
  new.product_name := v_name;
  new.unit_price := v_price;
  new.color_name := v_color;
  new.size := v_size;
  return new;
end;
$$;

create trigger order_items_set_details
  before insert on public.order_items
  for each row execute function public.set_order_item_details();

create or replace function public.recalculate_order_total()
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
