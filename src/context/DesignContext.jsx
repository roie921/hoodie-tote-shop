import { createContext, useContext, useState } from 'react'

const DesignContext = createContext(null)

// Stores the saved custom design for each product (in React state only).
// A design looks like:
// { json: { front, back }, images: { front, back } }
// "json" is used to reopen the editor, "images" are transparent PNG previews.
export function DesignProvider({ children }) {
  const [designs, setDesigns] = useState({})

  const saveDesign = (productId, design) => {
    setDesigns((current) => {
      const next = { ...current }
      // If both sides are empty there is nothing to keep.
      if (!design.images.front && !design.images.back) {
        delete next[productId]
      } else {
        next[productId] = design
      }
      return next
    })
  }

  return (
    <DesignContext.Provider value={{ designs, saveDesign }}>
      {children}
    </DesignContext.Provider>
  )
}

export function useDesigns() {
  return useContext(DesignContext)
}
