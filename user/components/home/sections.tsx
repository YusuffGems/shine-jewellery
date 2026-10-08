"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { useDb } from "@/shared/hooks/useDb";
import { useI18n } from "@/shared/hooks/useI18n";
import { activeProducts } from "@/shared/services/catalog";
import { subscribeNewsletter } from "@/user/services/engagement";
import { track } from "@/shared/services/core";
import { isEmail } from "@/lib/utils";
import { Media } from "@/shared/components/Media";
import { ProductCard } from "@/user/components/product/ProductCard";
import { Icon, SocialIcon } from "@/shared/components/Icon";
import { useToast } from "@/shared/components/Toast";
import type { HomeSection } from "@/types";

type P = { s: HomeSection };

export function SectionHead({ s, start }: { s: HomeSection; start?: boolean }) {
  const { L } = useI18n();
  return (
    <div className={`section-head reveal${start ? " section-head--start" : ""}`}>
      {L(s.eyebrow) ? <span className="eyebrow">{L(s.eyebrow)}</span> : null}
      <h2 className="section-title">{L(s.title)}</h2>
      {L(s.body) && !start ? <p className="section-sub">{L(s.body)}</p> : null}
    </div>
  );
}

export function HeroSection({ s }: P) {
  const { L } = useI18n();
  return (
    <section className="hero" aria-label={L(s.title)}>
           <div className="hero-media" style={{ background: "#1a1214" }}>
        <Media mediaId={s.videoId ? undefined : s.mediaId} mobileMediaId={s.videoId ? undefined : s.mobileMediaId} videoId={s.videoId} kind="campaign" dark priority playInView={false} />
      </div>
      <div className="container">
        <div className="hero-content">
          {L(s.eyebrow) ? <span className="eyebrow">{L(s.eyebrow)}</span> : null}
          <h1 className="hero-title">{L(s.title)}</h1>
          {L(s.body) ? <p className="hero-body">{L(s.body)}</p> : null}
          {s.ctaHref ? (
            <div className="hero-actions">
              <Link href={s.ctaHref} className="btn btn--light">{L(s.ctaLabel)}</Link>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function CategoriesSection({ s }: P) {
  const d = useDb();
  const { t, L } = useI18n();

  const order = [
    "rings",
    "earrings",
    "necklaces",
    "bracelets",
    "bangles",
    "pendants",
    "gold-coins",
  ];

  const cats = order
    .map((slug) =>
      d.categories.find(
        (c) => c.active && c.slug === slug
      )
    )
    .filter(
      (c): c is NonNullable<typeof c> => !!c
    );

  const shown = cats.length
    ? cats
    : d.categories
        .filter((c) => c.active)
        .slice(0, 7);

  // Actual videos from public/media/videos/
  const categoryVideos: Record<string, string> = {
    
    rings: "/media/videos/rings.mp4",
    earrings: "/media/videos/earrings.mp4",
    necklaces: "/media/videos/necklaces.mp4",
    bracelets: "/media/videos/bracelets.mp4",
    bangles: "/media/videos/bangles.mp4",
    pendants: "/media/videos/pendants.mp4",
    "gold-coins": "/media/videos/gold-coins.mp4",
  };

  return (
    <section className="section">
      <div className="container">
        <SectionHead s={s} />

        <div className="cat-rail reveal">
          {shown.map((c) => {
            const video = categoryVideos[c.slug];

            const productCount = d.products.filter(
              (p) =>
                p.status === "active" &&
                p.categoryIds.includes(c.id)
            ).length;

            return (
              <Link
                key={c.id}
                href={`/collections/${c.slug}`}
                className="cat-tile"
              >
                {/* SAME SIZE ARCH FOR EVERY CATEGORY */}
                <div
                  className="arch"
                  style={{
                    width: "100%",
                    height: "220px",
                    minHeight: "220px",
                    maxHeight: "220px",
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  {video ? (
                    <video
                      src={video}
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="auto"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        objectPosition: "center",
                        display: "block",
                      }}
                      aria-label={L(c.name)}
                    />
                  ) : (
                    <Media
                      mediaId={c.mediaId}
                      className="w-full h-full"
                      kind="category"
                      alt={L(c.name)}
                    />
                  )}
                </div>

                <span>
                  <span className="cat-tile-name">
                    {L(c.name)}
                  </span>

                  <span className="cat-tile-count">
                    {t("home.pieces", {
                      count: productCount,
                    })}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function FeaturedCollectionSection({ s }: P) {
  const d = useDb();
  const { L } = useI18n();
  const col = d.collections.find((c) => c.id === s.collectionId);
  const products = activeProducts(d).filter((p) => col && p.collectionIds.includes(col.id)).slice(0, 2);
  return (
    <section className="section section--surface">
      <div className="container feature">
               <div className="feature-media reveal">
          <div className="media" style={{ aspectRatio: "4/5" }}>
            <video
              src="/media/videos/dimond-nekles.mp4"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              aria-label={L(s.title)}
            />
          </div>
        </div>
        <div className="feature-body reveal">
          <span className="eyebrow">{L(s.eyebrow)}</span>
          <h2 className="section-title">{L(s.title) || L(col?.name)}</h2>
          <p className="section-sub">{L(s.body) || L(col?.description)}</p>
          <div className="feature-products">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
          {s.ctaHref ? <Link href={s.ctaHref} className="btn btn--ghost" style={{ marginTop: "2.5rem" }}>{L(s.ctaLabel)}</Link> : null}
        </div>
      </div>
    </section>
  );
}

export function ProductRailSection({ s }: P) {
  const d = useDb();
  const { t, L } = useI18n();
  const railRef = useRef<HTMLDivElement>(null);
  const list = activeProducts(d);
  const products =
    s.type === "newArrivals"
      ? [...list].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, 10)
      : [...list].sort((a, b) => b.popularity - a.popularity).slice(0, 10);
  const scroll = (dir: number) => {
    const el = railRef.current;
    if (!el) return;
    const rtl = document.documentElement.dir === "rtl" ? -1 : 1;
    el.scrollBy({ left: dir * rtl * el.clientWidth * 0.8, behavior: "smooth" });
  };
  return (
    <section className="section">
      <div className="container">
        <div className="rail-head">
          <SectionHead s={s} start />
          <div className="row">
            {s.ctaHref ? <Link href={s.ctaHref} className="btn btn--ghost">{L(s.ctaLabel)}</Link> : null}
            <div className="rail-controls">
              <button className="icon-btn" onClick={() => scroll(-1)} aria-label={t("common.previous")}><Icon name="chevronLeft" /></button>
              <button className="icon-btn" onClick={() => scroll(1)} aria-label={t("common.next")}><Icon name="chevronRight" /></button>
            </div>
          </div>
        </div>
        <div className="rail reveal" ref={railRef}>
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </div>
    </section>
  );
}

export function StorySection({ s }: P) {
  const { L } = useI18n();
  const reverse = s.type === "goldStory";
  return (
    <section className={`story${reverse ? " story--reverse story--dark" : ""}`}>
      <div className="story-media">
        <Media mediaId={s.mediaId} videoId={s.videoId} kind="campaign" dark={reverse} />
      </div>
      <div className="story-body reveal">
        <span className="eyebrow" style={{ justifyContent: "flex-start" }}>{L(s.eyebrow)}</span>
        <h2 className="section-title">{L(s.title)}</h2>
        <p>{L(s.body)}</p>
        {s.ctaHref ? <Link href={s.ctaHref} className="btn btn--ghost" style={{ justifySelf: "start" }}>{L(s.ctaLabel)}</Link> : null}
      </div>
    </section>
  );
}

export function EditorialSection({ s }: P) {
  const { L } = useI18n();
  return (
    <section className="editorial">
      <Media mediaId={s.mediaId} videoId={s.videoId} kind="campaign" dark />
      <div className="container reveal">
        <span className="eyebrow">{L(s.eyebrow)}</span>
        <h2 className="section-title">{L(s.title)}</h2>
        <p>{L(s.body)}</p>
        {s.ctaHref ? <Link href={s.ctaHref} className="btn btn--light">{L(s.ctaLabel)}</Link> : null}
      </div>
    </section>
  );
}

export function VideoStorySection({ s }: P) {
  const { L } = useI18n();
  const FILM = "/media/videos/story1.mp4"; // ← change the film here
  const HEIGHT = "clamp(300px, 50vh, 520px)"; // ← change the section height here
  return (
    <section className="video-story">
      <div className="video-frame" style={{ aspectRatio: "auto", height: HEIGHT }}>
        <div className="media">
          <video src={FILM} autoPlay muted loop playsInline preload="auto" aria-label={L(s.title)} />
        </div>
        <div className="video-caption">
          <span className="eyebrow" style={{ color: "var(--color-gold-soft)" }}>{L(s.eyebrow)}</span>
          <h2 className="section-title">{L(s.title)}</h2>
          <p>{L(s.body)}</p>
        </div>
      </div>
    </section>
  );
}

export function PersonalisationSection({ s }: P) {
  const { L } = useI18n();
  return (
    <section className="section">
      <div className="container feature" style={{ gridTemplateColumns: "1fr 1.1fr" }}>
        <div className="feature-body reveal">
          <span className="eyebrow" style={{ justifyContent: "flex-start" }}>{L(s.eyebrow)}</span>
          <h2 className="section-title">{L(s.title)}</h2>
          <p className="section-sub">{L(s.body)}</p>
          <div className="row" style={{ marginTop: "2rem" }}>
            {s.ctaHref ? <Link href={s.ctaHref} className="btn">{L(s.ctaLabel)}</Link> : null}
          </div>
        </div>
        <div className="feature-media reveal">
          <Media mediaId={s.mediaId} videoId={s.videoId} kind="campaign" ratio="5/4" />
        </div>
      </div>
    </section>
  );
}

export function ShowroomsSection({ s }: P) {
  const d = useDb();
  const { t, L } = useI18n();
  const branches = d.branches.filter((b) => b.active).sort((a, b) => a.sort - b.sort);
  return (
    <section className="section section--surface">
      <div className="container">
        <SectionHead s={s} />
        <div className="showroom-grid">
          {branches.map((b) => (
            <article key={b.id} className="showroom-card reveal">
              <Media mediaId={b.imageIds[0]} videoId={b.videoId} kind="showroom" />
              <div className="showroom-card-body">
                <h3>{L(b.name)}</h3>
                <p className="muted">{L(b.address)}</p>
                <p className="muted">{L(b.hours)}</p>
                <Link href={`/appointment?branch=${b.id}`} className="btn btn--ghost" style={{ justifySelf: "start", marginTop: "0.5rem" }} onClick={() => track("showroom_click", { branchId: b.id })}>
                  {t("nav.bookAppointment")}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CraftSection({ s }: P) {
  const { t, L } = useI18n();
  return (
    <section className="section">
      <div className="container craft">
        <div className="reveal">
          <span className="eyebrow" style={{ justifyContent: "flex-start" }}>{L(s.eyebrow)}</span>
          <h2 className="section-title">{L(s.title)}</h2>
          <p className="section-sub">{L(s.body)}</p>
          <ol className="craft-steps">
            <li>{t("home.craft1")}</li>
            <li>{t("home.craft2")}</li>
            <li>{t("home.craft3")}</li>
          </ol>
        </div>
        <Media mediaId={s.mediaId} videoId={s.videoId} kind="campaign" className="reveal" />
      </div>
    </section>
  );
}

export function TestimonialsSection({ s }: P) {
  const d = useDb();
  const { L } = useI18n();
  const items = d.cms.testimonials.filter((x) => x.active).sort((a, b) => a.sort - b.sort);
  return (
    <section className="section">
      <div className="container">
        <SectionHead s={s} />
        <div className="quotes">
          {items.map((q) => (
            <figure key={q.id} className="quote reveal">
              <span className="stars" aria-hidden="true">★★★★★</span>
              <blockquote>“{L(q.text)}”</blockquote>
              <cite>{q.name}</cite>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SocialSection({ s }: P) {
  const d = useDb();
  const tiles = d.media.filter((m) => m.folder === "Social" && m.status === "active").slice(0, 6);
  const links = d.social.filter((x) => x.active && x.url);
  return (
    <section className="section section--tight">
      <div className="container">
        <SectionHead s={s} />
      </div>
      <div className="social-grid">
        {tiles.map((m) => <Media key={m.id} mediaId={m.id} videoId={m.type === "video" ? m.id : undefined} kind="campaign" />)}
      </div>
      {links.length ? (
        <div className="social-links">
          {links.map((l) => (
            <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer" className="icon-btn" aria-label={l.platform}><SocialIcon platform={l.platform} size={18} /></a>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export function NewsletterSection({ s }: P) {
  const { t, L } = useI18n();
  const toast = useToast();
  const [email, setEmail] = useState("");
  return (
    <section className="section section--surface newsletter">
      <div className="container">
        <SectionHead s={s} />
        <form
          className="newsletter-form reveal"
          onSubmit={(e) => {
            e.preventDefault();
            if (!isEmail(email)) return toast(t("forms.invalidEmail"), "error");
            subscribeNewsletter(email);
            setEmail("");
            toast(t("newsletter.thanks"));
          }}
        >
          <input className="input" type="email" required placeholder={t("newsletter.placeholder")} value={email} onChange={(e) => setEmail(e.target.value)} aria-label={t("newsletter.placeholder")} />
          <button className="btn" type="submit">{L(s.ctaLabel) || t("newsletter.join")} <Icon name="arrowRight" size={16} /></button>
        </form>
      </div>
    </section>
  );
}
