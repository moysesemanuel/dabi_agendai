"use client";

export const BOOKING_CART_STORAGE_KEY = "dabi-agendai-booking-cart";
export const BOOKING_CART_EVENT = "dabi-agendai-booking-cart-change";

function readStorageList<T>(storageKey: string) {
  if (typeof window === "undefined") {
    return [] as T[];
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [] as T[];
  }
}

function writeStorageList<T>(storageKey: string, eventName: string, items: T[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(storageKey, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(eventName));
}

export function readBookingCart<T>() {
  return readStorageList<T>(BOOKING_CART_STORAGE_KEY);
}

export function writeBookingCart<T>(items: T[]) {
  writeStorageList(BOOKING_CART_STORAGE_KEY, BOOKING_CART_EVENT, items);
}

export function getTotalCartCount() {
  return readBookingCart<unknown>().length;
}
