import webpush from "web-push";

export type WebPushSubscriptionKeys = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

export type WebPushPayload = {
  title: string;
  body: string;
  url: string;
};

class WebPushConfigurationError extends Error {}

class WebPushGoneError extends Error {}

function getVapidConfig() {
  const publicKey = process.env.VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  const subject = process.env.VAPID_SUBJECT?.trim();

  if (!publicKey || !privateKey || !subject) {
    throw new WebPushConfigurationError("VAPID nao configurado.");
  }

  return { publicKey, privateKey, subject };
}

let configured = false;

function ensureConfigured() {
  if (configured) {
    return;
  }

  const { publicKey, privateKey, subject } = getVapidConfig();
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

export function getVapidPublicKey() {
  return getVapidConfig().publicKey;
}

export async function sendWebPush(subscription: WebPushSubscriptionKeys, payload: WebPushPayload) {
  ensureConfigured();

  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      JSON.stringify(payload),
    );
  } catch (error) {
    const statusCode = (error as { statusCode?: number }).statusCode;

    if (statusCode === 404 || statusCode === 410) {
      throw new WebPushGoneError("Subscription nao existe mais.");
    }

    throw error;
  }
}

export function isWebPushGoneError(error: unknown): error is WebPushGoneError {
  return error instanceof WebPushGoneError;
}
