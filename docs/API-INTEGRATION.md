# Phase 2 — Connecting the API & database

The app is built so the move from mock data to a real backend touches **services**, not screens.

```
Component ──▶ hook (useDb / useCart …) ──▶ services/*.ts ──▶ [mock] lib/store/db.ts
                                                       └──▶ [api]  services/api-client.ts ──▶ app/api/* ──▶ lib/* ──▶ Prisma
```

## 1. Database

```bash
npm i @prisma/client@6 && npm i -D prisma@6 tsx
cp .env.example .env.local        # set DATABASE_URL
npx prisma migrate dev --name init
npm run db:seed
```

Then remove `lib/database/prisma.ts` and `prisma` from `tsconfig.json › exclude`.

## 2. API routes to add (one per service)

| Service | Routes |
|---|---|
| `services/catalog.ts` | `GET/POST /api/products`, `PATCH/DELETE /api/products/:id`, `/api/categories`, `/api/collections`, `POST /api/products/import` |
| `services/rates.ts` | `GET /api/metal-rates` (exists), `PATCH /api/metal-rates/:id`, cron `POST /api/metal-rates/sync` |
| `services/inventory.ts` | `/api/inventory/adjust`, `/transfer`, `/damage` |
| `services/commerce.ts` | `/api/cart`, `/api/checkout` (creates order + reservations in one transaction), `/api/payments/webhook` (exists), `/api/orders/:id/status`, `/api/orders/:id/refund` |
| `services/auth.ts` | `/api/auth/*` (customer) and `/api/admin/auth/*` (admin) — **separate cookies**: `shine_customer`, `shine_admin` (httpOnly, Secure, SameSite=Lax) |
| `services/content.ts` | `/api/cms/*`, `/api/translations`, `/api/settings`, `/api/appointments`, `/api/personalisation` |
| `services/media.ts` | `POST /api/media/upload-url` (presigned S3/R2 upload), `PATCH/DELETE /api/media/:id` |
| `services/theme.ts` | `/api/themes`, `/api/themes/:id/publish` (writes a `ThemeVersion`) |

Every mutating route: validate input → check permission with `can(role, permission)` from `lib/auth/rbac.ts` → run business logic from `lib/` → write `AuditLog`.

## 3. Switch services

Set `NEXT_PUBLIC_DATA_MODE=api`. In each service, branch on `isApiMode()`:

```ts
export async function saveProduct(p: Product) {
  if (isApiMode()) return api(`/products/${p.id}`, { method: "PATCH", json: p });
  upsertEntity("products", p); // mock
}
```

Replace `useDb()` reads with data-fetching hooks (SWR / React Query) returning the same shapes from `types/index.ts`.

## 4. Pricing on the server

`lib/pricing/engine.ts` is pure and already used by `POST /api/pricing/quote`. Checkout must re-price on the server and store `PriceSnapshot` per order item — never trust client totals.

## 5. Payments

Implement a `PaymentProvider` (see `lib/payments/provider.ts`) for your Qatar gateway: `createSession` returns the hosted payment URL; `parseWebhook` verifies the provider signature; `refund`. The webhook route already enforces signature verification and idempotency. Card data never touches SHINE.

## 6. Live metal rates

Implement `MetalRateProvider.fetchRates()` (`services/rates.ts`) against your licensed rate feed and schedule `syncFromProvider` (e.g. every 5 minutes). Mark rates `stale` if the feed fails; never invent values.

## 7. Notifications & analytics

`queueNotification()` and `track()` (services/core.ts) already record events. In API mode, write them to `Notification` / an analytics sink and dispatch through email, SMS, WhatsApp and push providers.

## 8. Security checklist

- Admin guard in `middleware.ts` activates in API mode (requires `shine_admin` cookie); also check permissions inside every route handler.
- Hash passwords with argon2id/bcrypt on the server (`lib/auth/hash.ts` is mock-only).
- 2FA/OTP: add `twoFactorSecret` verification in the admin login route (field exists in the schema).
- Rate-limit auth, checkout and quote routes (`lib/security/rate-limit.ts`; use Redis in production).
- CSRF: same-site cookies + origin check on mutating routes.
- Store secrets only in environment variables; `.env*` files are git-ignored.

## 9. Migrating the current website

`Admin › Products › Import CSV` maps SKU, names, category, metal purity, weight and making charges. Images: upload to the Media Library (or set CDN URLs) and attach to products. Old URLs → add rows to the `Redirect` table and serve them from middleware.
