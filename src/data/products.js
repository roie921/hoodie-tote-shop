export const HOODIE_SIZES = ['S', 'M', 'L', 'XL', 'XXL']

export const CATEGORIES = [
  { id: 'all', name: 'Бүгд' },
  { id: 'hoodie', name: 'Худи' },
  { id: 'tote', name: 'Даавуун цүнх' },
]

const hoodieColors = [
  { id: 'black', name: 'Хар', hex: '#1c1c1c' },
  { id: 'white', name: 'Цагаан', hex: '#f4f4f2' },
  { id: 'gray', name: 'Саарал', hex: '#9a9a9a' },
  { id: 'beige', name: 'Цайвар шаргал', hex: '#e2d6c2' },
]

const toteColors = [
  { id: 'natural', name: 'Байгалийн өнгө', hex: '#eadfca' },
  { id: 'black', name: 'Хар', hex: '#1c1c1c' },
  { id: 'gray', name: 'Саарал', hex: '#9a9a9a' },
]

export const products = [
  {
    id: 'classic-hoodie',
    category: 'hoodie',
    name: 'Классик худи',
    price: 89000,
    description:
      'Зузаан, зөөлөн хөвөн даавуугаар хийсэн өдөр тутмын худи. Урд талдаа халаастай, толгойн малгайтай. Лого, зургаа урд болон ар талд нь байрлуулах боломжтой.',
    colors: hoodieColors,
  },
  {
    id: 'oversize-hoodie',
    category: 'hoodie',
    name: 'Оверсайз худи',
    price: 99000,
    description:
      'Сул, чөлөөтэй загвартай оверсайз худи. Багийн хувцас болон өөрийн брэндийн бүтээгдэхүүнд тохиромжтой. Өөрийн загвараа урд болон ар талд хэвлүүлнэ.',
    colors: hoodieColors,
  },
  {
    id: 'canvas-tote',
    category: 'tote',
    name: 'Даавуун цүнх',
    price: 25000,
    description:
      'Бат бөх зузаан даавуугаар урласан өдөр тутмын цүнх. Дэлгүүр, сургууль, ажилдаа авч явахад тохиромжтой. Логогоо хоёр талд нь хэвлүүлнэ.',
    colors: toteColors,
  },
  {
    id: 'large-tote',
    category: 'tote',
    name: 'Том даавуун цүнх',
    price: 32000,
    description:
      'Өргөн багтаамжтай, урт бариултай том даавуун цүнх. Ном, зөөврийн компьютер болон өдөр тутмын хэрэгсэлд зориулав.',
    colors: toteColors,
  },
]

export function getProductById(id) {
  return products.find((product) => product.id === id)
}

export function getCategoryName(categoryId) {
  const category = CATEGORIES.find((item) => item.id === categoryId)
  return category ? category.name : ''
}
