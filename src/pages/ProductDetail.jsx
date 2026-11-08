import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import Notice from '../components/Notice'
import ProductMockup from '../components/ProductMockup'
import ProductOptions from '../components/ProductOptions'
import { useCart } from '../context/CartContext'
import { useDesigns } from '../context/DesignContext'
import { getCategoryName, getProductById } from '../data/products'
import useProductOptions, { buildOptionsQuery } from '../hooks/useProductOptions'
import { formatPrice } from '../utils/format'
import { primaryButton, secondaryButton } from '../utils/styles'

const SIDES = [
  { id: 'front', label: 'Урд тал' },
  { id: 'back', label: 'Ар тал' },
]

// Finds the product from the URL, then shows the page content.
function ProductDetail() {
  const { productId } = useParams()
  const product = getProductById(productId)

  if (!product) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-24 text-center">
        <h1 className="text-3xl font-semibold">Бүтээгдэхүүн олдсонгүй</h1>
        <Link to="/products" className={`mt-8 inline-block ${primaryButton}`}>
          Бүтээгдэхүүн рүү буцах
        </Link>
      </main>
    )
  }

  return <ProductDetailContent key={product.id} product={product} />
}

function ProductDetailContent({ product }) {
  const navigate = useNavigate()
  const { addItem } = useCart()
  const { designs } = useDesigns()
  const [searchParams] = useSearchParams()
  // Options can come from the URL when returning from the editor.
  const options = useProductOptions(product, {
    colorId: searchParams.get('color'),
    size: searchParams.get('size'),
    quantity: searchParams.get('quantity'),
  })
  const [side, setSide] = useState('front')
  const [notice, setNotice] = useState(null)

  const savedDesign = designs[product.id]

  const handleAddToCart = () => {
    addItem(product, options, savedDesign ? savedDesign.images : null)
    setNotice({ type: 'success', text: 'Бүтээгдэхүүн сагсанд нэмэгдлээ.' })
  }

  const handleOpenEditor = () => {
    navigate(`/products/${product.id}/design?${buildOptionsQuery(options)}`)
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <Link to="/products" className="text-sm text-stone transition hover:text-ink">
        ← Бүх бүтээгдэхүүн
      </Link>

      <div className="mt-6 grid gap-12 lg:grid-cols-2">
        {/* Images */}
        <div>
          <div className="rounded-2xl bg-beige p-8">
            <ProductMockup
              category={product.category}
              colorHex={options.color.hex}
              side={side}
              overlay={savedDesign ? savedDesign.images[side] : null}
              alt={`${product.name}, ${options.color.name}`}
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            {SIDES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSide(item.id)}
                className={`rounded-xl border bg-beige p-3 text-center text-sm transition ${
                  side === item.id ? 'border-ink' : 'border-transparent hover:border-sand'
                }`}
              >
                <div className="mx-auto w-24">
                  <ProductMockup
                    category={product.category}
                    colorHex={options.color.hex}
                    side={item.id}
                    overlay={savedDesign ? savedDesign.images[item.id] : null}
                    alt={item.label}
                  />
                </div>
                <span className="mt-2 block">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-stone">
            {getCategoryName(product.category)}
          </p>
          <h1 className="mt-2 text-3xl font-semibold md:text-4xl">{product.name}</h1>
          <p className="mt-3 text-2xl">{formatPrice(product.price)}</p>
          <p className="mt-6 text-stone">{product.description}</p>

          <div className="mt-8">
            <ProductOptions product={product} options={options} />
          </div>

          {savedDesign && (
            <p className="mt-6 text-sm text-stone">
              Таны хадгалсан загвар зураг дээр харагдаж байна. Сагсанд нэмэхэд загвар хамт орно.
            </p>
          )}

          <div className="mt-6">
            <Notice notice={notice} />
          </div>

          <div className="mt-6 flex flex-wrap gap-4">
            <button type="button" onClick={handleAddToCart} className={primaryButton}>
              Сагсанд нэмэх
            </button>
            <button type="button" onClick={handleOpenEditor} className={secondaryButton}>
              Загвараа өөрчлөх
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}

export default ProductDetail
