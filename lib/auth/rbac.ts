import type { Role } from "@/types";

export const PERMISSIONS = [
  "dashboard.read",
  "products.create", "products.read", "products.update", "products.delete",
  "orders.read", "orders.update", "orders.refund",
  "inventory.read", "inventory.update",
  "metalRates.read", "metalRates.update",
  "customers.read",
  "branches.read", "branches.update",
  "appointments.read", "appointments.update",
  "coupons.read", "coupons.update",
  "reviews.read", "reviews.update",
  "theme.read", "theme.update",
  "cms.read", "cms.update",
  "media.read", "media.upload", "media.update", "media.delete",
  "languages.update",
  "reports.read",
  "users.read", "users.update",
  "roles.read", "roles.update",
  "settings.update",
  "audit.read",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const content: Permission[] = ["dashboard.read", "products.read", "theme.read", "theme.update", "cms.read", "cms.update", "media.read", "media.upload", "media.update", "media.delete", "languages.update", "reviews.read", "reviews.update"];
const inventory: Permission[] = ["dashboard.read", "products.read", "inventory.read", "inventory.update", "branches.read", "metalRates.read", "reports.read"];
const sales: Permission[] = ["dashboard.read", "products.read", "orders.read", "orders.update", "customers.read", "appointments.read", "appointments.update", "coupons.read", "coupons.update", "inventory.read", "metalRates.read", "reports.read"];
const branch: Permission[] = ["dashboard.read", "products.read", "orders.read", "orders.update", "inventory.read", "inventory.update", "branches.read", "appointments.read", "appointments.update", "customers.read", "metalRates.read"];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  SUPER_ADMIN: [...PERMISSIONS],
  ADMIN: PERMISSIONS.filter((p) => !["roles.update"].includes(p)),
  BRANCH_MANAGER: branch,
  INVENTORY_MANAGER: inventory,
  SALES_MANAGER: sales,
  CONTENT_MANAGER: content,
  CUSTOMER: [],
};

export const ADMIN_ROLES: Role[] = ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER", "INVENTORY_MANAGER", "SALES_MANAGER", "CONTENT_MANAGER"];

export function can(role: Role | undefined, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/** Customers can never enter admin, whatever their permissions map says. */
export function canAccessAdmin(role: Role | undefined): boolean {
  return !!role && role !== "CUSTOMER" && ADMIN_ROLES.includes(role);
}
