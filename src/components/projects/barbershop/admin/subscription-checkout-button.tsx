"use client";

import { useState } from "react";
import styles from "@/app/admin/admin.module.css";
import { AdminButton } from "@/components/projects/barbershop/admin/admin-button";
import type { PlanId } from "@/lib/billing/plans";

export function SubscriptionCheckoutButton({
  planId,
  planName,
  payerEmail,
}: {
  planId: PlanId;
  planName: string;
  payerEmail: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, payerEmail }),
      });

      const payload = (await response.json()) as { initPoint?: string; error?: string };

      if (!response.ok || !payload.initPoint) {
        setError(payload.error ?? "Nao foi possivel iniciar o checkout.");
        setLoading(false);
        return;
      }

      window.location.href = payload.initPoint;
    } catch {
      setError("Nao foi possivel conectar ao Mercado Pago.");
      setLoading(false);
    }
  }

  return (
    <div className={styles.formField}>
      <AdminButton type="button" onClick={handleCheckout} disabled={loading}>
        {loading ? "Abrindo checkout..." : `Assinar plano ${planName}`}
      </AdminButton>
      {error ? <p className={styles.formFieldHint}>{error}</p> : null}
    </div>
  );
}
