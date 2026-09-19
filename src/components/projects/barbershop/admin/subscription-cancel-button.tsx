"use client";

import { useState } from "react";
import styles from "@/app/admin/admin.module.css";
import { AdminButton } from "@/components/projects/barbershop/admin/admin-button";

export function SubscriptionCancelButton({ periodEndLabel }: { periodEndLabel: string }) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canceled, setCanceled] = useState(false);

  async function handleConfirmCancel() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/billing/subscriptions/cancel", { method: "POST" });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Nao foi possivel cancelar a assinatura.");
      }

      setCanceled(true);
      setConfirming(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel cancelar a assinatura.");
    } finally {
      setLoading(false);
    }
  }

  if (canceled) {
    return (
      <p className={styles.inlineStatusMessage}>
        Assinatura cancelada. Seu acesso continua liberado até {periodEndLabel} — recarregue a
        página pra ver o status atualizado.
      </p>
    );
  }

  if (!confirming) {
    return (
      <AdminButton variant="danger" type="button" onClick={() => setConfirming(true)}>
        Cancelar assinatura
      </AdminButton>
    );
  }

  return (
    <div className={styles.formField}>
      <p className={styles.formFieldHint}>
        Confirma o cancelamento? A cobrança recorrente para imediatamente no Mercado Pago e não
        pode ser revertida — pra voltar, você precisaria assinar de novo. Seu acesso ao painel
        continua liberado até {periodEndLabel}.
      </p>
      <div className={styles.dialogActions}>
        <AdminButton variant="secondary" type="button" onClick={() => setConfirming(false)} disabled={loading}>
          Voltar
        </AdminButton>
        <AdminButton variant="danger" type="button" onClick={() => void handleConfirmCancel()} disabled={loading}>
          {loading ? "Cancelando..." : "Sim, cancelar assinatura"}
        </AdminButton>
      </div>
      {error ? <p className={styles.formFieldHint}>{error}</p> : null}
    </div>
  );
}
