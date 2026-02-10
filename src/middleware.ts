import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. PUBLIC ROUTES
  if (pathname === "/login" || pathname.startsWith("/api/auth") || pathname.startsWith("/_next") || pathname.includes(".")) {
    return NextResponse.next();
  }

  // 2. PROTECTED ROUTES (All except login/auth)
  const userCookie = request.cookies.get("user");

  if (!userCookie) {
    // Return 401 JSON for API routes
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Redirect to login for page routes
    return NextResponse.redirect(new URL("/login", request.url));
  }

  let user;
  try {
    user = JSON.parse(userCookie.value);
  } catch {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 3. ADMIN-ONLY ROUTES
  if (pathname.startsWith("/admin") && user.role !== "admin") {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 4. MANAGER/ADMIN ROUTES
  const protectedManagerPaths = ["/dashboard", "/venues", "/staff", "/events", "/plans"];
  const isProtectedPath = protectedManagerPaths.some(p => pathname === p || pathname.startsWith(p + "/"));

  if (isProtectedPath) {
    if (!["admin", "manager"].includes(user.role)) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/venues/:path*",
    "/staff/:path*",
    "/events/:path*",
    "/plans/:path*",
    "/api/:path*", // Protect API as well
  ],
};
