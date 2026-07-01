import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const QuoteCartContext = createContext(null)
const STORAGE_KEY = 'soono-quote-cart'

function loadStoredItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function QuoteCartProvider({ children }) {
  const [items, setItems] = useState(loadStoredItems)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const addItem = useCallback((item) => {
    setItems((prev) => {
      if (prev.some((i) => i.id === item.id)) return prev
      return [...prev, { ...item, quantity: 1 }]
    })
  }, [])

  const removeItem = useCallback((id) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  const hasItem = useCallback((id) => items.some((i) => i.id === id), [items])

  const value = useMemo(
    () => ({
      items,
      count: items.length,
      addItem,
      removeItem,
      clearCart,
      hasItem,
    }),
    [items, addItem, removeItem, clearCart, hasItem],
  )

  return <QuoteCartContext.Provider value={value}>{children}</QuoteCartContext.Provider>
}

export function useQuoteCart() {
  const ctx = useContext(QuoteCartContext)
  if (!ctx) {
    throw new Error('useQuoteCart must be used within QuoteCartProvider')
  }
  return ctx
}
