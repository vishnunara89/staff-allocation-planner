import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public
  if (pathname === "/login") return NextResponse.next();

  if (pathname.startsWith("/admin") || pathname.startsWith("/dashboard")) {
    const userCookie = request.cookies.get("user");

    if (!userCookie) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    let user;
    try {
      user = JSON.parse(userCookie.value);
    } catch {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Admin-only
    if (pathname.startsWith("/admin") && user.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Dashboard allowed roles
    if (
      pathname.startsWith("/dashboard") &&
      !["admin", "manager"].includes(user.role)
    ) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*"],
};
