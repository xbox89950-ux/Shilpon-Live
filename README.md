# Shilpon — editable storefront starter

Shilpon is a responsive React + Vite clothing storefront for men, women, boys and girls. Its optional Supabase connection provides shared products, categories, contact/brand settings, media storage and an owner-only admin sign-in. Orders, payment and newsletter processing remain frontend demos until separately connected to a secure backend.

## Folder structure

```text
shilpon-storefront/
├── index.html
├── package.json
├── pnpm-lock.yaml
├── vite.config.js
├── README.md
├── .github/workflows/deploy.yml  # Builds and deploys to GitHub Pages
├── scripts/generate-seo-pages.js # Generates product pages, metadata and sitemap
├── supabase/schema.sql          # Tables, RLS policies and media bucket
├── public/
│   └── images/
│       ├── shilpon-logo.png
│       └── shilpon-banner.svg
└── src/
    ├── App.jsx
    ├── coupon.css
    ├── main.jsx
    ├── styles.css
    ├── components/
    │   ├── CartDrawer.jsx
    │   ├── CheckoutForm.jsx
    │   ├── Footer.jsx
    │   ├── Header.jsx
    │   ├── InfoPages.jsx
    │   ├── ProductCard.jsx
    │   └── WhatsAppButton.jsx
    ├── config/siteConfig.js
    ├── context/StoreContext.jsx
    ├── data/
    │   ├── categories.js
    │   ├── navigation.js
    │   ├── products.js
    │   └── testimonials.js
    ├── services/
    │   ├── browserStorage.js
    │   ├── orderService.js
    │   └── paymentService.js
    └── utils/
        ├── format.js
        ├── productSeo.js
        └── whatsapp.js
```

## Install and run

Requires Node.js 20.19+ or 22.12+.

```bash
npm install
npm run dev
```

Vite prints the local development URL after startup.

## Editing the shop

### Live admin setup (Supabase)

The Admin tab appears at the side of the website. Until Supabase is connected, it shows setup instructions and does not accept the old browser-only PIN.

