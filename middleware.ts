import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const adminToken = process.env.ADMIN_TOKEN;
  if (!adminToken) return NextResponse.next();

  const pathname = request.nextUrl.pathname;
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/public")
  ) {
    return NextResponse.next();
  }

  const headerToken = request.headers.get("x-admin-token");
  if (headerToken === adminToken) return NextResponse.next();

  if (pathname.startsWith("/api")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return new NextResponse("Unauthorized", { status: 401 });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
