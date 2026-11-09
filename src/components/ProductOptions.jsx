import { HOODIE_SIZES } from '../data/products'

function ProductOptions({ product, options }) {
  const { colorId, setColorId, color, size, setSize, quantity, setQuantity } = options

  const optionButton = (isSelected) =>
    `min-w-12 rounded-full border px-4 py-2 text-sm transition ${
      isSelected ? 'border-ink bg-ink text-white' : 'border-sand hover:border-ink'
    }`

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium">
          Өнгө: <span className="font-normal text-stone">{color.name}</span>
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          {product.colors.map((item) => (
            <button
              key={item.id}
              type="button"
              title={item.name}
              aria-label={item.name}
              onClick={() => setColorId(item.id)}
              className={`h-9 w-9 rounded-full border transition ${
                item.id === colorId
                  ? 'border-ink ring-2 ring-ink ring-offset-2'
                  : 'border-sand hover:border-ink'
              }`}
              style={{ backgroundColor: item.hex }}
            />
          ))}
        </div>
      </div>

      {product.category === 'hoodie' && (
        <div>
          <p className="text-sm font-medium">Хэмжээ</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {HOODIE_SIZES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setSize(item)}
                className={optionButton(item === size)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-sm font-medium">Тоо ширхэг</p>
        <div className="mt-3 inline-flex items-center rounded-full border border-sand">
          <button
            type="button"
            aria-label="Тоо ширхэг хасах"
            disabled={quantity <= 1}
            onClick={() => setQuantity(quantity - 1)}
            className="h-10 w-10 text-lg transition hover:text-stone disabled:opacity-30"
          >
            −
          </button>
          <span className="w-10 text-center text-sm">{quantity}</span>
          <button
            type="button"
            aria-label="Тоо ширхэг нэмэх"
            disabled={quantity >= 99}
            onClick={() => setQuantity(quantity + 1)}
            className="h-10 w-10 text-lg transition hover:text-stone disabled:opacity-30"
          >
            +
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProductOptions
