import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  // Behind Railway's proxy, req.url can reflect the container's internal
  // address (e.g. localhost:8080) instead of the public domain, so build
  // the redirect target from the forwarded headers instead.
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "localhost";
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const origin = `${proto}://${host}`;

  const res = NextResponse.redirect(new URL("/", origin));
  res.cookies.set(ADMIN_COOKIE, "", { maxAge: 0, path: "/" });
  return res;
}
