import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { products as sampleProducts } from '../src/data/products.js'
import { categories } from '../src/data/categories.js'
import { categoryPath, productPath, productSlug } from '../src/utils/productSeo.js'

const [owner, repository] = (process.env.GITHUB_REPOSITORY || 'xbox89950-ux/Shilpon-Live').split('/')
const siteUrl = new URL(process.env.SITE_URL || `https://${owner}.github.io/${repository === `${owner}.github.io` ? '' : `${repository}/`}`)
const basePath = repository === `${owner}.github.io` ? '/' : `/${repository}/`
const dist = join(process.cwd(), 'dist')
const template = await readFile(join(dist, 'index.html'), 'utf8')
const esc = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
const absolute = path => new URL(path, siteUrl).href
const currentPrice = product => Number(product.salePrice || product.price)
const categoryName = id => categories.find(category => category.id === id)?.name || String(id || 'Clothing')

async function getProductsForSeo() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL?.replace(/\/+$/, '')
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY
  if (!supabaseUrl || !anonKey) {
    console.log(`SEO product source: sample catalog (${sampleProducts.length} products; Supabase build variables are not set).`)
    return sampleProducts.map(product => ({ ...product, _updatedAt: null }))
  }

  const liveProducts = []
  const pageSize = 1000
  for (let offset = 0; ; offset += pageSize) {
    const endpoint = new URL(`${supabaseUrl}/rest/v1/store_catalog`)
    endpoint.search = new URLSearchParams({
      select: 'record_id,data,updated_at',
      kind: 'eq.product',
      order: 'sort_order.asc,record_id.asc',
      offset: String(offset),
      limit: String(pageSize),
    }).toString()
    const response = await fetch(endpoint, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        Accept: 'application/json',
      },
    })
    if (!response.ok) {
      throw new Error(`Could not read the live Supabase product catalog for SEO (HTTP ${response.status}). Check the public catalog read policy and GitHub Pages build variables.`)
    }
    const rows = await response.json()
    if (!Array.isArray(rows)) throw new Error('Supabase returned an invalid product catalog response for SEO generation.')
    liveProducts.push(...rows.map(row => ({ ...row.data, id: row.record_id, _updatedAt: row.updated_at })))
    if (rows.length < pageSize) break
  }

  const readyProducts = liveProducts.filter(product => product?.id && product?.name && Number.isFinite(currentPrice(product)))
  if (liveProducts.length && readyProducts.length !== liveProducts.length) {
    throw new Error('Some live products are missing a product ID, name, or valid price. Correct those products before deployment so the sitemap stays accurate.')
  }
  if (!readyProducts.length) {
    console.log(`SEO product source: sample catalog (${sampleProducts.length} products; the live catalog is empty).`)
    return sampleProducts.map(product => ({ ...product, _updatedAt: null }))
  }
  console.log(`SEO product source: live Supabase catalog (${readyProducts.length} products).`)
  return readyProducts
}

function imageUrls(product) {
  return (Array.isArray(product.images) ? product.images : [product.images])
    .filter(image => typeof image === 'string' && image.trim())
    .map(image => {
      try {
        const url = new URL(image, siteUrl)
        return ['https:', 'http:'].includes(url.protocol) ? url.href : null
      } catch {
        return null
      }
    })
    .filter(Boolean)
}

function productDescription(product, price) {
  const text = String(product.description || product.bnDescription || product.bn || product.name).replace(/\s+/g, ' ').trim()
  const full = `${text} Price ৳${price} BDT. ${product.stock > 0 ? 'Available to order' : 'Currently out of stock'}. Delivery across Bangladesh from Shilpon, Dinajpur.`
  if (full.length <= 160) return full
  return `${full.slice(0, 157).replace(/\s+\S*$/, '')}...`
}

const products = await getProductsForSeo()
const sitemapUrls = [{ url: absolute(basePath), lastmod: null }]
const usedSlugs = new Set()

