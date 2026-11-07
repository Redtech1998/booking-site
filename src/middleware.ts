import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const host = req.headers.get("host") || "";
  const { pathname } = req.nextUrl;
  const isLocal = host.includes("localhost") || host.includes("127.0.0.1");

  // Bypass static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.includes(".") // static assets like .png, .ico, .svg
  ) {
    return NextResponse.next();
  }

  // 1. Strictly isolate OS and internal Studio APIs from the public booking site
  // OS is exclusively reserved for the internal Studio Electron desktop app on localhost
  if (!isLocal) {
    if (pathname.startsWith("/os")) {
      const url = req.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }

    // Protect internal Studio management APIs from public web access
    if (
      pathname.startsWith("/api/staff") ||
      pathname.startsWith("/api/invoices") ||
      pathname.startsWith("/api/clients")
    ) {
      return new NextResponse(
        JSON.stringify({ error: "Access denied. Internal studio endpoint." }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
