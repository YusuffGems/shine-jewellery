"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useDb } from "@/shared/hooks/useDb";
import { useI18n } from "@/shared/hooks/useI18n";
import { useCart } from "@/user/hooks/useShopper";
import { storefrontTokens } from "@/lib/theme/resolve";
import { setPreviewTheme } from "@/shared/services/preferences";
import { Icon } from "@/shared/components/Icon";
import { Drawer } from "@/shared/components/Overlay";
import { Media } from "@/shared/components/Media";
import { Brand } from "./Brand";
import { AppearanceToggle, LangSwitch } from "./Switchers";
import { SearchOverlay } from "./SearchOverlay";
import { SocialLinks } from "@/user/components/common/SocialLinks";
import type { NavItem } from "@/types";

function MegaMenu({ item, onNavigate }: { item: NavItem; onNavigate: () => void }) {
  const { L } = useI18n();
  return (
    <div className="mega" role="region" aria-label={L(item.label)}>
      <div className="container mega-inner">
        {item.columns.map((col, i) => (
          <div className="mega-col" key={i}>
            <h4>{L(col.title)}</h4>
            <ul>
              {col.links.map((l) => (
                <li key={l.href + L(l.label)}>
                  <Link href={l.href} onClick={onNavigate}>{L(l.label)}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {Array.from({ length: Math.max(0, 3 - item.columns.length) }).map((_, i) => <div key={`pad${i}`} />)}
        {item.featuredMediaId ? (
          <Link href={item.featuredHref || item.href} className="mega-feature" onClick={onNavigate}>
            <Media mediaId={item.featuredMediaId} />
            <span className="mega-feature-caption">
              {L(item.featuredTitle)} <Icon name="arrowRight" size={18} />
            </span>
          </Link>
        ) : <div />}
      </div>
    </div>
  );
}

function MobileNav({ open, onClose, items }: { open: boolean; onClose: () => void; items: NavItem[] }) {
  const { t, L } = useI18n();
  const [expanded, setExpanded] = useState<string | null>(null);
  return (
    <Drawer open={open} onClose={onClose} label={t("header.menu")}>
      <div className="row row--between" style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--color-border)" }}>
        <Brand />
        <button className="icon-btn" onClick={onClose} aria-label={t("common.close")}><Icon name="close" /></button>
      </div>
      <nav style={{ padding: "0.5rem 1.25rem", flex: 1 }} aria-label={t("header.menu")}>
        {items.map((item) => (
          <div key={item.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
            {item.columns.length ? (
              <>
                <button className="row row--between" style={{ width: "100%", padding: "1rem 0", border: 0, background: "none", cursor: "pointer" }} aria-expanded={expanded === item.id} onClick={() => setExpanded(expanded === item.id ? null : item.id)}>
                  <span className="caps" style={{ fontSize: "0.8rem" }}>{L(item.label)}</span>
                  <Icon name={expanded === item.id ? "minus" : "plus"} size={16} />
                </button>
                {expanded === item.id ? (
                  <div style={{ paddingBottom: "1rem", display: "grid", gap: "1rem" }}>
                    {item.columns.map((c, i) => (
                      <div key={i}>
                        <p className="muted small" style={{ marginBottom: "0.4rem" }}>{L(c.title)}</p>
                        <div style={{ display: "grid", gap: "0.5rem" }}>
                          {c.links.map((l) => <Link key={l.href + L(l.label)} href={l.href} onClick={onClose}>{L(l.label)}</Link>)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </>
            ) : (
              <Link href={item.href} onClick={onClose} className="caps" style={{ display: "block", padding: "1rem 0", fontSize: "0.8rem" }}>{L(item.label)}</Link>
            )}
          </div>
        ))}
      </nav>
      <SocialLinks className="drawer-social" size={18} />
      <div className="row row--between" style={{ padding: "1rem 1.25rem", borderTop: "1px solid var(--color-border)" }}>
        <LangSwitch />
        <AppearanceToggle />
        <Link href="/account" onClick={onClose} className="row small"><Icon name="user" size={18} /> {t("header.account")}</Link>
      </div>
    </Drawer>
  );
}

export function Header() {
  const d = useDb();
  const { t, L } = useI18n();
  const pathname = usePathname();
  const { count } = useCart();
  const { tokens, previewName } = storefrontTokens(d);
  const [openId, setOpenId] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const nav = d.cms.navigation.filter((n) => n.active).sort((a, b) => a.sort - b.sort);
  const isHome = pathname === "/";
  const openItem = nav.find((n) => n.id === openId);
  const [hovering, setHovering] = useState(false);
  // Transparent header over the homepage hero shows the light (dark-background) logo.
  const overHero = tokens.headerTransparent && isHome && !scrolled && !hovering && !openItem?.columns.length;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => setOpenId(null), [pathname]);

  const enter = (id: string) => {
    clearTimeout(closeTimer.current);
    setOpenId(id);
  };
  const leave = () => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenId(null), 140);
  };

  return (
    <>
      {previewName ? (
        <div className="preview-banner" role="status">
          {t("theme.previewing", { name: previewName })}
          <button onClick={() => setPreviewTheme(undefined)}>{t("theme.exitPreview")}</button>
        </div>
      ) : null}
         {true ? (
        <div className="announcement">
          {tokens.announcementEnabled && L(d.cms.announcement) ? <span>{L(d.cms.announcement)}</span> : null}
          <SocialLinks className="announcement-social" size={14} />
        </div>
      ) : null}
      <header className={["site-header", isHome && "is-home", scrolled && "is-scrolled", openItem?.columns.length && "mega-open"].filter(Boolean).join(" ")} onMouseEnter={() => setHovering(true)} onMouseLeave={() => (setHovering(false), leave())}>
        <div className="container header-bar">
          <div className="header-start">
            <button className="icon-btn header-mobile-only" style={{ display: "none" }} onClick={() => setMobileOpen(true)} aria-label={t("header.menu")}>
              <Icon name="menu" />
            </button>
            <button className="header-search" onClick={() => setSearchOpen(true)} aria-label={t("header.search")}>
              <Icon name="search" size={16} /> <span>{t("header.searchPlaceholder")}</span>
            </button>
            <button className="icon-btn header-mobile-only" style={{ display: "none" }} onClick={() => setSearchOpen(true)} aria-label={t("header.search")}>
              <Icon name="search" />
            </button>
          </div>
          <Brand onDark={overHero || undefined} />
          <div className="header-end">
            <span className="header-desktop-only row" style={{ gap: 0 }}>
              <LangSwitch />
              <AppearanceToggle />
            </span>
            <Link href="/showrooms" className="icon-btn header-desktop-only" aria-label={t("nav.showrooms")}><Icon name="pin" /></Link>
            <Link href="/account" className="icon-btn" aria-label={t("header.account")}><Icon name="user" /></Link>
            <Link href="/wishlist" className="icon-btn" aria-label={t("header.wishlist")}>
              <Icon name="heart" />
              {d.session.wishlist.length ? <span className="count">{d.session.wishlist.length}</span> : null}
            </Link>
            <Link href="/cart" className="icon-btn" aria-label={t("header.cart", { count })}>
              <Icon name="bag" />
              {count ? <span className="count">{count}</span> : null}
            </Link>
          </div>
        </div>
        <nav className="main-nav" aria-label={t("header.mainNav")}>
          <ul className="container nav-list">
            {nav.map((item) => (
              <li key={item.id} className="nav-item" data-open={openId === item.id} onMouseEnter={() => (item.columns.length ? enter(item.id) : setOpenId(null))} onFocus={() => item.columns.length && enter(item.id)}>
                <Link href={item.href} className="nav-link" aria-current={pathname === item.href ? "page" : undefined} aria-haspopup={item.columns.length ? "true" : undefined} aria-expanded={item.columns.length ? openId === item.id : undefined}>
                  {L(item.label)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        {openItem && openItem.columns.length ? (
          <div onMouseEnter={() => enter(openItem.id)} onKeyDown={(e) => e.key === "Escape" && setOpenId(null)}>
            <MegaMenu item={openItem} onNavigate={() => setOpenId(null)} />
          </div>
        ) : null}
      </header>
      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} items={nav} />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}