import { useState } from 'react'
import { Search, ShoppingBag, Menu, X, MessageCircle } from 'lucide-react'
import { siteConfig } from '../config/siteConfig'
import { navigation } from '../data/navigation'
import { useStore } from '../context/StoreContext'
import { openWhatsAppOrder } from '../utils/whatsapp'

export function Header({ onSearch, onOpenCart, onCategory }) {
  const { count, language, setLanguage, cart, assets, settings } = useStore()
  const [query, setQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const bn = language === 'bn'
  const search = event => { event.preventDefault(); onSearch(query); document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' }) }
  const whatsapp = () => { try { openWhatsAppOrder({ items: cart, whatsappNumber: settings.whatsappNumber }) } catch (e) { alert(e.message) } }
  return <header className="site-header">
    <div className="announcement">A little more thoughtful, delivered to your door <span>✳</span> দেশের যেকোনো প্রান্তে ডেলিভারি</div>
    <div className="header-main wrap">
      <button className="icon-btn menu-toggle" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X/> : <Menu/>}</button>
      <a href="#home" className="brand" aria-label={`${siteConfig.brandName} home`}><img src={assets.logo||siteConfig.logoPath} alt="Shilpon logo" /><span className="brand-copy"><strong>Shilpon</strong><small>MADE WITH CARE</small></span></a>
      <form className={`search-form ${searchOpen ? 'search-open' : ''}`} onSubmit={search}><Search size={17}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder={bn ? 'পণ্য খুঁজুন…' : 'What are you looking for?'} aria-label="Search products"/><button type="button" aria-label="Search products" onClick={event => { if (window.matchMedia('(max-width: 650px)').matches && !searchOpen) setSearchOpen(true); else event.currentTarget.form.requestSubmit() }}><span className="sr-only">Search</span><Search size={16}/></button></form>
      <div className="header-actions"><button className="language-toggle" onClick={() => setLanguage(bn ? 'en' : 'bn')} aria-label="Change language">{bn ? 'EN' : 'বাং'}</button><button className="whatsapp-header" onClick={whatsapp}><MessageCircle size={16}/> <span>{bn ? 'WhatsApp অর্ডার' : 'Order on WhatsApp'}</span></button><button id="cart" className="cart-trigger" onClick={onOpenCart} aria-label={`Open cart, ${count} items`}><ShoppingBag size={20}/><span className="cart-count">{count}</span><span className="cart-label">{bn ? 'ব্যাগ' : 'Bag'}</span></button></div>
    </div>
    <nav className={`category-nav ${menuOpen ? 'nav-open' : ''}`} aria-label="Main navigation"><div className="wrap nav-inner">{navigation.map(item => <a key={item.href} href={item.href} onClick={event => { setMenuOpen(false); if (item.href.startsWith('#category-')) { event.preventDefault(); onCategory(item.href.slice('#category-'.length)) } }}><span>{item.label}</span>{item.bn && <small>{item.bn}</small>}</a>)}<a href="#contact" className="nav-local">Dinajpur · Bangladesh</a></div></nav>
  </header>
}
