"use client";

import { type LoyaltyTierItem } from "@/components/shared/site-config";

export type LoyaltyResponse = {
  points: number;
  completedAppointments: number;
  availablePoints: number;
  redeemedPoints: number;
  nextRewardIn: number;
  error?: string;
};

export const defaultLoyaltyTiers: LoyaltyTierItem[] = [
  { name: "Bronze", minPoints: 0, maxPoints: 99, accent: "#b3835a" },
  { name: "Silver", minPoints: 100, maxPoints: 249, accent: "#b8c0cc" },
  { name: "Gold", minPoints: 250, maxPoints: 499, accent: "#d6aa4d" },
  { name: "Black", minPoints: 500, maxPoints: null, accent: "#1f1712" },
];

function normalizeTiers(tiers: LoyaltyTierItem[]) {
  return [...tiers].sort((left, right) => left.minPoints - right.minPoints);
}

export function getLoyaltyTier(points: number, tiers: LoyaltyTierItem[] = defaultLoyaltyTiers) {
  const orderedTiers = normalizeTiers(tiers);

  return (
    orderedTiers.find((tier) => {
      if (tier.maxPoints === null) {
        return points >= tier.minPoints;
      }

      return points >= tier.minPoints && points <= tier.maxPoints;
    }) ?? orderedTiers[0]
  );
}

export function getNextLoyaltyTier(
  points: number,
  tiers: LoyaltyTierItem[] = defaultLoyaltyTiers,
) {
  return normalizeTiers(tiers).find((tier) => tier.minPoints > points) ?? null;
}

export function getLoyaltyProgress(
  points: number,
  tiers: LoyaltyTierItem[] = defaultLoyaltyTiers,
) {
  const orderedTiers = normalizeTiers(tiers);
  const currentTier = getLoyaltyTier(points, orderedTiers);
  const nextTier = getNextLoyaltyTier(points, orderedTiers);

  if (!nextTier) {
    return {
      currentTier,
      nextTier: null,
      progressPercent: 100,
      pointsInCurrentTier: points - currentTier.minPoints,
      pointsNeededForNextTier: 0,
    };
  }

  const tierRange = nextTier.minPoints - currentTier.minPoints;
  const progress = points - currentTier.minPoints;

  return {
    currentTier,
    nextTier,
    progressPercent: Math.max(0, Math.min(100, Math.round((progress / tierRange) * 100))),
    pointsInCurrentTier: progress,
    pointsNeededForNextTier: nextTier.minPoints - points,
  };
}

export async function fetchLoyalty(customerId: string) {
  const response = await fetch(
    `/api/customers/loyalty?customerId=${encodeURIComponent(customerId)}`,
    { cache: "no-store" },
  );
  const payload = (await response.json()) as LoyaltyResponse;

  if (!response.ok) {
    throw new Error(payload.error ?? "Nao foi possivel consultar sua fidelidade.");
  }

  return payload;
}

export async function redeemLoyaltyReward(params: {
  customerId: string;
  points: number;
  rewardTitle: string;
}) {
  const response = await fetch("/api/customers/loyalty/redeem", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  const payload = (await response.json()) as LoyaltyResponse & { message?: string };

  if (!response.ok) {
    throw new Error(payload.error ?? "Nao foi possivel confirmar o resgate.");
  }

  return payload;
}
