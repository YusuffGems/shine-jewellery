/* Route group (user): every customer-facing URL ( /, /collections/*, /product/*, /cart, … )
   renders inside the USER layout and USER styles only. */
import type { ReactNode } from "react";
import "@/user/styles/index.css";
import { UserLayout } from "@/user/layout/UserLayout";

export default function UserRoutesLayout({ children }: { children: ReactNode }) {
  return <UserLayout>{children}</UserLayout>;
}
