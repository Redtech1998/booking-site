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

  // 1. Strictly block /os from public websites (book.rsegnr.in, vercel.app, etc.)
  // /os is exclusively reserved for the internal Studio Electron desktop app on localhost
  const isLocal = host.includes("localhost") || host.includes("127.0.0.1");
  if (!isLocal && pathname.startsWith("/os")) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
