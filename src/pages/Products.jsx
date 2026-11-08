import { useSearchParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { CATEGORIES, products } from '../data/products'

function Products() {
  const [searchParams, setSearchParams] = useSearchParams()
  const category = searchParams.get('category') || 'all'

  const visibleProducts =
    category === 'all' ? products : products.filter((product) => product.category === category)

  const handleCategoryChange = (id) => {
    setSearchParams(id === 'all' ? {} : { category: id })
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-14">
      <h1 className="text-3xl font-semibold">Бүтээгдэхүүн</h1>
      <p className="mt-2 text-stone">
        Худи, даавуун цүнхээ сонгоод өөрийн загвараа оруулаарай.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        {CATEGORIES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => handleCategoryChange(item.id)}
            className={`rounded-full border px-5 py-2 text-sm transition ${
              category === item.id ? 'border-ink bg-ink text-white' : 'border-sand hover:border-ink'
            }`}
          >
            {item.name}
          </button>
        ))}
      </div>

      <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {visibleProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </main>
  )
}

export default Products
