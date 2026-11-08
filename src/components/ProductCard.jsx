import { Link } from 'react-router-dom'
import ProductMockup from './ProductMockup'
import { getCategoryName } from '../data/products'
import { formatPrice } from '../utils/format'

function ProductCard({ product }) {
  const firstColor = product.colors[0]

  return (
    <Link to={`/products/${product.id}`} className="group block">
      <div className="rounded-2xl bg-beige p-6 transition group-hover:bg-sand">
        <ProductMockup
          category={product.category}
          colorHex={firstColor.hex}
          alt={product.name}
        />
      </div>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-medium">{product.name}</h3>
          <p className="mt-1 text-sm text-stone">{getCategoryName(product.category)}</p>
        </div>
        <p className="font-medium">{formatPrice(product.price)}</p>
      </div>

      <div className="mt-3 flex gap-2">
        {product.colors.map((color) => (
          <span
            key={color.id}
            title={color.name}
            className="h-4 w-4 rounded-full border border-sand"
            style={{ backgroundColor: color.hex }}
          />
        ))}
      </div>
    </Link>
  )
}

export default ProductCard
