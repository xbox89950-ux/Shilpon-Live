import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ImagePlus, LockKeyhole, LogOut, PackagePlus, RotateCcw, Save, Trash2, Upload } from 'lucide-react'
import { useStore } from '../context/StoreContext'
import { imageFileToDataUrl, optimizeImageDataUrl } from '../utils/imageUpload'
import { siteConfig } from '../config/siteConfig'
import { adminPin } from '../config/adminConfig'
import { supabase, supabaseReady } from '../lib/supabaseClient'
import { uploadStoreMedia } from '../services/catalogService'

const blankProduct = () => ({ id: `SH-${Date.now().toString().slice(-5)}`, name: '', bn: '', category: 'women', images: [], videos: [], price: '', salePrice: '', description: '', bnDescription: '', specifications: { Material: '', Fit: '', Care: '' }, sizes: [], colors: [], stock: 1, rating: 5, reviews: 0, featured: false, isNew: true })
const commas = value => value.split(',').map(x => x.trim()).filter(Boolean)

function StoreAdminPanel({ onExit, onLock }) {
  const { products, saveProducts, categories, saveCategories, assets, saveAsset, settings, saveSettings, resetShop } = useStore()
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(blankProduct)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [storeSettings, setStoreSettings] = useState(settings)
  const useSharedAdmin = supabaseReady
  const editing = Boolean(editingId)
  const totalStock = useMemo(() => products.reduce((sum,p)=>sum+Number(p.stock||0),0),[products])
  const update = (key, value) => setForm(current => ({ ...current, [key]: value }))
  const editProduct = product => { setEditingId(product.id); setForm({ ...product, images: [...product.images], sizes: [...(product.sizes||[])], colors: [...(product.colors||[])] }); setNotice(''); setError(''); document.getElementById('manage-product-form')?.scrollIntoView({ behavior: 'smooth' }) }
  const newProduct = () => { setEditingId(null); setForm(blankProduct()); setNotice(''); setError(''); document.getElementById('manage-product-form')?.scrollIntoView({ behavior: 'smooth' }) }
  const uploadImages = async files => { setBusy(true); setError(''); try { const nextImages=[]; const nextVideos=[]; for(const file of [...files]) { if(useSharedAdmin) { const url=await uploadStoreMedia(file, 'products'); if(file.type.startsWith('video/')) nextVideos.push(url); else nextImages.push(url) } else if(file.type.startsWith('video/')) { if(file.size>700*1024) throw new Error('For this browser-only editor, choose a short video smaller than 700 KB.'); nextVideos.push(await readAsDataUrl(file)) } else nextImages.push(await imageFileToDataUrl(file)) } update('images',[...form.images,...nextImages]); update('videos',[...(form.videos||[]),...nextVideos]) } catch(e) { setError(e.message || 'Could not upload the file. Check your connection and try again.') } finally { setBusy(false) } }
  const submit = async event => {
    event.preventDefault(); setError(''); setNotice('')
    if(!form.name.trim() || !form.price || !form.images.length){setError('Add a product name, price and at least one product photo.');return}
    setBusy(true)
    try {
      const compactImages = useSharedAdmin ? form.images : await Promise.all(form.images.map(image => optimizeImageDataUrl(image)))
      const compactProducts = useSharedAdmin ? products : await Promise.all(products.map(async item => ({...item, images: await Promise.all((item.images||[]).map(image => optimizeImageDataUrl(image)))})))
      const product={...form,images:compactImages,price:Number(form.price),salePrice:form.salePrice?Number(form.salePrice):null,stock:Number(form.stock)||0,sizes:Array.isArray(form.sizes)?form.sizes:commas(form.sizes),colors:Array.isArray(form.colors)?form.colors:commas(form.colors),featured:Boolean(form.featured),isNew:Boolean(form.isNew)}
      const next=editing?compactProducts.map(item=>item.id===editingId?product:item):[product,...compactProducts]
      await saveProducts(next); setEditingId(product.id); setForm(product); setNotice(useSharedAdmin ? 'Product saved to the shared online store.' : 'Saved in this browser. Optimized photos are stored in IndexedDB (up to 1 GB).')
    } catch(e) { setError(e.message || 'Could not save this product. Try smaller photos.') }
    finally { setBusy(false) }
  }
  const remove = async product => { if(!window.confirm(`Remove “${product.name}” from this browser's shop?`))return; try{await saveProducts(products.filter(p=>p.id!==product.id));if(editingId===product.id)newProduct();setNotice('Product removed from this browser.')}catch(e){setError(e.message||'Could not update browser storage.')} }
  const saveImage = async (key,file,maxSide) => { if(!file)return;setBusy(true);setError('');try{const image=useSharedAdmin?await uploadStoreMedia(file,key):await imageFileToDataUrl(file,maxSide);await saveAsset(key,image);setNotice(useSharedAdmin?'Image uploaded to the shared online store.':'Image saved in this browser.')}catch(e){setError(e.message||'Could not save this image.')}finally{setBusy(false)} }
  const saveCategoryImage = async (id,file) => { if(!file)return;setBusy(true);setError('');try{const image=useSharedAdmin?await uploadStoreMedia(file,'categories'):await imageFileToDataUrl(file);await saveCategories(categories.map(c=>c.id===id?{...c,image}:c));setNotice(useSharedAdmin?'Category photo uploaded online.':'Category photo saved in this browser.')}catch(e){setError(e.message||'Could not save this image.')}finally{setBusy(false)} }
  const reset = async () => { if(!window.confirm('Restore the original sample products, categories, logo and banner on this browser?'))return;try{await resetShop();setStoreSettings({whatsappNumber:siteConfig.whatsappNumber,phone:siteConfig.phone,email:siteConfig.email,address:siteConfig.address});setForm(blankProduct());setEditingId(null);setNotice('Original sample content restored.')}catch(e){setError(e.message||'Could not reset this browser.')} }
  const saveContactSettings = async event => {event.preventDefault();try{if(!/^\d{10,15}$/.test(storeSettings.whatsappNumber.replace(/\D/g,'')))throw new Error('Enter WhatsApp with country code, e.g. 8801727227189.');await saveSettings(storeSettings);setNotice('Contact details saved in this browser.')}catch(e){setError(e.message||'Could not save contact details.')}}
  const imageSrc = value => value?.startsWith('data:') ? value : value || ''
  return <main className="manage-page wrap"><header className="manage-header"><div><span className="eyebrow">SHILPON · STORE MANAGER</span><h1>Edit your <em>shop.</em></h1><p>Manage products, prices, sizes, logo and photos from one place.</p></div><div className="manage-head-actions"><button className="button button-outline" onClick={onLock}><LogOut size={15}/> Lock panel</button><button className="button button-outline manage-back" onClick={onExit}><ArrowLeft size={16}/> Back to website</button></div></header><div className="manage-local-note"><b>Photo storage: up to 1 GB in this browser.</b> Photos are stored in IndexedDB. The device/browser may enforce a lower quota; files do not sync to your live website or other devices without a backend.</div>{notice&&<div className="manage-notice" role="status">{notice}</div>}{error&&<div className="manage-error" role="alert">{error}</div>}<section className="manage-section"><div className="manage-section-title"><div><span className="eyebrow">YOUR BRAND</span><h2>Logo & banner</h2></div></div><div className="manage-assets-grid"><AssetUploader title="Shop logo" path={assets.logo||siteConfig.logoPath} onPick={file=>saveImage('logo',file,700)} busy={busy}/><AssetUploader title="Home page banner" path={assets.banner||siteConfig.bannerPath} onPick={file=>saveImage('banner',file,1800)} busy={busy}/></div></section><section className="manage-section"><div className="manage-section-title"><div><span className="eyebrow">CONTACT DETAILS</span><h2>WhatsApp & contact number</h2></div></div><form className="manage-settings-form" onSubmit={saveContactSettings}><label>WhatsApp number with country code<input value={storeSettings.whatsappNumber} onChange={e=>setStoreSettings({...storeSettings,whatsappNumber:e.target.value})} placeholder="8801727227189"/></label><label>Contact phone<input value={storeSettings.phone} onChange={e=>setStoreSettings({...storeSettings,phone:e.target.value})}/></label><label>Contact email<input type="email" value={storeSettings.email} onChange={e=>setStoreSettings({...storeSettings,email:e.target.value})}/></label><label>Business address<input value={storeSettings.address} onChange={e=>setStoreSettings({...storeSettings,address:e.target.value})}/></label><button className="button button-dark"><Save size={15}/> Save contact details</button></form></section><section className="manage-section"><div className="manage-section-title"><div><span className="eyebrow">SHOP DEPARTMENTS</span><h2>Category photos</h2></div></div><div className="manage-category-grid">{categories.map(category=><label className="manage-category" key={category.id}><img src={imageSrc(category.image)} alt=""/><span><b>{category.name}</b><small>{category.bn}</small></span><input type="file" accept="image/*" aria-label={`Change ${category.name} category photo`} onChange={e=>saveCategoryImage(category.id,e.target.files?.[0])}/><Upload size={15}/></label>)}</div></section><section className="manage-section"><div className="manage-section-title"><div><span className="eyebrow">THE CATALOGUE</span><h2>Your products <small>{products.length} items · {totalStock} in stock</small></h2></div><button className="button button-dark" onClick={newProduct}><PackagePlus size={16}/> Add product</button></div><div className="manage-product-list">{products.map(product=><article className={`manage-product-row ${editingId===product.id?'current':''}`} key={product.id}><img src={product.images[0]} alt=""/><div className="manage-product-summary"><b>{product.name}</b><span>{product.category} · ৳{product.salePrice||product.price} · stock {product.stock}</span></div><button className="manage-edit-button" onClick={()=>editProduct(product)}>Edit</button><button className="manage-icon-button" onClick={()=>remove(product)} aria-label={`Remove ${product.name}`}><Trash2 size={16}/></button></article>)}</div></section><section className="manage-section manage-form-section" id="manage-product-form"><div className="manage-section-title"><div><span className="eyebrow">{editing?'UPDATE THIS ITEM':'ADD SOMETHING NEW'}</span><h2>{editing?form.name||'Edit product':'New product'}</h2></div></div><form className="manage-product-form" onSubmit={submit}><div className="manage-fields"><label>Product name (English)*<input value={form.name} onChange={e=>update('name',e.target.value)} placeholder="e.g. Everyday Cotton Shirt"/></label><label>বাংলা নাম<input value={form.bn||''} onChange={e=>update('bn',e.target.value)} placeholder="পণ্যের বাংলা নাম"/></label><label>Department*<select value={form.category} onChange={e=>update('category',e.target.value)}>{categories.map(c=><option value={c.id} key={c.id}>{c.name} · {c.bn}</option>)}</select></label><label>Product ID<input value={form.id} onChange={e=>update('id',e.target.value)}/></label><label>Regular price (৳)*<input inputMode="numeric" type="number" min="0" value={form.price} onChange={e=>update('price',e.target.value)} placeholder="1200"/></label><label>Sale price (৳)<input inputMode="numeric" type="number" min="0" value={form.salePrice||''} onChange={e=>update('salePrice',e.target.value)} placeholder="Leave empty for no sale"/></label><label>Sizes, comma separated<input value={(form.sizes||[]).join(', ')} onChange={e=>update('sizes',commas(e.target.value))} placeholder="S, M, L, XL"/></label><label>Colors, comma separated<input value={(form.colors||[]).join(', ')} onChange={e=>update('colors',commas(e.target.value))} placeholder="Black, Blue"/></label><label>Stock quantity<input type="number" min="0" value={form.stock} onChange={e=>update('stock',e.target.value)}/></label><label>Short description<textarea rows="3" value={form.description||''} onChange={e=>update('description',e.target.value)} placeholder="A short description customers will see"/></label></div><div className="manage-photo-field"><div><b>Product photos and short videos*</b><small>Photos are optimized before saving. Video files must be under 700 KB each.</small></div><label className="manage-upload-button"><ImagePlus size={17}/>{busy?'Preparing media…':'Choose photos / video'}<input type="file" accept="image/*,video/*" multiple disabled={busy} onChange={e=>{if(e.target.files?.length)uploadImages(e.target.files);e.target.value=''}}/></label></div><div className="manage-photo-grid">{form.images.map((image,index)=><div className="manage-photo" key={`${index}-${image.slice(0,20)}`}><img src={image} alt={`Product photo ${index+1}`}/><button type="button" onClick={()=>update('images',form.images.filter((_,i)=>i!==index))} aria-label="Remove product photo">×</button></div>)}{(form.videos||[]).map((video,index)=><div className="manage-photo" key={`video-${index}`}><video src={video} controls/><button type="button" onClick={()=>update('videos',form.videos.filter((_,i)=>i!==index))} aria-label="Remove product video">×</button></div>)}</div><div className="manage-checks"><label><input type="checkbox" checked={Boolean(form.featured)} onChange={e=>update('featured',e.target.checked)}/> Show in popular products</label><label><input type="checkbox" checked={Boolean(form.isNew)} onChange={e=>update('isNew',e.target.checked)}/> Mark as new arrival</label></div><div className="manage-form-actions"><button className="button button-dark" disabled={busy}><Save size={16}/>{editing?'Save changes':'Add product'}</button><button type="button" className="button button-outline" onClick={newProduct}>Clear form</button></div></form></section><div className="manage-danger-zone"><div><b>Restore sample content</b><small>Replaces edits saved in this browser with the original example products and images.</small></div><button className="button button-outline" onClick={reset}><RotateCcw size={15}/> Restore samples</button></div></main>
}