// The first available item marked "Show in popular products" is the homepage preview photo.
// The storefront logo remains the structured business logo; this is only the preferred page image.
const homepageProduct = products.find(product => product.featured && Number(product.stock) > 0 && imageUrls(product).length)
if (homepageProduct) {
  const homepageImage = imageUrls(homepageProduct)[0]
  const homepageHtmlPath = join(dist, 'index.html')
  let homepageHtml = await readFile(homepageHtmlPath, 'utf8')
  homepageHtml = homepageHtml.replace(/<meta property="og:image" content="[^"]*"\s*\/>/, `<meta property="og:image" content="${esc(homepageImage)}" />`)
  homepageHtml = homepageHtml.replace(/<meta name="twitter:image" content="[^"]*"\s*\/>/, `<meta name="twitter:image" content="${esc(homepageImage)}" />`)
  const altTag = `<meta property="og:image:alt" content="${esc(homepageProduct.bn || homepageProduct.name)} · Shilpon" />`
  homepageHtml = homepageHtml.replace('</head>', `${altTag}\n  </head>`)
  const storeSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'ClothingStore', name: 'Shilpon', url: absolute(basePath), logo: absolute(`${basePath}images/shilpon-logo.png`), image: homepageImage, telephone: '+880 1717-802606', address: { '@type': 'PostalAddress', addressLocality: 'Dinajpur', addressRegion: 'Rangpur', addressCountry: 'BD' }, areaServed: 'Bangladesh' },
      { '@type': 'WebPage', name: 'Shilpon | Clothing for Men, Women & Kids in Bangladesh', url: absolute(basePath), primaryImageOfPage: homepageImage },
    ],
  }
  const homeSchemaTag = `<script id="shilpon-seo-schema" type="application/ld+json">${JSON.stringify(storeSchema).replaceAll('<', '\\u003c')}</script>`
  const schemaPattern = /<script id="shilpon-seo-schema" type="application\/ld\+json">.*?<\/script>/
  homepageHtml = schemaPattern.test(homepageHtml) ? homepageHtml.replace(schemaPattern, homeSchemaTag) : homepageHtml.replace('</head>', `${homeSchemaTag}\n  </head>`)
  await writeFile(homepageHtmlPath, homepageHtml)
  console.log(`Homepage preview image: ${homepageProduct.name} (${homepageProduct.id}).`)
}

