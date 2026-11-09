import { createContext, useContext, useState } from 'react'

const CartContext = createContext(null)

let nextItemId = 1

export function CartProvider({ children }) {
  const [items, setItems] = useState([])

  const addItem = (product, options, designImages = null) => {
    const id = nextItemId++
    const newItem = {
      id,
      productId: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      colorName: options.color.name,
      colorHex: options.color.hex,
      size: options.size,
      quantity: options.quantity,
      designImages,
    }
    setItems((current) => [...current, newItem])
  }

  const removeItem = (id) => {
    setItems((current) => current.filter((item) => item.id !== id))
  }

  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, totalCount, totalPrice }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  return useContext(CartContext)
}
