import { NextResponse, type NextRequest } from "next/server";

/**
 * Server-side admin guard.
 * Mock mode: auth lives in the browser, so the client AdminShell guards routes.
 * API mode: requires the httpOnly `shine_admin` session cookie (issued by the admin
 * login API, separate from the customer cookie) before any /admin page is served.
 */
export function middleware(req: NextRequest) {
  if (process.env.NEXT_PUBLIC_DATA_MODE !== "api") return NextResponse.next();
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    if (!req.cookies.get("shine_admin")?.value) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*"] };
