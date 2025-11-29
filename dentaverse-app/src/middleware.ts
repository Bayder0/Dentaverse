import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Authentication disabled - all routes are public
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
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
