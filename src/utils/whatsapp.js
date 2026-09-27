import { siteConfig } from '../config/siteConfig'
import { currentPrice } from './format'

export function normalizeWhatsAppNumber(value) {
  const digits = String(value).replace(/\D/g, '')
  return digits.startsWith('0') ? `88${digits}` : digits
}

// This single helper composes product, cart and checkout messages in BN/English.
export function openWhatsAppOrder({ items, customer = {}, address = '', total, deliveryCharge = 0, whatsappNumber = siteConfig.whatsappNumber }) {
  const number = normalizeWhatsAppNumber(whatsappNumber)
  if (number.includes('X') || number.length < 10) throw new Error('WhatsApp number is a placeholder. Update src/config/siteConfig.js first.')
  const lines = items.map(({ product, quantity, size, color }) => `• ${product.bn || product.name} / ${product.name} (ID: ${product.id})\n  Qty: ${quantity} | Variant: ${[size, color].filter(Boolean).join(' / ') || 'Default'} | Unit: ${currentPrice(product)}`)
  const subtotal = items.reduce((sum, item) => sum + currentPrice(item.product) * item.quantity, 0)
  const message = [
    `আসসালামু আলাইকুম, Shilpon থেকে অর্ডার করতে চাই।`, '', ...lines, '',
    `Customer / নাম: ${customer.name || '—'}`, `Phone / ফোন: ${customer.phone || '—'}`,
    `Address / ঠিকানা: ${address || customer.address || '—'}`, `Items subtotal: ${subtotal} ৳`,
    `Delivery: ${deliveryCharge} ৳`, `Total / মোট: ${total ?? subtotal + deliveryCharge} ৳`,
  ].join('\n')
  window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
}
