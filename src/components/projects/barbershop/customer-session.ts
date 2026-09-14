"use client";

export const CUSTOMER_SESSION_STORAGE_KEY = "dabi-agendai-customer-session";
export const CUSTOMER_SESSION_EVENT = "dabi-agendai-customer-session-updated";

export type CustomerSession = {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  role?: "CUSTOMER" | "ADMIN";
};

export function readCustomerSession() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(CUSTOMER_SESSION_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CustomerSession) : null;
  } catch {
    return null;
  }
}

export function writeCustomerSession(session: CustomerSession | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (!session) {
    window.localStorage.removeItem(CUSTOMER_SESSION_STORAGE_KEY);
    window.dispatchEvent(new Event(CUSTOMER_SESSION_EVENT));
    return;
  }

  window.localStorage.setItem(CUSTOMER_SESSION_STORAGE_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event(CUSTOMER_SESSION_EVENT));
}
