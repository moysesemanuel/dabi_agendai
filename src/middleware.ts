import { NextRequest, NextResponse } from "next/server";
import { getPlatformSessionFromRequest } from "@/lib/platform-session";
import { getSessionFromRequest } from "@/lib/session";

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/platform/:path*", "/api/platform/:path*"],
};

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/platform") || pathname.startsWith("/api/platform")) {
    return platformMiddleware(request);
  }

  const session = await getSessionFromRequest(request);
  const isAdmin = session?.role === "ADMIN";

  if (isAdmin) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.next();
    }

    // Repassa o pathname via header pra o layout de /admin (Server Component,
    // roda em Node.js) conseguir saber qual pagina esta sendo renderizada sem
    // resolver isso via Prisma aqui - middleware roda em Edge e nao tem acesso
    // ao banco (ver comentario em session.ts).
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-pathname", pathname);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  if (pathname.startsWith("/api/")) {
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

// A rota de login e a checagem de sessao (/api/platform/session) precisam
// ficar acessiveis sem sessao - o resto de /platform e /api/platform exige
// a sessao propria do admin da plataforma (separada da sessao de cliente/tenant).
async function platformMiddleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname === "/platform/login" || pathname.startsWith("/api/platform/session")) {
    return NextResponse.next();
  }

  const session = await getPlatformSessionFromRequest(request);

  if (session) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: "Acesso restrito ao admin da plataforma." },
      { status: 401 },
    );
  }

  const url = request.nextUrl.clone();
  url.pathname = "/platform/login";
  url.search = "";

  return NextResponse.redirect(url);
}
