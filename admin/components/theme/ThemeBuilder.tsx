"use client";
import { useEffect, useState, type ReactNode } from "react";
import { useDb } from "@/shared/hooks/useDb";
import { useI18n } from "@/shared/hooks/useI18n";
import { useAdmin } from "@/admin/hooks/useAdmin";
import { ARABIC_FONTS, BODY_FONTS, HEADING_FONTS, PRESETS } from "@/lib/theme/tokens";
import { activateTheme, deleteTheme, duplicateTheme, publishTheme, renameTheme, saveDraft } from "@/admin/services/theme";
import { setPreviewTheme } from "@/shared/services/preferences";
import { ColorInput, Toggle } from "@/shared/components/Form";
import { MediaField } from "@/admin/components/MediaPicker";
import { useToast } from "@/shared/components/Toast";
import { Icon } from "@/shared/components/Icon";
import { ThemePreview, type Device } from "./ThemePreview";
import type { ThemeTokens } from "@/types";

type K = keyof ThemeTokens;

function Section({ title, children, open }: { title: string; children: ReactNode; open?: boolean }) {
  return (
    <details className="tb-section" open={open}>
      <summary>{title}</summary>
      <div className="tb-section-body">{children}</div>
    </details>
  );
}

export function ThemeBuilder() {
  const d = useDb();
  const { t } = useI18n();
  const { can } = useAdmin();
  const toast = useToast();
  const [themeId, setThemeId] = useState(d.settings.activeThemeId);
  const theme = d.themes.find((x) => x.id === themeId) ?? d.themes[0];
  const [tokens, setTokens] = useState<ThemeTokens>(theme.draft ?? theme.tokens);
  const [device, setDevice] = useState<Device>("desktop");
  const [previewPath, setPreviewPath] = useState("/");
  const [dirty, setDirty] = useState(false);
  const editable = can("theme.update");

  useEffect(() => {
    setTokens(theme.draft ?? theme.tokens);
    setDirty(false);
  }, [theme.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = <Key extends K>(k: Key, v: ThemeTokens[Key]) => {
    setTokens((x) => ({ ...x, [k]: v }));
    setDirty(true);
  };

  const color = (k: K, label: string) => <ColorInput key={k} label={label} value={String(tokens[k])} onChange={(v) => set(k, v as never)} />;
  const range = (k: K, label: string, min: number, max: number, step = 1, unit = "px") => (
    <label className="tb-range" key={k}>
      <span>{label}</span>
      <output>{String(tokens[k])}{unit}</output>
      <input type="range" min={min} max={max} step={step} value={Number(tokens[k])} onChange={(e) => set(k, Number(e.target.value) as never)} />
    </label>
  );
  const select = (k: K, label: string, options: (string | number)[], labels?: string[]) => (
    <label className="field" key={k}>
      <span className="label">{label}</span>
      <select className="select" value={String(tokens[k])} onChange={(e) => set(k, (typeof tokens[k] === "number" ? Number(e.target.value) : e.target.value) as never)}>
        {options.map((o, i) => <option key={String(o)} value={String(o)}>{labels?.[i] ?? String(o)}</option>)}
      </select>
    </label>
  );
  const toggle = (k: K, label: string) => (
    <div className="toggle-row" key={k}><span>{label}</span><Toggle checked={!!tokens[k]} label={label} onChange={(v) => set(k, v as never)} /></div>
  );
  const media = (k: "logoMediaId" | "logoDarkMediaId" | "faviconMediaId", label: string) => (
    <div className="field" key={k}><span className="label">{label}</span><MediaField value={tokens[k] ? [tokens[k] as string] : []} onChange={(ids) => set(k, ids[0])} /></div>
  );

  return (
    <div className="tb">
      <div className="tb-controls">
        <div className="tb-controls-head">
          <div className="row row--between"><strong>{t("admin.theme.title")}</strong>{dirty ? <span className="badge badge--warning">{t("admin.theme.unsaved")}</span> : theme.draft ? <span className="badge">{t("admin.theme.draft")}</span> : null}</div>
          <div className="theme-list">
            {d.themes.map((th) => (
              <button key={th.id} className="theme-item" aria-current={th.id === themeId} onClick={() => (dirty && !window.confirm(t("admin.theme.discard")) ? null : setThemeId(th.id))}>
                <span className="theme-dots">{[th.tokens.colorBackground, th.tokens.colorPrimary, th.tokens.colorGold].map((c, i) => <i key={i} style={{ background: c }} />)}</span>
                <span>{th.name}{th.preset ? <small className="muted"> · {t("admin.theme.preset")}</small> : null}</span>
                {d.settings.activeThemeId === th.id ? <span className="badge badge--success">{t("admin.theme.live")}</span> : null}
              </button>
            ))}
          </div>
          {editable ? (
            <div className="row" style={{ gap: "0.4rem" }}>
              {d.settings.activeThemeId !== theme.id ? <button className="btn btn--secondary btn--sm" onClick={() => (activateTheme(theme.id), toast(t("admin.theme.activated")))}>{t("admin.theme.activate")}</button> : null}
              <button className="btn btn--secondary btn--sm" onClick={() => { const name = window.prompt(t("admin.theme.rename"), theme.name); if (name) renameTheme(theme.id, name); }} disabled={theme.preset}>{t("admin.theme.renameBtn")}</button>
              <button className="btn btn--danger btn--sm" onClick={() => {
                if (!window.confirm(t("admin.confirmDelete"))) return;
                const r = deleteTheme(theme.id);
                if (!r.ok) toast(t(`admin.theme.cannotDelete.${r.reason}`), "error");
                else setThemeId(d.settings.activeThemeId);
              }}><Icon name="trash" size={14} /></button>
            </div>
          ) : null}
        </div>

        <fieldset disabled={!editable} style={{ border: 0 }}>
          <Section title={t("admin.theme.s.brand")}>
            <label className="field"><span className="label">{t("admin.theme.brandName")}</span><input className="input" value={tokens.brandName} onChange={(e) => set("brandName", e.target.value)} /></label>
            <label className="field"><span className="label">{t("admin.theme.tagline")}</span><input className="input" value={tokens.tagline} onChange={(e) => set("tagline", e.target.value)} /></label>
            {media("logoMediaId", t("admin.theme.logo"))}
            {media("logoDarkMediaId", t("admin.theme.logoDark"))}
            {media("faviconMediaId", t("admin.theme.favicon"))}
          </Section>
          <Section title={t("admin.theme.s.colours")} open>
            <div className="row" style={{ gap: "0.35rem" }}>
              {PRESETS.map((p) => <button key={p.id} type="button" className="chip" onClick={() => (setTokens((x) => ({ ...x, ...pickColours(p.tokens) })), setDirty(true))} title={t("admin.theme.applyPalette")}>{p.name.replace("SHINE ", "")}</button>)}
            </div>
            <div className="tb-swatches">
              {color("colorPrimary", t("admin.theme.c.primary"))}{color("colorSecondary", t("admin.theme.c.secondary"))}
              {color("colorAccent", t("admin.theme.c.accent"))}{color("colorGold", t("admin.theme.c.gold"))}
              {color("colorBackground", t("admin.theme.c.background"))}{color("colorSurface", t("admin.theme.c.surface"))}
              {color("colorText", t("admin.theme.c.text"))}{color("colorMuted", t("admin.theme.c.muted"))}
              {color("colorBorder", t("admin.theme.c.border"))}{color("colorSuccess", t("admin.theme.c.success"))}
              {color("colorWarning", t("admin.theme.c.warning"))}{color("colorError", t("admin.theme.c.error"))}
            </div>
          </Section>
          <Section title={t("admin.theme.s.typography")}>
            {select("fontHeading", t("admin.theme.headingFont"), HEADING_FONTS)}
            {select("fontBody", t("admin.theme.bodyFont"), BODY_FONTS)}
            {select("fontArabic", t("admin.theme.arabicFont"), ARABIC_FONTS)}
            {select("headingWeight", t("admin.theme.headingWeight"), [300, 400, 500, 600, 700])}
            {select("bodyWeight", t("admin.theme.bodyWeight"), [300, 400, 500])}
            {range("letterSpacing", t("admin.theme.letterSpacing"), -0.02, 0.1, 0.005, "em")}
          </Section>
          <Section title={t("admin.theme.s.buttons")}>
            {select("buttonStyle", t("admin.theme.buttonStyle"), ["solid", "outline", "gold"], [t("admin.theme.solid"), t("admin.theme.outline"), t("admin.theme.gold")])}
            {range("buttonRadius", t("admin.theme.radius"), 0, 40)}
            {range("buttonHeight", t("admin.theme.height"), 36, 64)}
            {toggle("buttonUppercase", t("admin.theme.uppercase"))}
          </Section>
          <Section title={t("admin.theme.s.cards")}>
            {range("cardRadius", t("admin.theme.radius"), 0, 28)}
            {select("cardShadow", t("admin.theme.shadow"), ["none", "soft", "lifted"])}
            {toggle("cardBorder", t("admin.theme.border"))}
            {select("cardHover", t("admin.theme.hover"), ["swap", "zoom", "lift", "none"], [t("admin.theme.hoverSwap"), t("admin.theme.hoverZoom"), t("admin.theme.hoverLift"), t("admin.theme.none")])}
            {select("imageRatio", t("admin.theme.imageRatio"), ["4/5", "1/1", "3/4"])}
          </Section>
          <Section title={t("admin.theme.s.header")}>
            {select("headerStyle", t("admin.theme.headerStyle"), ["centered", "left"], [t("admin.theme.centered"), t("admin.theme.leftLogo")])}
            {toggle("headerSticky", t("admin.theme.sticky"))}
            {toggle("headerTransparent", t("admin.theme.transparent"))}
            {toggle("announcementEnabled", t("admin.theme.announcement"))}
            {range("logoSize", t("admin.theme.logoSize"), 18, 52)}
            {range("navSpacing", t("admin.theme.navSpacing"), 12, 48)}
          </Section>
          <Section title={t("admin.theme.s.footer")}>
            <div className="tb-swatches">{color("footerBackground", t("admin.theme.c.footerBg"))}{color("footerText", t("admin.theme.c.footerText"))}</div>
            {select("footerColumns", t("admin.theme.footerColumns"), [3, 4])}
            {toggle("footerSocial", t("admin.theme.socialIcons"))}
            {toggle("footerNewsletter", t("admin.theme.newsletter"))}
          </Section>
          <Section title={t("admin.theme.s.grid")}>
            {select("gridColumns", t("admin.theme.columns"), [2, 3, 4])}
            {toggle("quickView", t("product.quickView"))}
            {toggle("wishlistOnCard", t("header.wishlist"))}
          </Section>
          <Section title={t("admin.theme.s.forms")}>{range("inputRadius", t("admin.theme.inputRadius"), 0, 16)}</Section>
          <Section title={t("admin.theme.s.global")}>
            {range("containerWidth", t("admin.theme.container"), 1080, 1680, 20)}
            {range("pagePadding", t("admin.theme.pagePadding"), 12, 64)}
            {range("sectionSpacing", t("admin.theme.sectionSpacing"), 48, 160, 4)}
            {range("radius", t("admin.theme.borderRadius"), 0, 20)}
            {range("animationSpeed", t("admin.theme.animationSpeed"), 0, 2, 0.1, "×")}
          </Section>
        </fieldset>

        {editable ? (
          <div className="tb-foot">
            <button className="btn btn--secondary btn--sm" onClick={() => (saveDraft(theme.id, tokens), setDirty(false), toast(t("admin.theme.draftSaved")))}>{t("admin.theme.saveDraft")}</button>
            <button className="btn btn--secondary btn--sm" onClick={() => { saveDraft(theme.id, tokens); setDirty(false); setPreviewTheme(theme.id); window.open("/", "_blank"); }}>{t("admin.theme.preview")}</button>
            <button className="btn btn--secondary btn--sm" onClick={() => { const base = PRESETS.find((p) => p.id === theme.id)?.tokens ?? theme.tokens; setTokens(base); setDirty(true); }}>{t("admin.theme.reset")}</button>
            <button className="btn btn--secondary btn--sm" onClick={() => { const id = duplicateTheme(theme.id, tokens); setThemeId(id); toast(t("admin.theme.duplicated")); }}>{t("admin.theme.duplicate")}</button>
            <button className="btn btn--block" style={{ gridColumn: "1 / -1" }} onClick={() => { if (!window.confirm(t("admin.theme.confirmPublish"))) return; publishTheme(theme.id, tokens); setDirty(false); toast(t("admin.theme.published")); }}>{t("admin.theme.publish")}</button>
          </div>
        ) : null}
      </div>

      <div className="tb-stage">
        <div className="tb-stage-bar">
          <div className="seg" role="group" aria-label={t("admin.theme.device")}>
            {(["desktop", "tablet", "mobile"] as Device[]).map((x) => (
              <button key={x} aria-pressed={device === x} onClick={() => setDevice(x)}><Icon name={x === "desktop" ? "monitor" : x} size={15} /> {t(`admin.theme.${x}`)}</button>
            ))}
          </div>
          <select className="select" style={{ maxWidth: 200 }} value={previewPath} onChange={(e) => setPreviewPath(e.target.value)} aria-label={t("admin.theme.previewPage")}>
            <option value="/">{t("nav.home")}</option>
            <option value={`/collections/${d.categories.find((c) => c.slug === "rings")?.slug ?? "all"}`}>{t("listing.allJewellery")}</option>
            <option value={`/product/${d.products.find((p) => p.status === "active")?.slug ?? ""}`}>{t("admin.f.product")}</option>
            <option value="/cart">{t("cart.title")}</option>
          </select>
          <span className="muted small">{t("admin.theme.liveHint")}</span>
        </div>
        <div className="tb-canvas"><ThemePreview key={previewPath} tokens={tokens} device={device} path={previewPath} /></div>
      </div>
    </div>
  );
}

function pickColours(t: ThemeTokens): Partial<ThemeTokens> {
  const { colorPrimary, colorSecondary, colorAccent, colorGold, colorBackground, colorSurface, colorText, colorMuted, colorBorder, footerBackground, footerText } = t;
  return { colorPrimary, colorSecondary, colorAccent, colorGold, colorBackground, colorSurface, colorText, colorMuted, colorBorder, footerBackground, footerText };
}
