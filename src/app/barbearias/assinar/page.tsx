import type { Metadata } from "next";
import { SubscribeForm } from "@/components/projects/dabi-tech/subscribe-form";
import { isPlanId } from "@/lib/billing/plans";

export const metadata: Metadata = {
  title: "Assinar — DaBi Agendaí",
  robots: { index: false, follow: false },
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ plano?: string }>;
}) {
  const { plano } = await searchParams;
  const initialPlanId = plano && isPlanId(plano) ? plano : "essencial";

  return <SubscribeForm initialPlanId={initialPlanId} />;
}
