"use client";
/* All active social links from Admin → Social (used in the header, mobile menu and footer).
   If Admin has no links filled in yet, the built-in SHINE links below are shown instead. */
import { useDb } from "@/shared/hooks/useDb";
import { SocialIcon } from "@/shared/components/Icon";

const DEFAULT_LINKS = [
  { id: "d-ig", platform: "Instagram", url: "https://www.instagram.com/shinegoldanddiamonds" },
  { id: "d-fb", platform: "Facebook", url: "https://www.facebook.com/ShineGoldAndDiamonds/" },
  { id: "d-yt", platform: "YouTube", url: "https://www.youtube.com/@shinegoldanddiamonds" },
  { id: "d-x", platform: "X", url: "https://x.com/shineqatar" },
  { id: "d-li", platform: "LinkedIn", url: "https://www.linkedin.com/company/shine-gold-diamonds/" },
];

export function SocialLinks({ className = "", size = 16 }: { className?: string; size?: number }) {
  const d = useDb();
  const fromAdmin = d.social.filter((s) => s.active && s.url).sort((a, b) => a.sort - b.sort);
  const links = fromAdmin.length ? fromAdmin : DEFAULT_LINKS;
  return (
    <div className={`social-links ${className}`}>
      {links.map((s) => (
        <a key={s.id} className="icon-btn" href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.platform} title={s.platform}>
          <SocialIcon platform={s.platform} size={size} />
        </a>
      ))}
    </div>
  );
}