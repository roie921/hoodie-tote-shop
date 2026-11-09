import { useState } from 'react'
import { HOODIE_SIZES } from '../data/products'

export default function useProductOptions(product, initial = {}) {
  const isHoodie = product.category === 'hoodie'

  const [colorId, setColorId] = useState(() =>
    product.colors.some((color) => color.id === initial.colorId)
      ? initial.colorId
      : product.colors[0].id
  )

  const [size, setSize] = useState(() =>
    HOODIE_SIZES.includes(initial.size) ? initial.size : 'M'
  )

  const [quantity, setQuantity] = useState(() => {
    const value = Number(initial.quantity)
    return Number.isInteger(value) && value >= 1 && value <= 99 ? value : 1
  })

  const color = product.colors.find((item) => item.id === colorId)

  return {
    colorId,
    setColorId,
    color,
    size: isHoodie ? size : null,
    setSize,
    quantity,
    setQuantity,
  }
}

export function buildOptionsQuery(options) {
  const params = new URLSearchParams({
    color: options.colorId,
    quantity: String(options.quantity),
  })
  if (options.size) {
    params.set('size', options.size)
  }
  return params.toString()
}
