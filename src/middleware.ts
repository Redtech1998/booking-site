import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const host = req.headers.get("host") || "";
  const { pathname } = req.nextUrl;

  // Bypass static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.includes(".") // static assets like .png, .ico, .svg
  ) {
    return NextResponse.next();
  }

  // Check if accessing from local network or studio machine (Mac, iPhone, iPad on local Wi-Fi)
  const isLocalNetwork =
    host.includes("localhost") ||
    host.includes("127.0.0.1") ||
    host.includes(".local") ||
    host.startsWith("192.168.") ||
    host.startsWith("10.") ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host);

  // Check for passcode authorization for remote Apple devices (iPhone/iPad/Mac)
  const urlPass = req.nextUrl.searchParams.get("pin") || req.nextUrl.searchParams.get("pass");
  const hasPassAuth = urlPass === "rse2026" || urlPass === "8866";
  const authCookie = req.cookies.get("rse_os_token")?.value;
  const isAuthorizedRemote = authCookie === "rse_studio_keyur" || hasPassAuth;

  const canAccessOS = isLocalNetwork || isAuthorizedRemote;

  // 1. Strictly isolate OS and internal Studio APIs from unauthorized public web visitors
  if (!canAccessOS) {
    if (pathname.startsWith("/os")) {
      const url = req.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }

    // Protect internal Studio management APIs from public web access
    if (
      pathname.startsWith("/api/staff") ||
      pathname.startsWith("/api/invoices") ||
      pathname.startsWith("/api/clients") ||
      pathname.startsWith("/api/attendance")
    ) {
      return new NextResponse(
        JSON.stringify({ error: "Access denied. Internal studio endpoint." }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  // If newly authorized via URL pass, set persistent cookie for future visits
  if (hasPassAuth) {
    const res = NextResponse.next();
    res.cookies.set("rse_os_token", "rse_studio_keyur", {
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: "lax",
    });
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
