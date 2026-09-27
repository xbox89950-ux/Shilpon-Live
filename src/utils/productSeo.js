// Shared product URL rules used by the storefront and the prerendering script.
export function productSlug(product) {
  const name = (product.name || 'item')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `${name || 'item'}-${String(product.id || '').toLowerCase()}`
}

export function productPath(product, base = '/') {
  return `${base}products/${productSlug(product)}/`
}

export function productFromLocation(products, location = window.location) {
  const id = new URLSearchParams(location.search).get('product')
  if (id) return products.find(product => product.id === id) || null

  const match = location.pathname.match(/\/products\/([^/]+)\/?$/)
  if (!match) return null
  return products.find(product => productSlug(product) === decodeURIComponent(match[1])) || null
}
