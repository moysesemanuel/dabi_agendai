"use client";

import { useState } from "react";
import { Space_Grotesk } from "next/font/google";
import { DaBiTechLogo } from "@/components/shared/dabi-tech-logo";
import type { PlanId } from "@/lib/billing/plans";
import { PLANS } from "@/lib/billing/plans";
import styles from "./subscribe-form.module.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-display-marketing",
});

function formatCurrency(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function SubscribeForm({ initialPlanId }: { initialPlanId: PlanId }) {
  const [planId, setPlanId] = useState<PlanId>(initialPlanId);
  const [businessName, setBusinessName] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPhone, setAdminPhone] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!termsAccepted) {
      setError("Confirme que leu e concorda com os Termos de Uso e a Política de Privacidade.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/public/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName, adminName, adminEmail, adminPhone, adminPassword, planId }),
      });

      const payload = (await response.json()) as { initPoint?: string; error?: string };

      if (!response.ok || !payload.initPoint) {
        setError(payload.error ?? "Não foi possível concluir o cadastro.");
        setLoading(false);
        return;
      }

      window.location.href = payload.initPoint;
    } catch {
      setError("Não foi possível conectar ao servidor.");
      setLoading(false);
    }
  }

  return (
    <div className={`${styles.page} ${spaceGrotesk.variable}`}>
      <div className={styles.card}>
        <DaBiTechLogo className={styles.logo} />
        <h1 className={styles.title}>Assine o DaBi Agendaí</h1>
        <p className={styles.subtitle}>
          Cadastre sua barbearia e finalize o pagamento no Mercado Pago — seu painel fica pronto
          assim que a assinatura é confirmada.
        </p>

        <div className={styles.planPicker}>
          {(Object.entries(PLANS) as [PlanId, (typeof PLANS)[PlanId]][]).map(([id, plan]) => (
            <button
              key={id}
              type="button"
              className={id === planId ? `${styles.planOption} ${styles.planOptionActive}` : styles.planOption}
              onClick={() => setPlanId(id)}
            >
              <span className={styles.planOptionName}>{plan.name}</span>
              <span className={styles.planOptionPrice}>{formatCurrency(plan.amountCents)}/mês</span>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label htmlFor="businessName">Nome da barbearia</label>
            <input
              id="businessName"
              required
              value={businessName}
              onChange={(event) => setBusinessName(event.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="adminName">Seu nome</label>
            <input id="adminName" required value={adminName} onChange={(event) => setAdminName(event.target.value)} />
          </div>
          <div className={styles.field}>
            <label htmlFor="adminEmail">Seu e-mail</label>
            <input
              id="adminEmail"
              type="email"
              required
              value={adminEmail}
              onChange={(event) => setAdminEmail(event.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="adminPhone">Seu WhatsApp</label>
            <input
              id="adminPhone"
              required
              placeholder="41999999999"
              value={adminPhone}
              onChange={(event) => setAdminPhone(event.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="adminPassword">Crie uma senha</label>
            <input
              id="adminPassword"
              type="password"
              required
              minLength={6}
              value={adminPassword}
              onChange={(event) => setAdminPassword(event.target.value)}
            />
          </div>

          <label className={styles.consentField}>
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(event) => setTermsAccepted(event.target.checked)}
            />
            <span>
              Li e concordo com os{" "}
              <a href="/termos-de-uso" target="_blank" rel="noreferrer">
                Termos de Uso
              </a>{" "}
              e a{" "}
              <a href="/privacidade" target="_blank" rel="noreferrer">
                Política de Privacidade
              </a>
              .
            </span>
          </label>

          {error ? <p className={styles.error}>{error}</p> : null}

          <button className={styles.submit} type="submit" disabled={loading}>
            {loading ? "Preparando checkout..." : "Ir para o pagamento"}
          </button>
        </form>

        <p className={styles.hint}>
          Prefere falar com a gente antes? Chama no WhatsApp pela página de planos.
        </p>
      </div>
    </div>
  );
}
