import { ShoppingBag, MessageCircle, ArrowUpRight } from 'lucide-react'
import { currentPrice, money } from '../utils/format'
import { useStore } from '../context/StoreContext'
import { openWhatsAppOrder } from '../utils/whatsapp'
import { productPath } from '../utils/productSeo'

export function ProductCard({ product, onSelect }) {
  const { addToCart, language, settings } = useStore()
  const bn = language === 'bn'
  const sold = product.stock <= 0
  const discount = product.salePrice ? Math.round((1 - product.salePrice / product.price) * 100) : 0
  return <article className="product-card">
    <a href={productPath(product, import.meta.env.BASE_URL)} className="product-image" onClick={event=>{event.preventDefault();onSelect(product)}} aria-label={`View ${product.name}`}><img src={product.images[0]} alt={product.bn || product.name} loading="lazy"/>{discount > 0 && <span className="discount-badge">{discount}% off</span>}{product.badge && !discount && <span className="product-badge">{product.badge}</span>}<span className={`stock-badge ${sold ? 'sold-out' : ''}`}>{sold ? 'Sold out' : 'In stock'}</span><span className="view-arrow"><ArrowUpRight size={16}/></span></a>
    <div className="product-info"><div className="product-title-line"><a className="product-name" href={productPath(product, import.meta.env.BASE_URL)} onClick={event=>{event.preventDefault();onSelect(product)}}>{bn && product.bn ? product.bn : product.name}</a><span className="product-category-label">{product.category}</span></div><p className="product-description">{bn && product.bnDescription ? product.bnDescription : product.description}</p><div className="product-rating"><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m12 2 2.8 6.5 7 .6-5.3 4.6 1.6 6.8-5.3 4.6 7-.6z"/></svg><b>{product.rating}</b><span>({product.reviews})</span><span className="rating-stock">{product.stock} in stock</span></div><div className="product-buyline"><div className="price-group"><strong>{money(currentPrice(product))}</strong>{product.salePrice && <del>{money(product.price)}</del>}</div><button className="add-quick" disabled={sold} onClick={() => addToCart(product)}><ShoppingBag size={15}/> <span>{sold ? 'Sold out' : bn ? 'ঝুড়িতে' : 'Add'}</span></button></div><div className="card-actions"><button className="card-buy" disabled={sold} onClick={() => { addToCart(product); document.getElementById('cart')?.click() }}>{bn ? 'এখনই কিনুন' : 'Buy now'}</button><button className="card-whatsapp" onClick={() => { try { openWhatsAppOrder({ items: [{ product, quantity: 1 }], whatsappNumber: settings.whatsappNumber }) } catch(e) { alert(e.message) } }} aria-label="Order on WhatsApp"><MessageCircle size={16}/></button></div></div>
  </article>
}
