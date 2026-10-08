# SHINE Gold & Diamonds — Qatar

Premium bilingual (English / العربية) jewellery e-commerce platform with a fully separate Admin, Theme Builder, CMS and Media Manager.

**Phase 1 (this package): everything works now, in the browser.** All data — products, prices, orders, themes, translations — is stored in a local mock database (browser `localStorage`) behind a service layer. Uploaded photo and video files are stored separately in the browser's IndexedDB, so large media doesn't fill up `localStorage`. Every admin change shows on the storefront immediately.

**Phase 2: connect the API and database.** The service layer is the only thing that changes. See `docs/API-INTEGRATION.md`.

---

## Quick start

```bash
npm install
npm run dev          # http://localhost:3000
npm test             # 33 unit tests (pricing, inventory, checkout, RBAC, i18n parity, theme, webhooks)
npm run build && npm start
```

Requires Node.js 20+.

| Area | URL | Demo login (development only) |
|---|---|---|
| Storefront | `/` | Customer: `demo1@example.com` / `Demo@1234` (or register) |
| Admin | `/admin/login` | `admin@shine.demo` / `Admin@123` (Super admin) |
| | | `content@shine.demo` / `Admin@123` (Content manager) |
| | | `branch@shine.demo` / `Admin@123` (Branch 01 manager) |

Admin › Settings › **Reset to demo data** restores the seed at any time. **Export data** downloads everything as JSON.

---

## What's included

**Storefront** — editorial homepage (15 CMS sections), mega menu, search overlay, product listing with 16 filters + 5 sorts, product page (gallery + zoom + video, price breakdown, size, engraving, wishlist, compare, reviews, Find in Showroom, WhatsApp, appointment), cart with coupons and stock validation, 5-step checkout (Qatar address: building / street / zone / area / city — no PIN codes), delivery or showroom pickup, mock hosted payment, order confirmation, customer account (10 tabs), showrooms, appointment booking wizard, personalisation requests with reference upload, today's metal rates, CMS pages, FAQ.

**Switchers** — `EN | العربية` flips the whole site and admin to RTL with dedicated Arabic typography. The ☀/☾ toggle switches light/dark appearance (storefront and admin independently).

**Admin (separate login, layout, session, RBAC)** — dashboard (KPIs + charts from stored data), products (live price preview, CSV import), categories, collections, certificates, metal rates (history), pricing rules + price list + order price snapshots, inventory per showroom (adjust / transfer / damage, reservations, transaction log), orders (status flow, refund + restock), customers, coupons, reviews moderation, showrooms, appointments, personalisation, homepage CMS (enable / disable / reorder / edit), navigation & mega-menu editor, pages & FAQ, media library, **theme builder**, languages editor, social links, reports (CSV export, events, notification outbox), admin users, roles matrix, settings, audit log.

**Theme Builder** (`/admin/theme`) — 5 presets (Luxury, Ivory, Obsidian, Champagne, Minimal); controls for brand/logo/favicon, 14 colours, fonts (incl. Arabic), weights, letter spacing, buttons, cards, header, footer, product grid, forms, spacing, radius and animation speed; live Desktop / Tablet / Mobile preview; Save draft, Preview site, Publish, Reset, Duplicate, Activate, Rename, Delete (active and preset themes are protected).

**Media** — every image and video is a media *reference*. Replace a file once and it updates everywhere it's used. Elegant SHINE placeholders render for empty slots; videos fall back to poster → image → placeholder, so no section is ever broken.

---

## Project structure — User and Admin are fully separate

```
app/                         ROUTES ONLY (thin files that render a page component)
  (user)/                    → USER app: /, /collections/*, /product/*, /cart, /checkout, /account, …
    layout.tsx               imports user/styles + UserLayout (header, footer, storefront theme)
  admin/                     → ADMIN app: /admin/*
    layout.tsx               imports admin/styles + AdminRoot
    login/                   /admin/login (public)
    (panel)/                 every other /admin page — protected by AdminShell (session + RBAC)
  api/                       health, pricing quote, metal rates, payment webhook
  layout.tsx, globals.css    <html>/<body>, shared providers and base styles only

user/                        USER APP CODE — never imported by admin/
  layout/                    UserLayout
  components/                header, footer, home sections, listing, product, checkout, account, promo banners
  hooks/                     useCart, useCustomer
  services/                  shopping (cart/checkout), account, engagement (reviews, appointments…)
  providers/                 storefront theme + scroll reveals
  styles/                    storefront.css, rtl.css, responsive.css, motion.css

admin/                       ADMIN APP CODE — never imported by user/
  layout/                    AdminShell (sidebar, top bar, route guard, permissions)
  components/                CrudManager, AssetSlot, MediaPicker, theme builder, admin UI kit
  config/nav.ts              sidebar menu + required permission per page
  hooks/                     useAdmin
  services/                  products, orders, inventory, rates, content, media, assets, theme, auth
  styles/                    admin.css, responsive.css

shared/                      genuinely shared by both apps
  components/                Media (renders any uploaded image/video), Icon, Modal/Drawer, Toast, form inputs, PriceBreakdown
  hooks/                     useDb, useI18n, useMediaUrl
  services/                  catalogue queries, media upload/storage, order lifecycle, preferences, core helpers
  providers/                 data hydration, language direction, favicon, fonts
  styles/                    design tokens, reset, primitives (buttons, inputs, tables)

lib/                         business logic, no UI: pricing engine, checkout, inventory, RBAC, payments, theme tokens, seed data
public/media/                generated SAMPLE images & videos (replace from Admin)
public/media/brand/          your SHINE logo (original + transparent header/footer versions + favicon)
tools/media-generator/       script that rendered the sample media
locales/en.json, ar.json     all interface text
prisma/, tests/, docs/
```

Rules: `user/` and `admin/` never import each other (both may import `shared/` and `lib/`). Admin routes use only the admin layout and styles; user routes use only the user layout and styles.

Layering: **route → component → hook → service → (API) → business logic (lib) → database.** Components never compute prices or write data directly.

### Replacing images & videos

**Admin › Site assets** (`/admin/assets`) shows every visual slot on the website — logo, favicon, homepage hero (desktop image, mobile image, video), section images, promo banners, category and collection images, showroom photos, menu images, and every product's photos and videos. Each slot has **Upload** (new file, applied immediately), **Replace file** (swaps the file everywhere it is used), **Library** and **Remove**. Items still using generated sample media show a **Sample** badge. **Admin › Banners** manages the promotional banners' text, links and placement.

---

## Placeholder data

All seeded content is clearly placeholder (your logo is the only real asset): `Branch 01–03` with no addresses or phones, `DEMO-xxx` SKUs, demo customers/orders, **demo metal rates labelled "Demo"** (not live), empty social URLs, and generated sample product/campaign images and videos (marked "Sample" in Admin). Replace them from Admin › Site assets before launch.

## Licence

Proprietary — see `LICENSE`.
