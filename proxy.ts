import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const path = req.nextUrl.pathname;

  const isAdminRoute =
    path.startsWith("/dashboard") ||
    path.startsWith("/event-types") ||
    path.startsWith("/availability") ||
    path.startsWith("/bookings") ||
    path.startsWith("/settings") ||
    path.startsWith("/admin");

  if (!isAdminRoute) return NextResponse.next();

  // No session → bounce to login
  if (!req.auth?.user) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  // Super-admin-only routes — host gets bounced back to their own panel
  if (path.startsWith("/admin/global") && req.auth.user.role !== "super_admin") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/event-types/:path*",
    "/availability/:path*",
    "/bookings/:path*",
    "/settings/:path*",
    "/admin/:path*",
  ],
};
