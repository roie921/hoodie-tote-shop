import { useSearchParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { CATEGORIES } from '../data/products'
import { useProducts } from '../context/ProductContext'

export default function Products() {
  const [searchParams,setSearchParams] = useSearchParams()
  const { products,loading,error,refreshProducts } = useProducts()
  const category = searchParams.get('category') || 'all'
  const visible = products.filter(p => p.isActive && (category === 'all' || p.category === category))
  return <main className="mx-auto max-w-7xl px-6 py-14">
    <h1 className="text-3xl font-semibold">Бүтээгдэхүүн</h1>
    <p className="mt-2 text-stone">Худи, даавуун цүнхээ сонгоод өөрийн загвараа оруулаарай.</p>
    <div className="mt-8 flex flex-wrap gap-3">{CATEGORIES.map(item=><button key={item.id} type="button" onClick={()=>setSearchParams(item.id==='all'?{}:{category:item.id})} className={`rounded-full border px-5 py-2 text-sm transition ${category===item.id?'border-ink bg-ink text-white':'border-sand hover:border-ink'}`}>{item.name}</button>)}</div>
    {loading && <p className="mt-10">Бүтээгдэхүүн ачаалж байна...</p>}
    {!loading && error && <div role="alert" className="mt-10 rounded-lg bg-red-50 p-5 text-red-800">Өгөгдлийн сангаас мэдээлэл татаж чадсангүй. SQL schema болон Supabase тохиргоогоо шалгана уу.<p className="mt-2 text-xs">{error}</p><button className="mt-3 underline" onClick={refreshProducts}>Дахин оролдох</button></div>}
    {!loading && !error && visible.length===0 && <p className="mt-10 text-stone">Одоогоор энэ ангилалд бүтээгдэхүүн алга.</p>}
    <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">{visible.map(product=><ProductCard key={product.id} product={product}/>)}</div>
  </main>
}