function AssetUploader({title,path,onPick,busy}) {
  return <label className="manage-asset"><span>{title}</span><img src={path} alt={`${title} preview`}/><span className="manage-upload-button"><Upload size={15}/>{busy?'Saving…':'Change image'}<input type="file" accept="image/*" disabled={busy} onChange={e=>{onPick(e.target.files?.[0]);e.target.value=''}}/></span></label>
}

export function StoreAdmin({ onExit }) {
  if (!supabaseReady) return <main className="admin-gate wrap"><section><span className="admin-gate-icon"><LockKeyhole/></span><span className="eyebrow">SHILPON · SECURE STORE MANAGER</span><h1>Online admin needs setup.</h1><p>The previous editor saved only in one browser. This live admin now requires a Supabase project so products and photos can be shared securely with every visitor.</p><p>Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> in the hosting build settings, run <code>supabase/schema.sql</code> in that project, then create the owner account there. Never reuse a password posted in chat.</p><button className="button button-dark" onClick={onExit}>Back to website</button></section></main>
  return <SecureStoreAdmin onExit={onExit}/>
  const [unlocked,setUnlocked]=useState(()=>sessionStorage.getItem('shilpon-admin-session')==='open')
  const [pin,setPin]=useState('')
  const [error,setError]=useState('')
  const unlock=event=>{event.preventDefault();if(pin===adminPin){sessionStorage.setItem('shilpon-admin-session','open');setUnlocked(true);setError('')}else{setPin('');setError('That PIN is not correct.')}}
  const lock=()=>{sessionStorage.removeItem('shilpon-admin-session');setUnlocked(false);setPin('')}
  if(!unlocked)return <main className="admin-gate wrap"><form onSubmit={unlock}><span className="admin-gate-icon"><LockKeyhole/></span><span className="eyebrow">SHILPON · STORE MANAGER</span><h1>Enter your PIN.</h1><p>This PIN is a convenience lock for the local editor, not secure website authentication.</p>{error&&<div role="alert" className="manage-error">{error}</div>}<label>Admin PIN<input autoFocus inputMode="numeric" type="password" maxLength="10" value={pin} onChange={e=>setPin(e.target.value)} placeholder="Enter PIN"/></label><button className="button button-dark">Unlock editor</button><button type="button" className="admin-back-link" onClick={onExit}>Back to website</button></form></main>
  return <StoreAdminPanel onExit={onExit} onLock={lock}/>
}