1. Create a Supabase project at [supabase.com](https://supabase.com) and keep its database password private.
2. Open **SQL Editor**, paste all of `supabase/schema.sql`, and run it. This creates the shared catalog, owner allowlist, row-level security policies and public-read/private-write media bucket.
3. In **Authentication → Users**, create the owner account and set a new password privately there. Do not reuse a password shared in chat.
4. In **SQL Editor**, replace `YOUR_ADMIN_EMAIL` in the final example query in `supabase/schema.sql` with the owner email and run it. This allowlists only that user for catalog and media writes.
5. In **Project Settings → API**, copy the Project URL and public `anon`/publishable key. Add them to GitHub repository **Settings → Secrets and variables → Actions → Variables** as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, then rerun the Pages deploy workflow. These values are intended for browser use; never use the `service_role` key or payment secrets in frontend code.
6. Open the deployed site, click **Admin**, and sign in with the owner account. Product/category edits, contact settings and uploaded logo/banner/product/category media are shared with visitors.

For local development, copy `.env.example` to `.env.local`, enter the URL and public anon key, then run `pnpm install` and `pnpm dev`; open `http://localhost:5173/#manage`. Never put passwords in `.env.local` or commit it.

1. **Logo:** your supplied `Logo.png` has been copied to `public/images/shilpon-logo.png` and is in use. Replace that file (or change `logoPath` in `src/config/siteConfig.js`) to update it. Keep the image path rooted under `public/`.
2. **Banner:** replace `public/images/shilpon-banner.svg` with your banner image and update `bannerPath` in `src/config/siteConfig.js`. The current Shilpon apparel artwork includes a small logo mark; use your own campaign banner before publishing if preferred.
3. **Products:** add one object per garment to `src/data/products.js`. Product name, Bengali name, image paths/URLs, price, sale price, category (`men`, `women`, `boys` or `girls`), sizes, colors, stock and specs all live on that product object.
4. **Price:** change `price` and, optionally, `salePrice` on the relevant product in `src/data/products.js`. Set `salePrice: null` for no discount.
5. **WhatsApp and contact numbers:** edit `whatsappNumber` and `phone` in `src/config/siteConfig.js`. The current WhatsApp number is `01727227189`; the contact number is `+880 1717-802606`.
6. **Delivery charges:** change `delivery.inside`, `delivery.outside` and `delivery.freeOver` in `src/config/siteConfig.js`.
7. **Colors:** update `colors` in `src/config/siteConfig.js` and matching CSS variables near the start of `src/styles.css`.
8. **Categories, navigation, reviews:** edit `src/data/categories.js`, `src/data/navigation.js` and `src/data/testimonials.js` respectively.

## Build and deploy

```bash
npm run build
npm run preview
```

The production site is generated in `dist/`. Upload the **contents** of `dist/` to your host's web root (often `public_html` on cPanel), not the source files. Since routes are hash-based, static hosting works without rewrite rules. If deploying to a nested URL, review the Vite `base` setting in `vite.config.js`. A domain alone does not include hosting; the domain's DNS must point to the hosting provider.

### GitHub Pages

The included GitHub Actions workflow builds the site and deploys it automatically whenever you push to the `main` branch. Create a GitHub repository, upload/push this project to `main`, then open **Settings → Pages** and set **Build and deployment → Source** to **GitHub Actions**. After the workflow succeeds, the site address is `https://YOUR-USERNAME.github.io/REPOSITORY-NAME/` (or `https://YOUR-USERNAME.github.io/` for a user-site repository). On GitHub Free, Pages is available for public repositories; a public repo makes the source files visible to everyone. The production build excludes the local Store Manager and PIN. For private source on Pages, GitHub requires a plan that supports Pages from private repositories.

Without Supabase build configuration, the sample catalog is used. The browser-only PIN editor is not exposed in production. With Supabase connected, the catalog updates live and the production build reads the public product catalog to generate a static SEO page, Product/Offer data and sitemap entry for each uploaded product. A product upload changes the storefront immediately, but GitHub Pages must be rebuilt to publish its crawlable SEO page and sitemap entry. After adding products in the admin panel, open **GitHub → Actions → Deploy Shilpon to GitHub Pages → Run workflow** to refresh them; this uses the configured public read-only catalog credentials and does not expose any secret key.

## Backend and payment integration

The storefront and cart UI run in the browser. Supabase supplies shared catalog/auth/media through `src/services/catalogService.js`. `src/services/orderService.js` remains the order API boundary: replace its demo response with a secure `POST /api/orders` endpoint, validate input and prices on the server, check stock, store the order, and return a server-generated order reference.

`src/services/paymentService.js` documents the bKash boundary. A secure backend must create checkout sessions using server-held credentials, receive provider callbacks, verify payment status server-to-server, and only then mark an order paid. Do not put bKash secrets in Vite variables or frontend files. Checkout currently rejects bKash confirmation and tells the customer it is not active.

The WhatsApp link is assembled client-side in `src/utils/whatsapp.js` and uses the configured shop number. A WhatsApp Business API integration needs a backend and authorized business credentials. Newsletter submission currently only validates the email in the browser and does not subscribe anyone. The Store Manager is browser-only and its PIN is not secure authentication; a real owner-only admin needs authenticated backend APIs and persistent storage.

## Search visibility

`npm run build` generates a separate static HTML file for each live Supabase product (or sample product when no live catalog is configured), with its own canonical URL, title, description, social preview metadata, Product/Offer and breadcrumb structured data. Product cards link to these readable product URLs. The same build creates `dist/sitemap.xml` with the homepage and product pages, plus `dist/robots.txt`; product image URLs and the catalog's `updated_at` timestamps are included where available. The GitHub Pages workflow sets the live repository URL and reads the catalog using the configured public Supabase URL and anon key. For a custom domain, set the `SITE_URL` environment variable to the full site origin with a trailing slash during the build.

After deployment, verify the domain in [Google Search Console](https://search.google.com/search-console/), submit `https://YOUR-DOMAIN/sitemap.xml`, and use URL Inspection to request indexing for the homepage and product pages. Sitemap submission is only a discovery hint; indexing and ranking are not guaranteed. Replace any sample products, photos, descriptions and review claims with accurate business information before relying on search traffic. Admin edits update the shared public catalog; run the Pages workflow to publish new static SEO pages and refresh the sitemap.

## Notes before launch

- Replace all sample product details, reviews, contact details and policy drafts with verified business information.
- Use your own appropriately licensed product photography; product/category demo photos are hosted on Unsplash.
- Add real social profile URLs and contact details in `src/config/siteConfig.js`.
- Configure a backend order service, delivery workflow, privacy notice and secure payment flow before taking real payments or treating demo orders as confirmed.

