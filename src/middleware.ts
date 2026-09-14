import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/session";

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};

export async function middleware(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  const isAdmin = session?.role === "ADMIN";

  if (isAdmin) {
    return NextResponse.next();
  }

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: "Acesso restrito ao administrador." },
      { status: 401 },
    );
  }

  const url = request.nextUrl.clone();
  url.pathname = "/";
  url.search = "";
  url.searchParams.set("acessoNegado", "1");

  return NextResponse.redirect(url);
}
