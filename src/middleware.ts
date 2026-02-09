import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect /events/new → /events
  if (pathname === "/events/new") {
    return NextResponse.redirect(new URL("/events", request.url));
  }

  // Redirect /plans/new → /plans
  if (pathname === "/plans/new") {
    return NextResponse.redirect(new URL("/plans", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/events/new", "/plans/new"],
};
