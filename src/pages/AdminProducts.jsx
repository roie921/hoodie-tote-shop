import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useProducts } from '../context/ProductContext'
import { formatPrice } from '../utils/format'

const empty = { id: '', slug: '', name: '', category_id: '', description: '', price: '', is_active: true }
const input = 'mt-1 w-full rounded-lg border border-sand px-3 py-2 outline-none focus:border-ink'
const defaultColors = {
  hoodie: [['black','Хар','#1c1c1c'],['white','Цагаан','#f4f4f2'],['gray','Саарал','#9a9a9a'],['beige','Цайвар шаргал','#e2d6c2']],
  tote: [['natural','Байгалийн өнгө','#eadfca'],['black','Хар','#1c1c1c'],['gray','Саарал','#9a9a9a']],
}

export default function AdminProducts() {
  const { refreshProducts } = useProducts()
  const [rows, setRows] = useState([])
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState(empty)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const load = async () => {
    const [products, cats] = await Promise.all([
      supabase.from('products').select('id,slug,name,description,price,is_active,category_id,categories(name,slug)').order('created_at', { ascending: false }),
      supabase.from('categories').select('id,name,slug').order('name'),
    ])
    if (products.error || cats.error) setError(products.error?.message || cats.error.message)
    else { setRows(products.data); setCategories(cats.data) }
  }
  useEffect(() => { load() }, [])
  const edit = row => { setForm({ id: row.id, slug: row.slug, name: row.name, description: row.description, price: String(row.price), category_id: row.category_id, is_active: row.is_active }); setError(''); setNotice(''); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const save = async e => {
    e.preventDefault(); setError(''); setNotice('')
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug)) return setError('Хаяг (slug) зөвхөн англи жижиг үсэг, тоо, зураас агуулна.')
    if (!Number.isInteger(Number(form.price)) || Number(form.price) < 0) return setError('Үнэ 0 эсвэл түүнээс их бүхэл тоо байх ёстой.')
    setBusy(true)
    try {
      const payload = { slug: form.slug, name: form.name.trim(), description: form.description.trim(), price: Number(form.price), is_active: form.is_active, category_id: form.category_id }
      if (form.id) {
        const { error: issue } = await supabase.from('products').update(payload).eq('id', form.id)
        if (issue) throw issue
      } else {
        const { data: created, error: issue } = await supabase.from('products').insert(payload).select('id').single()
        if (issue) throw issue
        const category = categories.find(c => c.id === form.category_id)?.slug
        const colors = defaultColors[category] || defaultColors.tote
        const sizes = category === 'hoodie' ? ['S','M','L','XL','XXL'] : [null]
        const variants = colors.flatMap(([key,name,hex], n) => sizes.map(size => ({ product_id: created.id, color_key: key, color_name: name, color_hex: hex, size, stock_quantity: 20, sort_order: n })))
        const { error: variantError } = await supabase.from('product_variants').insert(variants)
        if (variantError) throw new Error('Бүтээгдэхүүн нэмэгдсэн боловч хувилбаруудыг үүсгэж чадсангүй: ' + variantError.message)
      }
      setForm(empty); setNotice('Мэдээлэл амжилттай хадгалагдлаа.'); await load(); await refreshProducts()
    } catch (issue) { setError(issue.message) }
    finally { setBusy(false) }
  }
  const remove = async row => {
    if (!window.confirm(`“${row.name}” бүтээгдэхүүнийг устгах уу? Захиалгатай бүтээгдэхүүн устахгүй байж болно.`)) return
    setError(''); setNotice('')
    const { error: issue } = await supabase.from('products').delete().eq('id', row.id)
    if (issue) setError(issue.message)
    else { setNotice('Бүтээгдэхүүн устгагдлаа.'); await load(); await refreshProducts() }
  }
  return <main className="mx-auto max-w-6xl px-6 py-12">
    <h1 className="text-3xl font-semibold">Бүтээгдэхүүн удирдах</h1><p className="mt-2 text-stone">Зөвхөн админы эрхээр бүтээгдэхүүн нэмэх, өөрчлөх, устгах боломжтой.</p>
    <form onSubmit={save} className="mt-8 grid gap-4 rounded-2xl border border-sand p-6 md:grid-cols-2">
      <h2 className="text-xl font-semibold md:col-span-2">{form.id ? 'Бүтээгдэхүүн засах' : 'Шинэ бүтээгдэхүүн нэмэх'}</h2>
      <label className="text-sm">Нэр<input className={input} value={form.name} onChange={e=>setForm({...form,name:e.target.value})} maxLength="120" required/></label>
      <label className="text-sm">Хаяг (slug)<input className={input} value={form.slug} onChange={e=>setForm({...form,slug:e.target.value})} required pattern="[a-z0-9]+(-[a-z0-9]+)*" placeholder="new-hoodie"/></label>
      <label className="text-sm">Ангилал<select className={input} required value={form.category_id} disabled={!!form.id} onChange={e=>setForm({...form,category_id:e.target.value})}><option value="">Сонгох</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      <label className="text-sm">Үнэ (₮)<input className={input} type="number" min="0" step="1" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} required/></label>
      <label className="text-sm md:col-span-2">Тайлбар<textarea className={input} rows="3" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label>
      <label className="flex items-center gap-2 text-sm md:col-span-2"><input type="checkbox" checked={form.is_active} onChange={e=>setForm({...form,is_active:e.target.checked})}/> Идэвхтэй бүтээгдэхүүн</label>
      {error && <p role="alert" className="text-sm text-red-700 md:col-span-2">{error}</p>}
      {notice && <p role="status" className="text-sm text-green-700 md:col-span-2">{notice}</p>}
      <div className="flex gap-3 md:col-span-2"><button disabled={busy} className="rounded-lg bg-ink px-6 py-3 text-white disabled:opacity-50">{busy ? 'Хадгалж байна...' : 'Хадгалах'}</button><button type="button" onClick={()=>setForm(empty)} className="rounded-lg border border-sand px-5 py-3">Цэвэрлэх</button></div>
    </form>
    <h2 className="mt-12 text-xl font-semibold">Бүтээгдэхүүний жагсаалт ({rows.length})</h2>
    <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="border-b border-sand"><tr><th className="py-3">Нэр</th><th>Ангилал</th><th>Үнэ</th><th>Төлөв</th><th>Үйлдэл</th></tr></thead><tbody>{rows.map(row=><tr key={row.id} className="border-b border-sand"><td className="py-4">{row.name}<div className="text-xs text-stone">{row.slug}</div></td><td>{row.categories?.name}</td><td>{formatPrice(row.price)}</td><td>{row.is_active ? 'Идэвхтэй' : 'Идэвхгүй'}</td><td className="space-x-3"><button onClick={()=>edit(row)} className="underline">Засах</button><button onClick={()=>remove(row)} className="text-red-700 underline">Устгах</button></td></tr>)}</tbody></table></div>
  </main>
}
