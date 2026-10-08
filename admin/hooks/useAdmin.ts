"use client";
/* ADMIN APP hook — signed-in admin user and permission checks. */
import { useMemo } from "react";
import { useDb } from "@/shared/hooks/useDb";
import { can, type Permission } from "@/lib/auth/rbac";

export function useAdmin() {
  const d = useDb();
  return useMemo(() => {
    const user = d.adminUsers.find((u) => u.id === d.session.adminId && u.active);
    const expired = !d.session.adminExpiresAt || Date.parse(d.session.adminExpiresAt) < Date.now();
    const valid = !!user && !expired;
    return {
      user: valid ? user : undefined,
      can: (p: Permission) => valid && can(user?.role, p),
    };
  }, [d.adminUsers, d.session.adminId, d.session.adminExpiresAt]);
}
