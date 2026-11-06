import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const host = req.headers.get("host") || "";
  const { pathname } = req.nextUrl;

  // Bypass static files and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") // static assets like .png, .ico, .svg
  ) {
    return NextResponse.next();
  }

  // 1. If accessing via os.rsegnr.in (or local test os.localhost)
  const isOsSubdomain =
    host.startsWith("os.") ||
    host.includes("os.rsegnr.in") ||
    host.includes("os.localhost");

  if (isOsSubdomain) {
    // If accessing root "/" on os.rsegnr.in, rewrite internally to "/os"
    if (pathname === "/") {
      const url = req.nextUrl.clone();
      url.pathname = "/os";
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
