import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const ProductContext = createContext(null)

function normalizeProduct(row) {
  const variants = row.product_variants ?? []
  const colors = [...new Map(variants.filter(v => v.is_active).map(v => [v.color_key,
    { id: v.color_key, name: v.color_name, hex: v.color_hex }])).values()]
  return {
    id: row.slug, dbId: row.id, category: row.categories?.slug ?? 'hoodie',
    name: row.name, description: row.description, price: row.price,
    isActive: row.is_active, colors: colors.length ? colors : [{ id: 'white', name: 'Цагаан', hex: '#f4f4f2' }],
    variants,
  }
}

export function ProductProvider({ children }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const refreshProducts = useCallback(async () => {
    setLoading(true)
    const { data, error: fetchError } = await supabase.from('products')
      .select('id,slug,name,description,price,is_active,categories(slug),product_variants(id,color_key,color_name,color_hex,size,stock_quantity,is_active)')
      .order('created_at', { ascending: false })
    if (fetchError) {
      setError(fetchError.message)
    } else {
      setError('')
      setProducts((data ?? []).map(normalizeProduct))
    }
    setLoading(false)
  }, [])
  useEffect(() => { refreshProducts() }, [refreshProducts])
  return <ProductContext.Provider value={{ products, loading, error, refreshProducts, getProductById: id => products.find(p => p.id === id) }}>
    {children}
  </ProductContext.Provider>
}
export function useProducts() {
  const value = useContext(ProductContext)
  if (!value) throw new Error('useProducts must be used in ProductProvider')
  return value
}