for (const product of products) {
  const slug = productSlug(product)
  if (usedSlugs.has(slug)) throw new Error(`Duplicate product URL slug generated for product ID ${product.id}. Give each product a unique ID.`)
  usedSlugs.add(slug)

  const path = productPath(product, basePath)
  const canonical = absolute(path)
  const price = currentPrice(product)
  const description = productDescription(product, price)
  const images = imageUrls(product)
  const mainImage = images[0] || absolute(`${basePath}images/shilpon-logo.png`)
  const category = categoryName(product.category)
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ClothingStore',
        name: 'Shilpon',
        url: absolute(basePath),
        logo: absolute(`${basePath}images/shilpon-logo.png`),
        telephone: '+880 1717-802606',
        address: { '@type': 'PostalAddress', addressLocality: 'Dinajpur', addressRegion: 'Rangpur', addressCountry: 'BD' },
        areaServed: 'Bangladesh',
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: absolute(basePath) },
          { '@type': 'ListItem', position: 2, name: category, item: `${absolute(basePath)}#category-${product.category}` },
          { '@type': 'ListItem', position: 3, name: product.name, item: canonical },
        ],
      },
      {
        '@type': 'Product',
        name: product.name,
        description,
        sku: String(product.id),
        category,
        image: images.length ? images : [mainImage],
        brand: { '@type': 'Brand', name: 'Shilpon' },
        offers: {
          '@type': 'Offer',
          url: canonical,
          priceCurrency: 'BDT',
          price,
          availability: Number(product.stock) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          itemCondition: 'https://schema.org/NewCondition',
        },
      },
    ],
  }

  let html = template
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(product.name)} | Shilpon Bangladesh</title>`)
  html = html.replace(/<meta name="description" content="[^"]*"\s*\/>/, `<meta name="description" content="${esc(description)}" />`)
  html = html.replace(/<meta property="og:title" content="[^"]*"\s*\/>/, `<meta property="og:title" content="${esc(product.name)} | Shilpon" />`)
  html = html.replace(/<meta property="og:description" content="[^"]*"\s*\/>/, `<meta property="og:description" content="${esc(description)}" />`)
  html = html.replace(/<meta property="og:type" content="[^"]*"\s*\/>/, '<meta property="og:type" content="product" />')
  html = html.replace(/<meta property="og:image" content="[^"]*"\s*\/>/, `<meta property="og:image" content="${esc(mainImage)}" />`)
  html = html.replace(/<meta name="twitter:image" content="[^"]*"\s*\/>/, `<meta name="twitter:image" content="${esc(mainImage)}" />`)
  html = html.replace(/<meta name="twitter:title" content="[^"]*"\s*\/>/, `<meta name="twitter:title" content="${esc(product.name)} | Shilpon" />`)
  html = html.replace(/<meta name="twitter:description" content="[^"]*"\s*\/>/, `<meta name="twitter:description" content="${esc(description)}" />`)
  html = html.replace(/<meta property="og:url" content="[^"]*"\s*\/>/, `<meta property="og:url" content="${canonical}" />`)
  html = html.replace(/<link rel="canonical" href="[^"]*"\s*\/>/, `<link rel="canonical" href="${canonical}" />`)
  const schemaTag = `<script id="shilpon-seo-schema" type="application/ld+json">${JSON.stringify(schema).replaceAll('<', '\\u003c')}</script>`
  const schemaPattern = /<script id="shilpon-seo-schema" type="application\/ld\+json">.*?<\/script>/
  html = schemaPattern.test(html) ? html.replace(schemaPattern, schemaTag) : html.replace('</head>', `${schemaTag}\n  </head>`)
  // Product routes are one directory beneath the site root on GitHub Pages.
  html = html.replaceAll('href="./', `href="${basePath}`).replaceAll('src="./', `src="${basePath}`)
  const availability = Number(product.stock) > 0 ? 'In stock' : 'Out of stock'
  const noScript = `<noscript><main><h1>${esc(product.name)}</h1><img src="${esc(mainImage)}" alt="${esc(product.bn || product.name)}" /><p>${esc(description)}</p><p>Price: ৳${price} BDT · ${availability}</p><a href="${absolute(basePath)}">Visit Shilpon</a></main></noscript>`
  html = html.replace('</body>', `${noScript}\n</body>`)

  const pageDir = join(dist, 'products', slug)
  await mkdir(pageDir, { recursive: true })
  await writeFile(join(pageDir, 'index.html'), html)
  sitemapUrls.push({ url: canonical, lastmod: product._updatedAt })
}

