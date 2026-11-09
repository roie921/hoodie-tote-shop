import { createContext, useContext, useState } from 'react'

const DesignContext = createContext(null)

export function DesignProvider({ children }) {
  const [designs, setDesigns] = useState({})

  const saveDesign = (productId, design) => {
    setDesigns((current) => {
      const next = { ...current }

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
