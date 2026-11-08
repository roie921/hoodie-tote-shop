-- =====================================================================
-- 03_seed.sql
-- The four sample products from src/data/products.js.
-- Run this file THIRD. It is safe to run more than once.
-- =====================================================================

insert into public.categories (slug, name) values
  ('hoodie', 'Худи'),
  ('tote',   'Даавуун цүнх')
on conflict (slug) do nothing;

insert into public.products (slug, category_id, name, description, price)
select v.slug, c.id, v.name, v.description, v.price
from (values
  ('classic-hoodie', 'hoodie', 'Классик худи',
   'Зузаан, зөөлөн хөвөн даавуугаар хийсэн өдөр тутмын худи. Урд талдаа халаастай, толгойн малгайтай. Лого, зургаа урд болон ар талд нь байрлуулах боломжтой.',
   89000),
  ('oversize-hoodie', 'hoodie', 'Оверсайз худи',
   'Сул, чөлөөтэй загвартай оверсайз худи. Багийн хувцас болон өөрийн брэндийн бүтээгдэхүүнд тохиромжтой. Өөрийн загвараа урд болон ар талд хэвлүүлнэ.',
   99000),
  ('canvas-tote', 'tote', 'Даавуун цүнх',
   'Бат бөх зузаан даавуугаар урласан өдөр тутмын цүнх. Дэлгүүр, сургууль, ажилдаа авч явахад тохиромжтой. Логогоо хоёр талд нь хэвлүүлнэ.',
   25000),
  ('large-tote', 'tote', 'Том даавуун цүнх',
   'Өргөн багтаамжтай, урт бариултай том даавуун цүнх. Ном, зөөврийн компьютер болон өдөр тутмын хэрэгсэлд зориулав.',
   32000)
) as v(slug, category_slug, name, description, price)
join public.categories c on c.slug = v.category_slug
on conflict (slug) do nothing;

-- Hoodie variants: 4 colors x 5 sizes, 50 pieces each (demo stock).
insert into public.product_variants
  (product_id, color_key, color_name, color_hex, size, stock_quantity, sort_order)
select p.id, c.color_key, c.color_name, c.color_hex, s.size, 50, c.sort_order
from public.products p
cross join (values
  ('black', 'Хар',           '#1c1c1c', 1),
  ('white', 'Цагаан',        '#f4f4f2', 2),
  ('gray',  'Саарал',        '#9a9a9a', 3),
  ('beige', 'Цайвар шаргал', '#e2d6c2', 4)
) as c(color_key, color_name, color_hex, sort_order)
cross join (values ('S'), ('M'), ('L'), ('XL'), ('XXL')) as s(size)
where p.slug in ('classic-hoodie', 'oversize-hoodie')
on conflict do nothing;

-- Tote bag variants: 3 colors, no size, 100 pieces each (demo stock).
insert into public.product_variants
  (product_id, color_key, color_name, color_hex, size, stock_quantity, sort_order)
select p.id, c.color_key, c.color_name, c.color_hex, null, 100, c.sort_order
from public.products p
cross join (values
  ('natural', 'Байгалийн өнгө', '#eadfca', 1),
  ('black',   'Хар',            '#1c1c1c', 2),
  ('gray',    'Саарал',         '#9a9a9a', 3)
) as c(color_key, color_name, color_hex, sort_order)
where p.slug in ('canvas-tote', 'large-tote')
on conflict do nothing;
