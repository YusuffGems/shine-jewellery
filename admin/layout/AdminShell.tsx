"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useDb, useHydrated } from "@/shared/hooks/useDb";
import { useI18n } from "@/shared/hooks/useI18n";
import { useAdmin } from "@/admin/hooks/useAdmin";
import { logoutAdmin } from "@/admin/services/auth";
import { ADMIN_NAV } from "@/admin/config/nav";
import { AdminAppearanceToggle, AdminLangSwitch } from "@/admin/components/AdminSwitchers";
import { Icon } from "@/shared/components/Icon";

export function AdminRoot({ children }: { children: ReactNode }) {
  const d = useDb();
  return (
    <div className="admin-root" data-appearance={d.session.adminAppearance}>
      {children}
    </div>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const hydrated = useHydrated();
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useI18n();
  const { user, can } = useAdmin();
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    if (hydrated && !user) router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
  }, [hydrated, user, router, pathname]);
  useEffect(() => setNavOpen(false), [pathname]);

  if (!hydrated || !user) return <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }} className="muted">{t("common.loading")}</div>;

  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname === href || (pathname.startsWith(`${href}/`) && !ADMIN_NAV.some((g) => g.items.some((i) => i.href !== href && i.href.startsWith(href) && pathname.startsWith(i.href)))));

  return (
    <div className="admin-shell" data-nav-open={navOpen}>
      <aside className="admin-sidebar" aria-label={t("admin.sidebar")}>
        <div className="admin-brand"><b>SHINE</b><span>{t("admin.badge")}</span></div>
        {ADMIN_NAV.map((g) => {
          const items = g.items.filter((i) => can(i.permission));
          if (!items.length) return null;
          return (
            <div key={g.title} className="side-group">
              <div className="side-group-title">{t(g.title)}</div>
              {items.map((i) => (
                <Link key={i.href} href={i.href} className="side-link" aria-current={isActive(i.href) ? "page" : undefined}>
                  <Icon name={i.icon} /> {t(i.label)}
                </Link>
              ))}
            </div>
          );
        })}
      </aside>
      {navOpen ? <div className="drawer-wrap" style={{ zIndex: 45 }} onClick={() => setNavOpen(false)} /> : null}
      <div className="admin-main">
        <header className="admin-topbar">
          <button className="icon-btn menu-btn" onClick={() => setNavOpen(true)} aria-label={t("header.menu")}><Icon name="menu" /></button>
          <span className="grow" />
          <Link href="/" target="_blank" className="btn btn--secondary btn--sm"><Icon name="eye" size={14} /> {t("admin.viewStore")}</Link>
          <AdminLangSwitch />
          <AdminAppearanceToggle />
          <div className="admin-user">
            <span className="admin-avatar" aria-hidden="true">{user.name.slice(0, 1)}</span>
            <span className="header-desktop-only" style={{ display: "grid", lineHeight: 1.2 }}>
              <b style={{ fontWeight: 500 }}>{user.name}</b>
              <small className="muted">{t(`role.${user.role}`)}</small>
            </span>
          </div>
          <button className="icon-btn" onClick={() => (logoutAdmin(), router.replace("/admin/login"))} aria-label={t("admin.logout")} title={t("admin.logout")}><Icon name="logout" size={18} /></button>
        </header>
        <div className="admin-content">{children}</div>
      </div>
    </div>
  );
}

/** Wrap admin pages: shows a friendly block instead of content the role can't access. */
export function RequirePermission({ perm, children }: { perm: Parameters<ReturnType<typeof useAdmin>["can"]>[0]; children: ReactNode }) {
  const { can } = useAdmin();
  const { t } = useI18n();
  if (!can(perm)) return <div className="empty"><h3>{t("admin.noAccess")}</h3><p>{t("admin.noAccessHint")}</p></div>;
  return <>{children}</>;
}
