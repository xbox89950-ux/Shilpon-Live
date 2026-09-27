# Shilpon — editable storefront starter

Shilpon is a responsive React + Vite clothing storefront starter for men, women, boys and girls. It uses sample apparel and your supplied logo with a locally drawn clothing banner. It has no live order API, payment processor, newsletter service, inventory sync or admin panel. COD checkout is explicitly a browser demo, and bKash is not active.

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

For a local visual editor, put `VITE_ADMIN_PIN=your-local-pin` in the ignored `.env.local` file, start the site, and open `http://localhost:5173/#manage`. The editor adds/edits/removes products, changes WhatsApp/contact details, and uploads product photos, a logo, banner, category photos or a short product video without editing code. Product photos and shop edits use IndexedDB with a 1 GiB application cap; actual browser/device quota may be lower. Photos are resized before saving; video files must be under 700 KB. The local PIN is kept out of the public repository.

**Important:** this visual editor saves to the current browser only. Its convenience PIN is visible in local development and is not secure authentication; edits do not publish to a hosted store or share them with customers. The production build excludes the Store Manager. A real owner-only live admin needs server-side authentication, shared product/image storage and deployment hosting; that is not included in this starter.

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

Products and photos added through the browser admin panel are saved only in that browser's IndexedDB. They are not included in a GitHub deployment and will not sync to the live website or other devices. To publish catalog changes using GitHub Pages, edit `src/data/products.js` and add image files under `public/`, then push the updated project. A shared live admin panel needs a backend and online database/media storage.

## Backend and payment integration

The storefront, search, category filters, cart persistence and demo UI are frontend-only. Product and photo edits are stored only in IndexedDB on the current browser/device, with a 1 GiB application cap; browser quota can be lower, and the data does not sync to customers or other devices. `src/services/orderService.js` is the order API boundary. Replace its demo response with a `POST /api/orders` call, validate all input and pricing on the server, check stock, store the order, and return a server-generated order reference. Shared online product/photo storage needs a secure backend and object storage.

`src/services/paymentService.js` documents the bKash boundary. A secure backend must create checkout sessions using server-held credentials, receive provider callbacks, verify payment status server-to-server, and only then mark an order paid. Do not put bKash secrets in Vite variables or frontend files. Checkout currently rejects bKash confirmation and tells the customer it is not active.

The WhatsApp link is assembled client-side in `src/utils/whatsapp.js` and uses the configured shop number. A WhatsApp Business API integration needs a backend and authorized business credentials. Newsletter submission currently only validates the email in the browser and does not subscribe anyone. The Store Manager is browser-only and its PIN is not secure authentication; a real owner-only admin needs authenticated backend APIs and persistent storage.

## Search visibility

`npm run build` generates a separate static HTML file for each sample product, with its own canonical URL, title, description, social preview metadata and Product/Offer structured data. Product cards link to these readable product URLs. The same build creates `dist/sitemap.xml` with the homepage and product pages, plus `dist/robots.txt`. The GitHub Pages workflow sets the live repository URL automatically. For a custom domain, set the `SITE_URL` environment variable to the full site origin with a trailing slash during the build.

After deployment, verify the domain in [Google Search Console](https://search.google.com/search-console/), submit `https://YOUR-DOMAIN/sitemap.xml`, and use URL Inspection to request indexing for the homepage and product pages. Sitemap submission is only a discovery hint; indexing and ranking are not guaranteed. Replace all sample products, photos, descriptions and review claims with accurate business information before relying on search traffic. Browser-admin edits stay on that browser and do not change the public catalog or sitemap; publish changes through `src/data/products.js` and a new deployment.

## Notes before launch

- Replace all sample product details, reviews, contact details and policy drafts with verified business information.
- Use your own appropriately licensed product photography; product/category demo photos are hosted on Unsplash.
- Add real social profile URLs and contact details in `src/config/siteConfig.js`.
- Configure a backend order service, delivery workflow, privacy notice and secure payment flow before taking real payments or treating demo orders as confirmed.
