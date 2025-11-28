export { default as middleware } from "next-auth/middleware";

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

