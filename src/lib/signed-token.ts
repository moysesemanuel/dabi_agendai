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

async function getHmacKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function signPayload<T extends object>(payload: T, secret: string) {
  const payloadEncoded = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const key = await getHmacKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadEncoded));

  return `${payloadEncoded}.${base64UrlEncode(new Uint8Array(signature))}`;
}

export async function verifyPayload<T>(
  token: string | undefined | null,
  secret: string,
): Promise<T | null> {
  if (!token) {
    return null;
  }

  const [payloadEncoded, signatureEncoded] = token.split(".");

  if (!payloadEncoded || !signatureEncoded) {
    return null;
  }

  try {
    const key = await getHmacKey(secret);
    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      base64UrlDecode(signatureEncoded),
      new TextEncoder().encode(payloadEncoded),
    );

    if (!isValid) {
      return null;
    }

    return JSON.parse(new TextDecoder().decode(base64UrlDecode(payloadEncoded))) as T;
  } catch {
    return null;
  }
}
