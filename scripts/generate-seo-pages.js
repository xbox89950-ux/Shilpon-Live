import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { products } from '../src/data/products.js'
import { productPath, productSlug } from '../src/utils/productSeo.js'

const [owner, repository] = (process.env.GITHUB_REPOSITORY || 'xbox89950-ux/Shilpon-Live').split('/')
const siteUrl = new URL(process.env.SITE_URL || `https://${owner}.github.io/${repository === `${owner}.github.io` ? '' : `${repository}/`}`)
const basePath = repository === `${owner}.github.io` ? '/' : `/${repository}/`
const dist = join(process.cwd(), 'dist')
const template = await readFile(join(dist, 'index.html'), 'utf8')
const esc = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
const absolute = path => new URL(path, siteUrl).href
const currentPrice = product => product.salePrice || product.price

function replaceTag(html, pattern, replacement) {
  return html.replace(pattern, replacement)
}

const sitemapUrls = [absolute(basePath)]
for (const product of products) {
  const path = productPath(product, basePath)
  const canonical = absolute(path)
  const description = `${product.description} Available from Shilpon, Dinajpur, Bangladesh. Delivery across Bangladesh.`
  const image = product.images?.[0]
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
        '@type': 'Product',
        name: product.name,
        description,
        sku: product.id,
        category: product.category,
        image: product.images || [],
        brand: { '@type': 'Brand', name: 'Shilpon' },
        offers: {
          '@type': 'Offer',
          url: canonical,
          priceCurrency: 'BDT',
          price: currentPrice(product),
          availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          itemCondition: 'https://schema.org/NewCondition',
        },
      },
    ],
  }
  let html = template
  html = replaceTag(html, /<title>[^<]*<\/title>/, `<title>${esc(product.name)} | Shilpon Bangladesh</title>`)
  html = replaceTag(html, /<meta name="description" content="[^"]*"\s*\/>/, `<meta name="description" content="${esc(description)}" />`)
  html = replaceTag(html, /<meta property="og:title" content="[^"]*"\s*\/>/, `<meta property="og:title" content="${esc(product.name)} | Shilpon" />`)
  html = replaceTag(html, /<meta property="og:description" content="[^"]*"\s*\/>/, `<meta property="og:description" content="${esc(description)}" />`)
  html = replaceTag(html, /<meta property="og:type" content="[^"]*"\s*\/>/, '<meta property="og:type" content="product" />')
  html = replaceTag(html, /<meta property="og:image" content="[^"]*"\s*\/>/, `<meta property="og:image" content="${esc(image || absolute(`${basePath}images/shilpon-logo.png`))}" />`)
  html = replaceTag(html, /<meta name="twitter:image" content="[^"]*"\s*\/>/, `<meta name="twitter:image" content="${esc(image || absolute(`${basePath}images/shilpon-logo.png`))}" />`)
  html = replaceTag(html, /<meta name="twitter:title" content="[^"]*"\s*\/>/, `<meta name="twitter:title" content="${esc(product.name)} | Shilpon" />`)
  html = replaceTag(html, /<meta name="twitter:description" content="[^"]*"\s*\/>/, `<meta name="twitter:description" content="${esc(description)}" />`)
  html = html.replace(/<meta property="og:url" content="[^"]*"\s*\/>/, '')
  html = html.replace(/<link rel="canonical" href="[^"]*"\s*\/>/, '')
  const schemaTag = `<script id="shilpon-seo-schema" type="application/ld+json">${JSON.stringify(schema).replaceAll('<', '\\u003c')}</script>`
  const schemaPattern = /<script id="shilpon-seo-schema" type="application\/ld\+json">.*?<\/script>/
  html = schemaPattern.test(html) ? html.replace(schemaPattern, schemaTag) : html.replace('</head>', `${schemaTag}\n  </head>`)
  html = html.replace('</head>', `<link rel="canonical" href="${canonical}" />\n    <meta property="og:url" content="${canonical}" />\n  </head>`)
  // Vite's local build uses relative asset links; product pages sit one level deeper.
  html = html.replaceAll('href="./', `href="${basePath}`).replaceAll('src="./', `src="${basePath}`)
  const noScript = `<noscript><main><h1>${esc(product.name)}</h1><img src="${esc(image || '')}" alt="${esc(product.bn || product.name)}" /><p>${esc(description)}</p><p>Price: ৳${currentPrice(product)} BDT</p><a href="${absolute(basePath)}">Visit Shilpon</a></main></noscript>`
  html = html.replace('</body>', `${noScript}\n</body>`)
  const pageDir = join(dist, 'products', productSlug(product))
  await mkdir(pageDir, { recursive: true })
  await writeFile(join(pageDir, 'index.html'), html)
  sitemapUrls.push(canonical)
}

const xml = sitemapUrls.map(url => `  <url><loc>${url.replaceAll('&', '&amp;')}</loc></url>`).join('\n')
await writeFile(join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${xml}\n</urlset>\n`)
await writeFile(join(dist, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${absolute(`${basePath}sitemap.xml`)}\n`)
