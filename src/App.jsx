import { useEffect, useMemo, useState } from 'react'
import { ArrowDown, ArrowRight, ArrowUpRight, Check, ChevronLeft, ChevronRight, Leaf, PackageCheck, Sparkles, Star, X, Minus, Plus, MessageCircle, ShoppingBag, ShieldCheck, Truck } from 'lucide-react'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { ProductCard } from './components/ProductCard'
import { CartDrawer } from './components/CartDrawer'
import { CheckoutForm } from './components/CheckoutForm'
import { InfoPage } from './components/InfoPages'
import { StoreAdmin } from './components/StoreAdmin'
import { WhatsAppButton } from './components/WhatsAppButton'
import { StoreProvider, useStore } from './context/StoreContext'
import { testimonials } from './data/testimonials'
import { siteConfig } from './config/siteConfig'
import { currentPrice, money } from './utils/format'
import { openWhatsAppOrder } from './utils/whatsapp'

function AppContent() {
  const store = useStore()
  const { products, categories, assets, settings } = store
  const [hash, setHash] = useState(window.location.hash.replace('#','') || 'home')
  const [searchTerm, setSearchTerm] = useState('')
  const [category, setCategory] = useState('all')
  const [sort, setSort] = useState('featured')
  const [cartOpen, setCartOpen] = useState(false)
  const [selected, setSelected] = useState(() => products.find(product=>product.id===new URLSearchParams(window.location.search).get('product'))||null)
  const [checkout, setCheckout] = useState(false)
  const [success, setSuccess] = useState(null)
  const [variant, setVariant] = useState({ size: '', color: '' })
  const [quantity, setQuantity] = useState(1)
  const [reviewIndex, setReviewIndex] = useState(0)
  const [newsletter, setNewsletter] = useState('')
  const [newsletterDone, setNewsletterDone] = useState(false)
  const bn = store.language === 'bn'
  // Keep direct product links working, including after admin edits or a page refresh.
  useEffect(() => {
    const syncProductRoute = () => {
      const productId = new URLSearchParams(window.location.search).get('product')
      if (!productId) return
      const match = products.find(product => product.id === productId)
      if (match) {
        setSelected(match)
        setVariant({ size: match.sizes?.[0] || '', color: match.colors?.[0] || '' })
        setHash('product')
      } else {
        setSelected(null)
        setHash('shop')
      }
    }
    syncProductRoute()
    window.addEventListener('popstate', syncProductRoute)
    return () => window.removeEventListener('popstate', syncProductRoute)
  }, [products])
  const page = (name) => { const url=new URL(window.location.href); if(name!=='product')url.searchParams.delete('product'); url.hash=name; window.history.pushState({},'',url); setHash(name); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const syncRoute = () => { const productId=new URLSearchParams(window.location.search).get('product'); setSelected(products.find(product=>product.id===productId)||null); setHash(productId?'product':window.location.hash.replace('#','')||'home'); setCheckout(false); setSuccess(null) }
  window.onhashchange = syncRoute
  window.onpopstate = syncRoute
  const filteredProducts = useMemo(() => {
    let list = [...products]
    if (category !== 'all') list = list.filter(p => p.category === category)
    if (searchTerm.trim()) { const q = searchTerm.trim().toLowerCase(); list = list.filter(p => `${p.name} ${p.bn} ${p.description} ${p.id}`.toLowerCase().includes(q)) }
    if (sort === 'low') list.sort((a,b) => currentPrice(a)-currentPrice(b))
    if (sort === 'high') list.sort((a,b) => currentPrice(b)-currentPrice(a))
    if (sort === 'new') list.sort((a,b) => Number(b.isNew)-Number(a.isNew))
    return list
  }, [category, searchTerm, sort])
  const showProduct = product => { setSelected(product); setVariant({ size: product.sizes?.[0] || '', color: product.colors?.[0] || '' }); setQuantity(1); const url=new URL(window.location.href);url.search='';url.searchParams.set('product',product.id);url.hash='';window.history.pushState({},'',url);setHash('product');window.scrollTo({top:0,behavior:'smooth'}) }
  const closeProduct = () => { setSelected(null); page('shop') }
  const buyNow = (product, qty=1, picked=variant) => { store.addToCart(product, qty, picked); setSelected(null); setCartOpen(true) }
  const whatsappOne = product => { try { openWhatsAppOrder({ items: [{ product, quantity, ...variant }], whatsappNumber: settings.whatsappNumber }) } catch (e) { alert(e.message) } }
  const startCheckout = () => { setCartOpen(false); setCheckout(true); setSuccess(null); page('checkout') }
  const home = <>
    <section className="hero wrap" id="home"><div className="hero-photo" role="img" aria-label="A curated collection of clothing from Shilpon"><img src={assets.banner||siteConfig.bannerPath} alt="Shilpon clothing collection"/><div className="hero-image-credit"><span>EVERYDAY STYLE, THOUGHTFULLY CHOSEN</span><span>From Dinajpur with care</span></div></div><div className="hero-copy"><span className="eyebrow"><i/> CLOTHES FOR EVERY DAY</span><h1>Made to feel<br/><em>like you.</em></h1><p>Comfortable, considered clothing for men, women, boys and girls—chosen for the days you live in.</p><a href="#shop" className="button button-dark">Explore the collection <ArrowRight size={17}/></a><div className="hero-note"><span className="tiny-stamp">S✳</span><span>Proudly rooted in Dinajpur<br/>Delivery across Bangladesh</span></div></div><div className="hero-side-label">MEN · WOMEN · BOYS · GIRLS · EVERYDAY STYLE</div></section>
    <section className="value-strip"><div className="wrap value-inner"><span><Leaf size={17}/> Carefully chosen</span><i/><span><PackageCheck size={17}/> Packed with care</span><i/><span><Truck size={17}/> Delivered nationwide</span><i/><span><ShieldCheck size={17}/> Easy Cash on Delivery</span></div></section>
    <section className="section wrap categories-section" id="categories"><div className="section-heading"><div><span className="eyebrow">LITTLE THINGS FOR GOOD DAYS</span><h2>Where should we <em>start?</em></h2></div><a href="#shop" className="text-link">All the good things <ArrowUpRight size={16}/></a></div><div className="category-grid">{categories.map((item,i)=><button id={`category-${item.id}`} className={`category-tile tone-${item.tone}`} key={item.id} onClick={() => { setCategory(item.id); page('shop') }}><img src={item.image} alt={item.name} loading="lazy"/><span className="category-ordinal">0{i+1}</span><span className="category-name">{item.name}</span><span className="category-bengali">{item.bn}</span><span className="category-circle"><ArrowUpRight size={17}/></span></button>)}</div></section>
    <section className="section product-section" id="popular"><div className="wrap"><div className="section-heading"><div><span className="eyebrow">THE ONES YOU LOVE</span><h2>A few <em>favourites.</em></h2><p className="section-sub">Thoughtful finds that make the everyday a little nicer.</p></div><a href="#shop" className="text-link">Shop everything <ArrowUpRight size={16}/></a></div><div className="product-grid">{products.filter(p=>p.featured).slice(0,4).map(p=><ProductCard key={p.id} product={p} onSelect={showProduct}/>)}</div></div></section>
    <section className="story-banner wrap"><div className="story-image"><img src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=85" alt="A selection of everyday clothing" loading="lazy"/><span className="story-caption">GOOD FIT. GOOD FEEL. EVERY DAY.</span></div><div className="story-copy"><span className="eyebrow">FIND YOUR EVERYDAY FAVOURITE</span><span className="gift-sparkle">✳</span><h2>Good clothes.<br/><em>Good days.</em></h2><p>Explore easy-to-wear styles for the whole family, from everyday essentials to something a little special.</p><a className="button button-dark" href="#shop" onClick={() => setCategory('all')}>Shop the collection <ArrowRight size={16}/></a></div></section>
    <section className="section wrap new-section" id="new"><div className="section-heading"><div><span className="eyebrow">JUST FOUND ITS WAY HERE</span><h2>New to the <em>shelf.</em></h2></div><span className="new-count"><Sparkles size={16}/> Freshly picked</span></div><div className="product-grid">{products.filter(p=>p.isNew).map(p=><ProductCard key={p.id} product={p} onSelect={showProduct}/>)}</div></section>
    <section className="why-section" id="about"><div className="wrap"><div className="why-heading"><span className="eyebrow">THE SHILPON WAY</span><h2>Good things feel<br/><em>good in every way.</em></h2><p>We think about the little details, so you can simply enjoy them.</p></div><div className="why-grid"><div><span className="why-icon">✳</span><h3>Picked with purpose</h3><p>Every find earns its place. Useful, well made and a pleasure to live with.</p></div><div><span className="why-icon">♡</span><h3>Made close to home</h3><p>We celebrate local makers and the care they put into their craft.</p></div><div><span className="why-icon">↗</span><h3>Here for real life</h3><p>Lovely things should be used, loved, gifted and enjoyed every day.</p></div></div><a className="text-link why-link" href="#about">A little more about us <ArrowUpRight size={15}/></a></div></section>
    <section className="reviews-section wrap"><div className="review-title"><span className="eyebrow">KIND WORDS, REAL PEOPLE</span><h2>A little note<br/><em>from you.</em></h2><p>★★★★★ <span>4.8 average from our lovely customers</span></p></div><div className="review-card"><span className="quote-mark">“</span><div className="review-stars">★★★★★</div><blockquote>{testimonials[reviewIndex].text}</blockquote><div className="review-person"><span className="avatar">{testimonials[reviewIndex].name.split(' ').map(n=>n[0]).join('')}</span><div><b>{testimonials[reviewIndex].name}</b><small>{testimonials[reviewIndex].area}</small></div><div className="review-controls"><button onClick={() => setReviewIndex((reviewIndex+testimonials.length-1)%testimonials.length)} aria-label="Previous review"><ChevronLeft size={18}/></button><button onClick={() => setReviewIndex((reviewIndex+1)%testimonials.length)} aria-label="Next review"><ChevronRight size={18}/></button></div></div></div></section>
    <section className="newsletter-section"><div className="wrap newsletter-inner"><div><span className="eyebrow">A GOOD NOTE NOW AND THEN</span><h2>A little joy in<br/><em>your inbox.</em></h2><p>New finds, small stories and the occasional good thing. No noise.</p></div><form onSubmit={e=>{e.preventDefault();if(newsletter.includes('@'))setNewsletterDone(true)}}>{newsletterDone ? <p className="newsletter-success"><Check size={18}/> Thanks. Newsletter signup needs a backend connection before launch.</p> : <><label htmlFor="newsletter-email">YOUR EMAIL ADDRESS</label><div className="newsletter-input"><input required id="newsletter-email" type="email" value={newsletter} onChange={e=>setNewsletter(e.target.value)} placeholder="you@example.com"/><button aria-label="Preview newsletter signup"><ArrowRight size={19}/></button></div><small>Signup preview only; no email will be stored or sent.</small></>}</form><span className="newsletter-flower">✳</span></div></section>
  </>
  const shop = <main className="shop-page wrap" id="shop"><div className="shop-intro"><span className="eyebrow">A CONSIDERED LITTLE COLLECTION</span><h1>Good things, <em>right this way.</em></h1><p>Useful things, made with care, ready for real life.</p></div><div className="shop-toolbar"><div className="filter-chips"><button className={category==='all'?'active':''} onClick={()=>setCategory('all')}>Everything</button>{categories.map(c=><button className={category===c.id?'active':''} key={c.id} onClick={()=>setCategory(c.id)}>{c.name}{c.bn && <span className="filter-bengali"> · {c.bn}</span>}</button>)}</div><label className="sort-control"><span>Sort</span><select value={sort} onChange={e=>setSort(e.target.value)}><option value="featured">Featured</option><option value="new">Newest</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option></select></label></div>{searchTerm && <div className="search-results-label">Showing results for “{searchTerm}” <button onClick={()=>setSearchTerm('')}>Clear</button></div>}{filteredProducts.length ? <div className="product-grid shop-grid">{filteredProducts.map(p=><ProductCard key={p.id} product={p} onSelect={showProduct}/>)}</div> : <div className="empty-results"><span>⌕</span><h2>Nothing on this shelf yet.</h2><p>Try another search or take a look at everything.</p><button className="button button-dark" onClick={()=>{setSearchTerm('');setCategory('all')}}>Show me everything</button></div>}</main>
  const isHome = !['shop','category','checkout','order-success','product','about','faq','returns','privacy','terms','contact','shipping','manage'].includes(hash)
  const renderInfo = () => <InfoPage type={hash === 'category' ? category : hash}/>
  const activeProduct = selected || (hash === 'product' ? products.find(product => product.id === new URLSearchParams(window.location.search).get('product')) : null)
  useEffect(()=>{
    const product=activeProduct&&(hash==='product'||selected)?activeProduct:null
    const categoryPage=categories.find(item=>item.id===category)
    const title=product?`${product.name} | Shilpon Clothing`:categoryPage&&hash==='shop'?`${categoryPage.name} Clothing | Shilpon`:hash==='shop'?'Shop Clothes for Men, Women & Kids | Shilpon':hash==='about'?'About Shilpon | Clothing in Dinajpur':hash==='faq'?'FAQs | Shilpon Clothing':hash==='returns'?'Returns & Exchanges | Shilpon':hash==='privacy'?'Privacy Policy | Shilpon':hash==='terms'?'Terms & Conditions | Shilpon':'Shilpon | Men’s, Women’s & Kids’ Clothing in Bangladesh'
    const description=product?`${product.description} ${product.stock>0?'Available to order':'Currently out of stock'}. Price ${currentPrice(product)} BDT. Delivery across Bangladesh.`:categoryPage&&hash==='shop'?`Shop ${categoryPage.name.toLowerCase()} clothing from Shilpon, based in Dinajpur. Delivery across Bangladesh.`:'Shop clothing for men, women, boys and girls at Shilpon. Everyday styles delivered across Bangladesh from Dinajpur.'
    document.title=title
    const setMeta=(selector,attribute,value)=>{let element=document.head.querySelector(selector);if(!element){element=document.createElement('meta');element.setAttribute(attribute,value.key);document.head.appendChild(element)}element.setAttribute(attribute,value.content)}
    setMeta('meta[name="description"]','name',{key:'description',content:description})
    setMeta('meta[property="og:title"]','property',{key:'og:title',content:title})
    setMeta('meta[property="og:description"]','property',{key:'og:description',content:description})
    setMeta('meta[property="og:type"]','property',{key:'og:type',content:product?'product':'website'})
    const canonical=new URL(window.location.pathname,window.location.origin);if(product)canonical.searchParams.set('product',product.id)
    const shareImage=product?.images?.find(image=>/^https?:/.test(image))||new URL(assets.logo||siteConfig.logoPath,window.location.origin).href
    setMeta('meta[property="og:image"]','property',{key:'og:image',content:shareImage})
    setMeta('meta[property="og:url"]','property',{key:'og:url',content:canonical.href})
    let canonicalLink=document.head.querySelector('link[rel="canonical"]');if(!canonicalLink){canonicalLink=document.createElement('link');canonicalLink.rel='canonical';document.head.appendChild(canonicalLink)}canonicalLink.href=canonical.href
    const graph=[{'@type':'ClothingStore',name:siteConfig.brandName,url:window.location.origin,logo:new URL(assets.logo||siteConfig.logoPath,window.location.origin).href,telephone:settings.phone,address:{'@type':'PostalAddress',addressLocality:'Dinajpur',addressRegion:'Rangpur',addressCountry:'BD'},areaServed:'Bangladesh'}]
    if(product)graph.push({'@type':'Product',name:product.name,description:product.description,sku:product.id,category:product.category,image:product.images.filter(image=>/^https?:/.test(image)),brand:{'@type':'Brand',name:siteConfig.brandName},offers:{'@type':'Offer',priceCurrency:'BDT',price:currentPrice(product),availability:product.stock>0?'https://schema.org/InStock':'https://schema.org/OutOfStock',url:canonical.href}})
    let schema=document.getElementById('shilpon-seo-schema');if(!schema){schema=document.createElement('script');schema.id='shilpon-seo-schema';schema.type='application/ld+json';document.head.appendChild(schema)}schema.textContent=JSON.stringify({'@context':'https://schema.org','@graph':graph})
  },[activeProduct,assets.logo,categories,category,hash,selected,settings.phone])
  return <><Header onSearch={setSearchTerm} onOpenCart={()=>setCartOpen(true)} onCategory={id=>{setCategory(id);page('shop')}}/>{import.meta.env.DEV && hash==='manage' ? <StoreAdmin onExit={()=>page('home')}/> : checkout ? success ? <main className="success-page wrap"><div className="success-icon"><Check size={34}/></div><span className="eyebrow">THANK YOU FOR CHOOSING SHILPON</span><h1>Your order is <em>noted.</em></h1><p>Demo reference <b>{success.id}</b> · total {money(success.total)}.</p><div className="demo-banner"><ShieldCheck size={20}/><span>This front-end demo has not saved your order to a business system. Connect the secure order backend before accepting real orders.</span></div><a className="button button-dark" href="#shop" onClick={()=>{setCheckout(false);setSuccess(null);page('home')}}>Back to the shop <ArrowRight size={17}/></a></main> : <CheckoutForm onBack={()=>{setCheckout(false);setCartOpen(true)}} onSuccess={setSuccess}/> : activeProduct && (hash==='product'||selected) ? <ProductDetail product={activeProduct} products={products} onClose={closeProduct} onBuy={buyNow} onAdd={(p,q,v)=>{store.addToCart(p,q,v);setSelected(null);setCartOpen(true)}} variant={variant} setVariant={setVariant} quantity={quantity} setQuantity={setQuantity} onWhatsapp={whatsappOne} onSelect={showProduct}/> : isHome ? home : hash==='shop'||hash==='category' ? shop : hash==='contact' ? <InfoPage type="about"/> : <InfoPage type={['about','faq','returns','privacy','terms','shipping'].includes(hash) ? hash : 'about'}/>}<Footer/><WhatsAppButton/>{import.meta.env.DEV && hash!=='manage'&&<a href="#manage" className="edge-admin-tab" aria-label="Open admin panel">Admin</a>}<CartDrawer open={cartOpen} onClose={()=>setCartOpen(false)} onCheckout={startCheckout}/></>
}

function ProductDetail({ product, products, onClose, onBuy, onAdd, variant, setVariant, quantity, setQuantity, onWhatsapp, onSelect }) {
  const [imageIndex, setImageIndex] = useState(0)
  const discount = product.salePrice ? Math.round((1-product.salePrice/product.price)*100) : 0
  return <main className="product-detail wrap"><button className="back-link" onClick={onClose}><ChevronLeft size={16}/> Back to the shop</button><div className="detail-layout"><div className="detail-gallery"><div className="detail-main-image"><img src={product.images[imageIndex]} alt={product.bn || product.name}/>{discount>0&&<span className="discount-badge">{discount}% off</span>}</div>{product.images.length>1&&<div className="detail-thumbs">{product.images.map((image,i)=><button className={i===imageIndex?'selected':''} key={image} onClick={()=>setImageIndex(i)}><img src={image} alt={`${product.name} view ${i+1}`}/></button>)}</div>}{product.videos?.map((video,index)=><video className="product-detail-video" key={index} src={video} controls preload="metadata" aria-label={`${product.name} video ${index+1}`}/>)}</div><div className="detail-copy"><span className="eyebrow">{product.category.toUpperCase()} · REF {product.id}</span><h1>{product.bn} <small>{product.name}</small></h1><div className="detail-rating"><span>★★★★★</span> {product.rating} <small>({product.reviews} kind words)</small></div><div className="detail-price"><strong>{money(currentPrice(product))}</strong>{product.salePrice&&<><del>{money(product.price)}</del><span className="sale-note">You save {money(product.price-product.salePrice)}</span></>}</div><p className="detail-description">{product.description}</p>{product.colors?.length>0&&<div className="variant-row"><b>Colour</b><div>{product.colors.map(c=><button className={`variant-chip ${variant.color===c?'selected':''}`} key={c} onClick={()=>setVariant({...variant,color:c})}>{c}</button>)}</div></div>}{product.sizes?.length>0&&<div className="variant-row"><b>Size</b><div>{product.sizes.map(s=><button className={`variant-chip ${variant.size===s?'selected':''}`} key={s} onClick={()=>setVariant({...variant,size:s})}>{s}</button>)}</div></div>}<div className="stock-detail">{product.stock>0?<><span className="stock-dot"/> In stock · {product.stock} ready to go</>:<span className="sold-label">A little pause — currently out of stock.</span>}</div>{product.stock>0&&<><div className="detail-actions"><div className="quantity-control"><button onClick={()=>setQuantity(Math.max(1,quantity-1))} aria-label="Decrease"><Minus size={14}/></button><span>{quantity}</span><button onClick={()=>setQuantity(Math.min(product.stock,quantity+1))} aria-label="Increase"><Plus size={14}/></button></div><button className="button button-dark" onClick={()=>onBuy(product,quantity,variant)}>Buy now · {money(currentPrice(product)*quantity)}</button></div><button className="button button-outline detail-add" onClick={()=>onAdd(product,quantity,variant)}><ShoppingBag size={17}/> Add to bag</button><button className="button button-whatsapp-wide" onClick={onWhatsapp}><MessageCircle size={17}/> Ask / order on WhatsApp</button></>}<div className="detail-points"><span><Truck size={16}/> Nationwide delivery</span><span><ShieldCheck size={16}/> Cash on Delivery</span><span><Leaf size={16}/> Made with care in Bangladesh</span></div><details className="specifications" open><summary>Details & specifications</summary><p>{product.bnDescription}</p>{Object.entries(product.specifications || {}).map(([k,v])=><div className="spec-row" key={k}><span>{k}</span><b>{v}</b></div>)}</details></div></div><section className="related-section"><div className="section-heading"><div><span className="eyebrow">YOU MAY ALSO LIKE</span><h2>A few more <em>good things.</em></h2></div></div><div className="product-grid">{products.filter(p=>p.id!==product.id).slice(0,4).map(p=><ProductCard key={p.id} product={p} onSelect={onSelect}/>)}</div></section></main>
}

export default function App() { return <StoreProvider><AppContent/></StoreProvider> }
