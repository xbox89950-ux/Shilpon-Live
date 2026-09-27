import { MessageCircle } from 'lucide-react'
import { siteConfig } from '../config/siteConfig'
import { useStore } from '../context/StoreContext'
import { normalizeWhatsAppNumber } from '../utils/whatsapp'
export function WhatsAppButton() {
  const { settings } = useStore()
  const number = normalizeWhatsAppNumber(settings.whatsappNumber || siteConfig.whatsappNumber)
  const link = number.includes('X') ? '#contact' : `https://wa.me/${number}?text=${encodeURIComponent('আসসালামু আলাইকুম, Shilpon সম্পর্কে জানতে চাই।')}`
  return <a className="floating-whatsapp" href={link} target={number.includes('X') ? undefined : '_blank'} rel="noreferrer" aria-label="Chat with us on WhatsApp"><MessageCircle size={22}/><span>Chat with us</span></a>
}
