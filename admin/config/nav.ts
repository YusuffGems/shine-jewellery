import type { Permission } from "@/lib/auth/rbac";
import type { IconName } from "@/shared/components/Icon";

export interface AdminNavItem { href: string; label: string; icon: IconName; permission: Permission }
export interface AdminNavGroup { title: string; items: AdminNavItem[] }

/** Labels are i18n keys (locales/*.json → admin.nav.*). */
export const ADMIN_NAV: AdminNavGroup[] = [
  { title: "admin.group.overview", items: [{ href: "/admin", label: "admin.nav.dashboard", icon: "grid", permission: "dashboard.read" }] },
  {
    title: "admin.group.catalog",
    items: [
      { href: "/admin/products", label: "admin.nav.products", icon: "tag", permission: "products.read" },
      { href: "/admin/categories", label: "admin.nav.categories", icon: "layers", permission: "products.read" },
      { href: "/admin/collections", label: "admin.nav.collections", icon: "sparkle", permission: "products.read" },
      { href: "/admin/certificates", label: "admin.nav.certificates", icon: "shield", permission: "products.read" },
    ],
  },
  {
    title: "admin.group.pricing",
    items: [
      { href: "/admin/metal-rates", label: "admin.nav.metalRates", icon: "coins", permission: "metalRates.read" },
      { href: "/admin/pricing", label: "admin.nav.pricing", icon: "chart", permission: "metalRates.read" },
    ],
  },
  { title: "admin.group.inventory", items: [{ href: "/admin/inventory", label: "admin.nav.inventory", icon: "box", permission: "inventory.read" }] },
  {
    title: "admin.group.sales",
    items: [
      { href: "/admin/orders", label: "admin.nav.orders", icon: "bag", permission: "orders.read" },
      { href: "/admin/customers", label: "admin.nav.customers", icon: "users", permission: "customers.read" },
      { href: "/admin/coupons", label: "admin.nav.coupons", icon: "tag", permission: "coupons.read" },
      { href: "/admin/reviews", label: "admin.nav.reviews", icon: "star", permission: "reviews.read" },
    ],
  },
  {
    title: "admin.group.showrooms",
    items: [
      { href: "/admin/showrooms", label: "admin.nav.showrooms", icon: "store", permission: "branches.read" },
      { href: "/admin/appointments", label: "admin.nav.appointments", icon: "calendar", permission: "appointments.read" },
      { href: "/admin/personalisation", label: "admin.nav.personalisation", icon: "edit", permission: "appointments.read" },
    ],
  },
  {
    title: "admin.group.content",
    items: [
      { href: "/admin/assets", label: "admin.nav.assets", icon: "image", permission: "media.read" },
      { href: "/admin/banners", label: "admin.nav.banners", icon: "layers", permission: "cms.read" },
      { href: "/admin/cms", label: "admin.nav.homepage", icon: "home", permission: "cms.read" },
      { href: "/admin/cms/navigation", label: "admin.nav.navigation", icon: "menu", permission: "cms.read" },
      { href: "/admin/cms/pages", label: "admin.nav.pages", icon: "file", permission: "cms.read" },
      { href: "/admin/media", label: "admin.nav.media", icon: "image", permission: "media.read" },
      { href: "/admin/theme", label: "admin.nav.theme", icon: "palette", permission: "theme.read" },
      { href: "/admin/languages", label: "admin.nav.languages", icon: "globe", permission: "languages.update" },
      { href: "/admin/social", label: "admin.nav.social", icon: "share", permission: "cms.read" },
    ],
  },
  {
    title: "admin.group.system",
    items: [
      { href: "/admin/reports", label: "admin.nav.reports", icon: "chart", permission: "reports.read" },
      { href: "/admin/users", label: "admin.nav.users", icon: "users", permission: "users.read" },
      { href: "/admin/roles", label: "admin.nav.roles", icon: "lock", permission: "roles.read" },
      { href: "/admin/settings", label: "admin.nav.settings", icon: "settings", permission: "settings.update" },
      { href: "/admin/audit", label: "admin.nav.audit", icon: "file", permission: "audit.read" },
    ],
  },
];
