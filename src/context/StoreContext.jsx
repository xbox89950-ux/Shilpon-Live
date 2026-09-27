import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { products as defaultProducts } from '../data/products'
import { categories as defaultCategories } from '../data/categories'
import { siteConfig } from '../config/siteConfig'
import { deleteBrowserRecord, loadOrMigrateRecord, MAX_BROWSER_STORE_BYTES, requestPersistentBrowserStorage, writeBrowserRecord } from '../services/browserStorage'

const StoreContext = createContext(null)
const defaultSettings = () => ({ whatsappNumber: siteConfig.whatsappNumber, phone: siteConfig.phone, email: siteConfig.email, address: siteConfig.address })
const getLegacy = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) || fallback } catch { return fallback } }

export function StoreProvider({ children }) {
  const [cart, setCart] = useState(() => getLegacy('shilpon-cart', []))
  const cartRef = useRef(cart)
  const [language, setLanguage] = useState('en')
  const [products, setProductsState] = useState(() => getLegacy('shilpon-products', defaultProducts))
  const [categories, setCategoriesState] = useState(() => getLegacy('shilpon-categories', defaultCategories))
  const [assets, setAssetsState] = useState(() => getLegacy('shilpon-assets', {}))
  const [settings, setSettingsState] = useState(() => getLegacy('shilpon-settings', defaultSettings()))

  useEffect(() => {
    let active = true
    requestPersistentBrowserStorage().catch(() => {})
    const migrate = (key, legacyKey, fallback, current) => loadOrMigrateRecord(key, legacyKey, fallback).catch(() => current)
    Promise.all([
      migrate('products', 'shilpon-products', defaultProducts, products),
      migrate('categories', 'shilpon-categories', defaultCategories, categories),
      migrate('assets', 'shilpon-assets', {}, assets),
      migrate('settings', 'shilpon-settings', defaultSettings(), settings),
      migrate('cart', 'shilpon-cart', [], cart),
    ]).then(([savedProducts, savedCategories, savedAssets, savedSettings, savedCart]) => {
      if (!active) return
      setProductsState(savedProducts)
      setCategoriesState(savedCategories)
      setAssetsState(savedAssets)
      setSettingsState(savedSettings)
      cartRef.current = savedCart
      setCart(savedCart)
    })
    return () => { active = false }
  // Hydrate legacy browser data once, then keep the editor data in IndexedDB.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const saveProducts = async next => { await writeBrowserRecord('products', next); localStorage.removeItem('shilpon-products'); setProductsState(next) }
  const saveCategories = async next => { await writeBrowserRecord('categories', next); localStorage.removeItem('shilpon-categories'); setCategoriesState(next) }
  const saveAsset = async (key, value) => { const next = { ...assets, [key]: value }; await writeBrowserRecord('assets', next); localStorage.removeItem('shilpon-assets'); setAssetsState(next) }
  const saveSettings = async next => { await writeBrowserRecord('settings', next); localStorage.removeItem('shilpon-settings'); setSettingsState(next) }
  const resetShop = async () => {
    await Promise.all(['products', 'categories', 'assets', 'settings'].map(deleteBrowserRecord))
    ;['shilpon-products', 'shilpon-categories', 'shilpon-assets', 'shilpon-settings'].forEach(key => localStorage.removeItem(key))
    setProductsState(defaultProducts); setCategoriesState(defaultCategories); setAssetsState({}); setSettingsState(defaultSettings())
  }
  const persistCart = next => {
    cartRef.current = next
    setCart(next)
    writeBrowserRecord('cart', next).then(() => localStorage.removeItem('shilpon-cart')).catch(() => {})
  }
  const addToCart = (product, quantity = 1, variant = {}) => {
    const key = `${product.id}:${variant.size || ''}:${variant.color || ''}`
    const compactProduct = { ...product, images: (product.images || []).slice(0, 1), videos: [] }
    const items = cartRef.current
    const index = items.findIndex(item => item.key === key)
    const next = index >= 0
      ? items.map((item, i) => i === index ? { ...item, quantity: Math.min(product.stock, item.quantity + quantity), product: compactProduct } : item)
      : [...items, { key, product: compactProduct, quantity: Math.min(product.stock, quantity), ...variant }]
    persistCart(next)
  }
  const setQuantity = (key, quantity) => persistCart(cartRef.current.map(item => item.key === key ? { ...item, quantity } : item).filter(item => item.quantity > 0))
  const removeFromCart = key => setQuantity(key, 0)
  const clearCart = () => { cartRef.current = []; setCart([]); deleteBrowserRecord('cart').catch(() => {}); localStorage.removeItem('shilpon-cart') }
  const value = useMemo(() => ({ cart, language, setLanguage, addToCart, setQuantity, removeFromCart, clearCart, count: cart.reduce((n, i) => n + i.quantity, 0), products, saveProducts, categories, saveCategories, assets, saveAsset, settings, saveSettings, resetShop, photoStorageLimitBytes: MAX_BROWSER_STORE_BYTES }), [cart, language, products, categories, assets, settings])
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}
export const useStore = () => useContext(StoreContext)
