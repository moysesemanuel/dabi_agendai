"use client";

export const REVIEW_STORAGE_KEY = "dabi-agendai-customer-reviews";

export type StoredReview = {
  name: string;
  quote: string;
  rating?: number;
  source?: string;
};

export function readCustomerReviews() {
  if (typeof window === "undefined") {
    return [] as StoredReview[];
  }

  try {
    const raw = window.localStorage.getItem(REVIEW_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredReview[]) : [];
  } catch {
    return [];
  }
}

export function writeCustomerReviews(items: StoredReview[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(items));
}
