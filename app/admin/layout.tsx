/* /admin/* : ADMIN layout + ADMIN styles only. Login lives at /admin/login;
   everything under app/admin/(panel) is protected by AdminShell (session + RBAC). */
import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@/admin/styles/index.css";
import { AdminRoot } from "@/admin/layout/AdminShell";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · SHINE Admin" }, robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminRoot>{children}</AdminRoot>;
}
