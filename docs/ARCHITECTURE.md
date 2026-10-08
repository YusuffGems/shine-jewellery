# Architecture

## Principles

1. **Nothing permanent in code.** Logo, colours, fonts, navigation, categories, products, prices, rates, showrooms, photos, videos, homepage, banners, collections, pages, social links, English and Arabic text, SEO, coupons — all editable in Admin.
2. **Media by reference.** Components receive media IDs (`heroImage`, `productImages[]`, `showroomVideos[]` …) and render through `<Media>`, which resolves the asset, picks mobile sources, plays video in view, and falls back video → poster → image → placeholder.
3. **Separation of concerns.** Pricing, checkout, inventory, RBAC, facets and reports live in `lib/` as pure, tested functions. Services are the only writers. Components only render.
4. **Admin is a separate application.** Own login, session (`session.adminId`, independent of `session.customerId`), layout, visual system (`.admin-root` tokens unaffected by storefront themes) and permission checks.

## Theme system

`ThemeTokens` (types) → `toCssVars()` (lib/theme/tokens.ts) → CSS custom properties on `<html>` (storefront) or on the preview frame (Theme Builder). All storefront CSS reads `var(--color-*)`, `--font-*`, `--btn-*`, `--card-*`, `--grid-cols`, `--radius-*`, `--section-space`, `--dur*`. Structural options (card hover, header layout, transparency) are data attributes. Publishing copies the draft to live tokens; Preview opens the storefront with a "Previewing theme" banner.

## RTL

`dir` is set on `<html>` from the language. Layout uses logical properties (`margin-inline-start`, `inset-inline-end`…), so it mirrors automatically; `styles/rtl.css` handles Arabic typography (no letter-spaced caps, dedicated Arabic font and sizes) and flips directional icons. Prices and numbers stay LTR-isolated.

## Pricing

```
Jewellery: metal (net g × rate) + making (per g | % | fixed) + wastage % + stones + diamonds + premium + other
           − discount %  + tax %
Bullion:   weight × rate + premium + other − discount + tax
```

Orders store a full breakdown + the rate used (`snapshot`, `rateSnapshot`). Changing rates never alters existing orders.

## Inventory

Per product per showroom: `total, reserved, sold, returned, damaged, transferred`. `available = total − reserved − sold − damaged − transferred + returned`. Checkout allocates (pickup → that showroom only; delivery → largest stock first), reserves on order creation, converts to sold on payment success, releases on failure/cancel. Allocation returns `null` instead of overselling.

## Order lifecycle

`pending_payment → paid → confirmed → processing → shipped | ready_for_pickup → delivered`; side paths `payment_failed`, `cancelled`, `refunded`. Each change is appended to `history`, audited and queued as a notification.

## Responsive targets

320 · 375 · 390 · 430 · 768 · 1024 · 1280 · 1440 · 1920 (styles/responsive.css). Placeholders adapt to their frame size with container queries.

## Accessibility

Skip link, focus-visible rings, focus-trapped dialogs with Escape, ARIA on switches/tabs/menus, alt text from the media library (EN/AR), `prefers-reduced-motion` honoured, form labels and error roles.
