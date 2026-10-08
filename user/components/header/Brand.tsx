"use client";
/* USER — brand logo. Uses the uploaded logo from Admin › Brand & assets (or Theme builder),
   automatically choosing the version made for light or dark backgrounds. */
import Link from "next/link";
import { useDb } from "@/shared/hooks/useDb";
import { useMediaUrl } from "@/shared/hooks/useMediaUrl";
import { storefrontTokens } from "@/lib/theme/resolve";
import { onColor } from "@/lib/theme/tokens";

const isDarkColour = (hex: string) => onColor(hex) === "#FFFFFF";

export function Brand({ onDark, background }: { onDark?: boolean; background?: string }) {
  const d = useDb();
  const { tokens } = storefrontTokens(d);
  const dark = onDark ?? isDarkColour(background ?? tokens.colorBackground);
  const logoId = dark ? tokens.logoDarkMediaId || tokens.logoMediaId : tokens.logoMediaId;
  const logo = useMediaUrl(logoId ? d.media.find((m) => m.id === logoId && m.status === "active")?.url : "");
  return (
    <Link href="/" className="brand" aria-label={`${tokens.brandName} ${tokens.tagline} — home`}>
      {logo ? (
        <img src={logo} alt={`${tokens.brandName} ${tokens.tagline}`} className="brand-logo" />
      ) : (
        <>
          <span className="brand-name">{tokens.brandName}</span>
          <span className="brand-tag">{tokens.tagline}</span>
        </>
      )}
    </Link>
  );
}
