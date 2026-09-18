"use client";

import { useState } from "react";
import styles from "@/app/admin/admin.module.css";
import { AdminButton } from "@/components/projects/barbershop/admin/admin-button";
import type { PlanId } from "@/lib/billing/plans";

export function SubscriptionCheckoutButton({
  planId,
  planName,
  defaultEmail,
}: {
  planId: PlanId;
  planName: string;
  defaultEmail: string;
}) {
  const [email, setEmail] = useState(defaultEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, payerEmail: email }),
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
      <label htmlFor={`payer-email-${planId}`}>E-mail para cobrança ({planName})</label>
      <input
        id={`payer-email-${planId}`}
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="seu@email.com"
      />
      <AdminButton type="button" onClick={handleCheckout} disabled={loading || !email}>
        {loading ? "Abrindo checkout..." : `Assinar plano ${planName}`}
      </AdminButton>
      {error ? <p className={styles.formFieldHint}>{error}</p> : null}
    </div>
  );
}
