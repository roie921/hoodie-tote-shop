import { Link } from 'react-router-dom'
import ProductMockup from '../components/ProductMockup'
import { useCart } from '../context/CartContext'
import { formatPrice } from '../utils/format'
import { primaryButton } from '../utils/styles'

function Cart() {
  const { items, removeItem, totalPrice } = useCart()

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-24 text-center">
        <h1 className="text-3xl font-semibold">Таны сагс хоосон байна</h1>
        <Link to="/products" className={`mt-8 inline-block ${primaryButton}`}>
          Бүтээгдэхүүн үзэх
        </Link>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-14">
      <h1 className="text-3xl font-semibold">Миний сагс</h1>

      <ul className="mt-8 divide-y divide-sand border-y border-sand">
        {items.map((item) => {
          // Show a thumbnail for each side that has a custom design.
          const designSides = item.designImages
            ? ['front', 'back'].filter((side) => item.designImages[side])
            : []
          const thumbnails = designSides.length > 0 ? designSides : ['front']

          return (
            <li key={item.id} className="flex flex-wrap items-center gap-6 py-6">
              <div className="flex gap-2">
                {thumbnails.map((side) => (
                  <div key={side} className="w-20 rounded-lg bg-beige p-1">
                    <ProductMockup
                      category={item.category}
                      colorHex={item.colorHex}
                      side={side}
                      overlay={item.designImages ? item.designImages[side] : null}
                      alt={item.name}
                    />
                  </div>
                ))}
              </div>

              <div className="min-w-48 flex-1">
                <p className="font-medium">{item.name}</p>
                <p className="mt-1 text-sm text-stone">
                  Өнгө: {item.colorName}
                  {item.size && ` · Хэмжээ: ${item.size}`}
                  {` · Тоо: ${item.quantity}`}
                </p>
                {item.designImages && (
                  <p className="mt-1 text-sm text-stone">Өөрийн загвартай</p>
                )}
              </div>

              <div className="text-right">
                <p className="font-medium">{formatPrice(item.price * item.quantity)}</p>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="mt-2 text-sm text-stone underline transition hover:text-ink"
                >
                  Устгах
                </button>
              </div>
            </li>
          )
        })}
      </ul>

      <div className="mt-8 flex items-center justify-between text-lg">
        <span>Нийт дүн</span>
        <span className="font-semibold">{formatPrice(totalPrice)}</span>
      </div>
    </main>
  )
}

export default Cart