// Only publish category landing pages for categories with promoted products that are in stock.
// These pages expose truthful collection metadata and links based on the current catalog.
const promotedProducts = products.filter(product => product.featured && Number(product.stock) > 0)
for (const category of categories) {
  const items = promotedProducts.filter(product => product.category === category.id)
  if (!items.length) continue

  const path = categoryPath(category.id, basePath)
  const canonical = absolute(path)
  const title = `Popular ${category.name} Clothes | Shilpon Bangladesh`
  const description = `Browse ${items.length} featured ${category.name.toLowerCase()} clothing ${items.length === 1 ? 'item' : 'items'} at Shilpon. See current product details, prices and availability. Delivery across Bangladesh from Dinajpur.`
  const heroImage = imageUrls(items[0])[0] || absolute(`${basePath}images/shilpon-logo.png`)
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'ClothingStore', name: 'Shilpon', url: absolute(basePath), logo: absolute(`${basePath}images/shilpon-logo.png`), telephone: '+880 1717-802606', address: { '@type': 'PostalAddress', addressLocality: 'Dinajpur', addressRegion: 'Rangpur', addressCountry: 'BD' }, areaServed: 'Bangladesh' },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: absolute(basePath) },
        { '@type': 'ListItem', position: 2, name: `${category.name} clothing`, item: canonical },
      ] },
      { '@type': 'CollectionPage', name: title, description, url: canonical, mainEntity: { '@type': 'ItemList', itemListElement: items.map((product, index) => ({ '@type': 'ListItem', position: index + 1, url: absolute(productPath(product, basePath)), name: product.name })) } },
    ],
  }
  const cards = items.map(product => {
    const productUrl = absolute(productPath(product, basePath))
    const image = imageUrls(product)[0] || heroImage
    const price = currentPrice(product)
    return `<li><a href="${esc(productUrl)}"><img src="${esc(image)}" alt="${esc(product.bn || product.name)}" loading="lazy"><h2>${esc(product.name)}</h2></a><p>${esc(String(product.description || product.bnDescription || '').replace(/\s+/g, ' ').trim())}</p><p>Price: ৳${price} BDT · In stock</p><a href="${esc(productUrl)}">View product details</a></li>`
  }).join('\n')
  let html = template
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
  html = html.replace(/<meta name="description" content="[^"]*"\s*\/>/, `<meta name="description" content="${esc(description)}" />`)
  html = html.replace(/<meta property="og:title" content="[^"]*"\s*\/>/, `<meta property="og:title" content="${esc(title)}" />`)
  html = html.replace(/<meta property="og:description" content="[^"]*"\s*\/>/, `<meta property="og:description" content="${esc(description)}" />`)
  html = html.replace(/<meta property="og:image" content="[^"]*"\s*\/>/, `<meta property="og:image" content="${esc(heroImage)}" />`)
  html = html.replace(/<meta name="twitter:image" content="[^"]*"\s*\/>/, `<meta name="twitter:image" content="${esc(heroImage)}" />`)
  html = html.replace(/<meta name="twitter:title" content="[^"]*"\s*\/>/, `<meta name="twitter:title" content="${esc(title)}" />`)
  html = html.replace(/<meta name="twitter:description" content="[^"]*"\s*\/>/, `<meta name="twitter:description" content="${esc(description)}" />`)
  html = html.replace(/<meta property="og:url" content="[^"]*"\s*\/>/, `<meta property="og:url" content="${canonical}" />`)
  html = html.replace(/<link rel="canonical" href="[^"]*"\s*\/>/, `<link rel="canonical" href="${canonical}" />`)
  const schemaTag = `<script id="shilpon-seo-schema" type="application/ld+json">${JSON.stringify(schema).replaceAll('<', '\\u003c')}</script>`
  const schemaPattern = /<script id="shilpon-seo-schema" type="application\/ld\+json">.*?<\/script>/
  html = schemaPattern.test(html) ? html.replace(schemaPattern, schemaTag) : html.replace('</head>', `${schemaTag}\n  </head>`)
  html = html.replaceAll('href="./', `href="${basePath}`).replaceAll('src="./', `src="${basePath}`)
  const noScript = `<noscript><main><h1>${esc(title)}</h1><p>${esc(description)}</p><ul>${cards}</ul><a href="${absolute(basePath)}">Visit Shilpon</a></main></noscript>`
  html = html.replace('</body>', `${noScript}\n</body>`)

  const pageDir = join(dist, 'categories', category.id)
  await mkdir(pageDir, { recursive: true })
  await writeFile(join(pageDir, 'index.html'), html)
  sitemapUrls.push({ url: canonical, lastmod: items.map(item => item._updatedAt).filter(Boolean).sort().at(-1) || null })
}

const xml = sitemapUrls.map(({ url, lastmod }) => `  <url><loc>${url.replaceAll('&', '&amp;')}</loc>${lastmod && Number.isFinite(Date.parse(lastmod)) ? `<lastmod>${new Date(lastmod).toISOString()}</lastmod>` : ''}</url>`).join('\n')
await writeFile(join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${xml}\n</urlset>\n`)
await writeFile(join(dist, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${absolute(`${basePath}sitemap.xml`)}\n`)

