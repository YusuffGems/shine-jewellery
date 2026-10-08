/* Re-mounts on every page change inside the user site, so each new page fades in smoothly.
   The header and footer live in layout.tsx and stay still. */
import type { ReactNode } from "react";

export default function UserPageTransition({ children }: { children: ReactNode }) {
  return <div className="page-transition">{children}</div>;
}