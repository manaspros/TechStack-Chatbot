import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  // Get the pathname
  const { pathname } = req.nextUrl;

  // Skip Auth0 routes - let Auth0 handle these
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Simple check for authentication via cookie
  const authCookie = req.cookies.get("appSession");

  // Protected API routes
  if (pathname.startsWith("/api/chat")) {
    // If no auth cookie is present, return 401
    if (!authCookie) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // For authenticated requests, continue
    return NextResponse.next();
  }

  // Protected pages (chatbot and protected)
  if (
    pathname === "/chatbot" ||
    pathname.startsWith("/chatbot/") ||
    pathname === "/protected"
  ) {
    // If no auth cookie is present, redirect to login
    if (!authCookie) {
      // Need to encode the return URL
      const returnTo = encodeURIComponent(pathname);
      return NextResponse.redirect(
        new URL(`/api/auth/login?returnTo=${returnTo}`, req.url)
      );
    }
  }

  // Allow all other routes
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
