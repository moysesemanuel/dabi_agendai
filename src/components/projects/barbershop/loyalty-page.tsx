"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import styles from "./loyalty-page.module.css";
import {
  CUSTOMER_SESSION_EVENT,
  readCustomerSession,
  type CustomerSession,
  writeCustomerSession,
} from "./customer-session";
import { FooterSection, Header } from "./home-page";
import {
  fetchLoyalty,
  getLoyaltyProgress,
  type LoyaltyResponse,
} from "./loyalty";
import { useSiteConfig } from "./use-site-config";

export function LoyaltyPage() {
  const config = useSiteConfig();
  const [customerSession, setCustomerSession] = useState<CustomerSession | null>(null);
  const [loyalty, setLoyalty] = useState<LoyaltyResponse | null>(null);
  const [loyaltyError, setLoyaltyError] = useState("");

  useEffect(() => {
    function syncCustomerSession() {
      const nextSession = readCustomerSession();
      setCustomerSession(nextSession);

      if (!nextSession) {
        setLoyalty(null);
        setLoyaltyError("");
      }
    }

    syncCustomerSession();
    window.addEventListener(CUSTOMER_SESSION_EVENT, syncCustomerSession);

    return () => {
      window.removeEventListener(CUSTOMER_SESSION_EVENT, syncCustomerSession);
    };
  }, []);

  useEffect(() => {
    if (!customerSession) {
      return;
    }

    const customerId = customerSession.id;
    let active = true;

    async function loadLoyalty() {
      try {
        const payload = await fetchLoyalty(customerId);

        if (active) {
          setLoyalty(payload);
          setLoyaltyError("");
        }
      } catch (error) {
        if (active) {
          setLoyalty(null);
          setLoyaltyError(
            error instanceof Error ? error.message : "Nao foi possivel consultar sua fidelidade.",
          );
        }
      }
    }

    void loadLoyalty();

    return () => {
      active = false;
    };
  }, [customerSession]);

  const points = loyalty?.points ?? 0;
  const progress = useMemo(() => getLoyaltyProgress(points, config.loyaltyTiers), [config.loyaltyTiers, points]);
  const loyaltyMessage = customerSession
    ? loyaltyError
    : "Faça login para acompanhar sua fidelidade e seus resgates.";

  return (
    <div className={styles.page}>
      <section className={styles.heroShell}>
        <Header
          config={config}
          homeLinks
          profileHref="/fidelidade"
          profileTitle={customerSession ? `Perfil de ${customerSession.name}` : "Acesso do cliente"}
          profileName={customerSession?.name}
          profileSubtitle={customerSession?.email || customerSession?.phone}
          profilePoints={points}
          profileRole={customerSession?.role}
          onProfileLogout={() => {
            writeCustomerSession(null);
            setCustomerSession(null);
          }}
        />

        <main className={styles.main}>
          <section className={styles.introCard}>
            <span className={styles.eyebrow}>Fidelidade</span>
            <h1>Seu progresso no clube de recompensas do studio.</h1>
            <p>
              A cada atendimento concluído, você acumula pontos e sobe de nível. Quanto maior o nível,
              mais vantagens você libera para as próximas visitas.
            </p>
          </section>

          {customerSession ? (
            <section className={styles.overviewGrid}>
              <article className={styles.overviewCard}>
                <div className={styles.pointsHeader}>
                  <div className={styles.pointsValue}>
                    <span className={styles.eyebrow}>Pontos atuais</span>
                    <strong>{points} pts</strong>
                  </div>
                  <span
                    className={styles.levelBadge}
                    style={{ backgroundColor: progress.currentTier.accent }}
                  >
                    Nível {progress.currentTier.name}
                  </span>
                </div>

                <div className={styles.progressBlock}>
                  <div className={styles.progressTrack}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${progress.progressPercent}%` }}
                    />
                  </div>
                  <div className={styles.progressMeta}>
                    <span>
                      {progress.currentTier.name}
                      {progress.nextTier ? ` → ${progress.nextTier.name}` : " máximo"}
                    </span>
                    <span>
                      {progress.nextTier
                        ? `${progress.pointsNeededForNextTier} pts para subir de nível`
                        : "Você já está no nível máximo"}
                    </span>
                  </div>
                </div>

                <p className={styles.metaText}>
                  {loyaltyMessage ||
                    `Você já concluiu ${loyalty?.completedAppointments ?? 0} atendimento${loyalty?.completedAppointments === 1 ? "" : "s"} válido${loyalty?.completedAppointments === 1 ? "" : "s"} na sua fidelidade.`}
                </p>
              </article>

              <article className={styles.overviewCard}>
                <div className={styles.overviewStats}>
                  <div className={styles.statCard}>
                    <span>Próxima meta</span>
                    <strong>
                      {progress.nextTier ? `${progress.nextTier.minPoints} pts` : "Meta máxima"}
                    </strong>
                  </div>
                  <div className={styles.statCard}>
                    <span>Faltam</span>
                    <strong>{progress.pointsNeededForNextTier} pts</strong>
                  </div>
                  <div className={styles.statCard}>
                    <span>Próximo resgate</span>
                    <strong>{loyalty?.nextRewardIn ?? 0} pts</strong>
                  </div>
                  <div className={styles.statCard}>
                    <span>Nível atual</span>
                    <strong>{progress.currentTier.name}</strong>
                  </div>
                </div>
              </article>
            </section>
          ) : null}
        </main>
      </section>

      <section className={styles.emptySection}>
        <div className={styles.content}>
          {customerSession ? (
            <>
              <div className={styles.sectionHeading}>
                <span className={styles.eyebrow}>Resgates</span>
                <h2>O que você pode fazer com seus pontos.</h2>
                <p>
                  Use sua fidelidade para liberar upgrades, descontos e experiências extras no studio.
                </p>
              </div>

              <div className={styles.rewardsGrid}>
                {config.loyaltyRewards.map((reward) => (
                  <article className={styles.rewardCard} key={reward.points}>
                    <span className={styles.rewardPoints}>{reward.points} pts</span>
                    <strong>{reward.title}</strong>
                    <p>{reward.description}</p>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <div className={styles.emptyCard}>
              <strong>Faça login para acompanhar sua fidelidade.</strong>
              <p>{loyaltyMessage}</p>
              <div className={styles.emptyActions}>
                <Link className={styles.primaryButton} href="/agendamento">
                  Ir para agendamento
                </Link>
                <Link className={styles.secondaryButton} href="/">
                  Voltar para home
                </Link>
              </div>
            </div>
          )}

          <FooterSection />
        </div>
      </section>
    </div>
  );
}
