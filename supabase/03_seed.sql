-- =====================================================================
-- 03_seed.sql
-- Sample data copied from src/data/products.js (same string IDs).
-- Run this file THIRD. It is safe to run more than once.
-- =====================================================================

insert into public.categories (id, name) values
  ('hoodie', 'Худи'),
  ('tote',   'Даавуун цүнх')
on conflict (id) do nothing;

insert into public.products (id, category_id, name, description, price) values
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
on conflict (id) do nothing;

insert into public.product_colors (product_id, color_key, name, hex, sort_order) values
  ('classic-hoodie',   'black',   'Хар',           '#1c1c1c', 1),
  ('classic-hoodie',   'white',   'Цагаан',        '#f4f4f2', 2),
  ('classic-hoodie',   'gray',    'Саарал',        '#9a9a9a', 3),
  ('classic-hoodie',   'beige',   'Цайвар шаргал', '#e2d6c2', 4),
  ('oversize-hoodie',  'black',   'Хар',           '#1c1c1c', 1),
  ('oversize-hoodie',  'white',   'Цагаан',        '#f4f4f2', 2),
  ('oversize-hoodie',  'gray',    'Саарал',        '#9a9a9a', 3),
  ('oversize-hoodie',  'beige',   'Цайвар шаргал', '#e2d6c2', 4),
  ('canvas-tote',      'natural', 'Байгалийн өнгө', '#eadfca', 1),
  ('canvas-tote',      'black',   'Хар',           '#1c1c1c', 2),
  ('canvas-tote',      'gray',    'Саарал',        '#9a9a9a', 3),
  ('large-tote',       'natural', 'Байгалийн өнгө', '#eadfca', 1),
  ('large-tote',       'black',   'Хар',           '#1c1c1c', 2),
  ('large-tote',       'gray',    'Саарал',        '#9a9a9a', 3)
on conflict (product_id, color_key) do nothing;
