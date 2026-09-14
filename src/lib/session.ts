import type { NextRequest, NextResponse } from "next/server";
import { signPayload, verifyPayload } from "@/lib/signed-token";

export const SESSION_COOKIE_NAME = "dabi_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export type SessionRole = "CUSTOMER" | "ADMIN";

export type SessionPayload = {
  id: string;
  role: SessionRole;
  tenantId: string;
  exp: number;
};

function getSecret() {
  const secret = process.env.SESSION_SECRET;

  if (!secret) {
    throw new Error("SESSION_SECRET nao configurado no ambiente.");
  }

  return secret;
}

export async function createSessionToken(payload: Omit<SessionPayload, "exp">) {
  const fullPayload: SessionPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  };

  return signPayload(fullPayload, getSecret());
}

export async function verifySessionToken(token: string | undefined | null): Promise<SessionPayload | null> {
  const payload = await verifyPayload<SessionPayload>(token, getSecret());

  if (!payload || payload.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }

  return payload;
}

export async function getSessionFromRequest(request: NextRequest) {
  return verifySessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value);
}

// Middleware roda no runtime Edge e nao consegue resolver o tenant via Prisma
// (por isso getSessionFromRequest acima nao checa tenant). Toda rota/pagina que
// roda em runtime Node.js e ja resolveu o tenant com getCurrentTenant() deve usar
// esta variante em vez da acima - fecha, na camada de sessao, qualquer rota que
// esqueça de filtrar uma query por tenantId (ver plano de migracao multi-tenant).
export async function getSessionForTenant(request: NextRequest, tenantId: string) {
  const session = await getSessionFromRequest(request);

  if (!session || session.tenantId !== tenantId) {
    return null;
  }

  return session;
}

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
