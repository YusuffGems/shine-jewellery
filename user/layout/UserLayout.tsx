/* USER APP layout — header, footer and storefront theming. Never used by /admin. */
import type { ReactNode } from "react";
import { Header } from "@/user/components/header/Header";
import { Footer } from "@/user/components/footer/Footer";
import { UserThemeSync } from "@/user/providers/UserThemeSync";

export function UserLayout({ children }: { children: ReactNode }) {
  return (
    <div className="user-app">
      <UserThemeSync />
      <a href="#main" className="sr-only">Skip to content</a>
      <Header />
      <main id="main">{children}</main>
      <Footer />
    </div>
  );
}
