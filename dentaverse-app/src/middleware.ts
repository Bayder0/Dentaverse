import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isValidSession } from "./lib/simple-auth";

export function middleware(request: NextRequest) {
  // Public routes that don't need authentication
  const publicRoutes = ["/login", "/api/simple-login"];
  
  if (publicRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check authentication
  const session = request.cookies.get("auth_session")?.value;

  if (!isValidSession(session)) {
    // Redirect to login if not authenticated
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/sales/:path*",
    "/courses/:path*",
    "/distribution/:path*",
    "/sellers/:path*",
    "/expenses/:path*",
    "/salaries/:path*",
    "/settings/:path*",
    "/analytics/:path*",
  ],
};
