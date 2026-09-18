export type PlanId = "essencial" | "completo";

export const PLANS: Record<PlanId, { name: string; amountCents: number }> = {
  essencial: { name: "Essencial", amountCents: 5900 },
  completo: { name: "Completo", amountCents: 9900 },
};

export function isPlanId(value: string): value is PlanId {
  return value === "essencial" || value === "completo";
}

export function getPlan(planId: PlanId) {
  return PLANS[planId];
}
