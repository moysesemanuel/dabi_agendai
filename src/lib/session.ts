import type { NextRequest, NextResponse } from "next/server";

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

function base64UrlEncode(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function getHmacKey() {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function createSessionToken(payload: Omit<SessionPayload, "exp">) {
  const fullPayload: SessionPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  };

  const payloadEncoded = base64UrlEncode(new TextEncoder().encode(JSON.stringify(fullPayload)));
  const key = await getHmacKey();
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadEncoded));

  return `${payloadEncoded}.${base64UrlEncode(new Uint8Array(signature))}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token) {
    return null;
  }

  const [payloadEncoded, signatureEncoded] = token.split(".");

  if (!payloadEncoded || !signatureEncoded) {
    return null;
  }

  try {
    const key = await getHmacKey();
    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      base64UrlDecode(signatureEncoded),
      new TextEncoder().encode(payloadEncoded),
    );

    if (!isValid) {
      return null;
    }

    const payload = JSON.parse(
      new TextDecoder().decode(base64UrlDecode(payloadEncoded)),
    ) as SessionPayload;

    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
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
