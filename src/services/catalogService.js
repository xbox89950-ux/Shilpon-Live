import { supabase, supabaseReady } from '../lib/supabaseClient'

const requireBackend = () => {
  if (!supabaseReady) throw new Error('The live store is not connected yet. Add the Supabase site settings and redeploy.')
}

// Each record stores its editable content in JSONB, keeping the storefront model flexible.
export async function readCatalog() {
  if (!supabaseReady) return null
  const [products, categories, settings, assets] = await Promise.all([
    supabase.from('store_catalog').select('data').eq('kind', 'product').order('sort_order'),
    supabase.from('store_catalog').select('data').eq('kind', 'category').order('sort_order'),
    supabase.from('store_catalog').select('data').eq('kind', 'settings').maybeSingle(),
    supabase.from('store_catalog').select('data').eq('kind', 'assets').maybeSingle(),
  ])
  for (const result of [products, categories, settings, assets]) if (result.error) throw result.error
  return {
    products: products.data.length ? products.data.map(row => row.data) : null,
    categories: categories.data.length ? categories.data.map(row => row.data) : null,
    settings: settings.data?.data || null,
    assets: assets.data?.data || null,
  }
}

export async function saveCollection(kind, values) {
  requireBackend()
  const rows = values.map((data, sort_order) => ({ kind, record_id: String(data.id), sort_order, data }))
  if (rows.length) {
    const { error } = await supabase.from('store_catalog').upsert(rows, { onConflict: 'kind,record_id' })
    if (error) throw error
  }
  const keepIds = rows.map(row => row.record_id)
  let query = supabase.from('store_catalog').delete().eq('kind', kind)
  if (keepIds.length) query = query.not('record_id', 'in', `(${keepIds.map(id => `"${id.replaceAll('"', '\\"')}"`).join(',')})`)
  const { error: deleteError } = await query
  if (deleteError) throw deleteError
}

export async function saveSingleton(kind, data) {
  requireBackend()
  const { error } = await supabase.from('store_catalog').upsert({ kind, record_id: kind, sort_order: 0, data }, { onConflict: 'kind,record_id' })
  if (error) throw error
}

export async function uploadStoreMedia(file, folder = 'products') {
  requireBackend()
  const safeName = file.name.normalize('NFKD').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'upload'
  const path = `${folder}/${crypto.randomUUID()}-${safeName}`
  const { error } = await supabase.storage.from('store-assets').upload(path, file, { upsert: false, contentType: file.type })
  if (error) throw error
  return supabase.storage.from('store-assets').getPublicUrl(path).data.publicUrl
}