function SecureStoreAdmin({ onExit }) {
  const [session, setSession] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let live = true
    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!live) return
      if (sessionError) setError(sessionError.message)
      setSession(data?.session || null)
      setLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession))
    return () => { live = false; listener.subscription.unsubscribe() }
  }, [])
  const signIn = async event => {
    event.preventDefault(); setLoading(true); setError('')
    const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setPassword(''); setLoading(false)
    if (authError) setError(authError.message)
  }
  const signOut = async () => { await supabase.auth.signOut(); onExit() }
  if (loading) return <main className="admin-gate wrap"><p role="status">Checking secure admin session…</p></main>
  if (!session) return <main className="admin-gate wrap"><form onSubmit={signIn}><span className="admin-gate-icon"><LockKeyhole/></span><span className="eyebrow">SHILPON · SECURE STORE MANAGER</span><h1>Admin sign in.</h1><p>Use the owner email and password created in Supabase Auth. Access is limited by the server-side admin allowlist.</p>{error&&<div role="alert" className="manage-error">{error}</div>}<label>Admin email<input autoComplete="username" type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Password<input autoComplete="current-password" type="password" required value={password} onChange={e=>setPassword(e.target.value)}/></label><button className="button button-dark">Sign in</button><button type="button" className="admin-back-link" onClick={onExit}>Back to website</button></form></main>
  return <StoreAdminPanel onExit={onExit} onLock={signOut}/>
}

function readAsDataUrl(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('Could not read this video file.'));reader.readAsDataURL(file)})}

