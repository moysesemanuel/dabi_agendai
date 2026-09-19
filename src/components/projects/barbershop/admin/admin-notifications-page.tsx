"use client";

import { useEffect, useState } from "react";
import styles from "@/app/admin/admin.module.css";
import { AdminButton } from "@/components/projects/barbershop/admin/admin-button";
import { AdminSidebarNav } from "@/components/projects/barbershop/admin/admin-sidebar-nav";
import { DaBiTechSignature } from "@/components/shared/dabi-tech-signature";
import { useSiteConfig } from "@/components/projects/barbershop/use-site-config";

type TelegramLinkRow = {
  id: string;
  createdAt: string;
};

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function AdminNotificationsPage({
  initialPushDeviceCount,
  initialTelegramLinks,
}: {
  initialPushDeviceCount: number;
  initialTelegramLinks: TelegramLinkRow[];
}) {
  const config = useSiteConfig();
  const [pushSupported, setPushSupported] = useState(false);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushFeedback, setPushFeedback] = useState("");

  const [telegramLinks, setTelegramLinks] = useState(initialTelegramLinks);
  const [telegramLinkUrl, setTelegramLinkUrl] = useState<string | null>(null);
  const [telegramLinkExpiresAt, setTelegramLinkExpiresAt] = useState<string | null>(null);
  const [telegramBusy, setTelegramBusy] = useState(false);
  const [telegramFeedback, setTelegramFeedback] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const supported = "serviceWorker" in navigator && "PushManager" in window;
    setPushSupported(supported);

    if (!supported) {
      return;
    }

    navigator.serviceWorker
      .getRegistration("/sw.js")
      .then((registration) => registration?.pushManager.getSubscription() ?? null)
      .then((subscription) => setPushSubscribed(Boolean(subscription)))
      .catch(() => {});
  }, []);

  async function handleEnablePush() {
    setPushBusy(true);
    setPushFeedback("");

    try {
      if (!("Notification" in window)) {
        throw new Error("Esse navegador não suporta notificações.");
      }

      const permission =
        window.Notification.permission === "granted"
          ? "granted"
          : await window.Notification.requestPermission();

      if (permission !== "granted") {
        throw new Error("Permissão de notificação negada.");
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const keyResponse = await fetch("/api/push/vapid-public-key");
      const keyPayload = (await keyResponse.json()) as { publicKey?: string; error?: string };

      if (!keyResponse.ok || !keyPayload.publicKey) {
        throw new Error(keyPayload.error ?? "Notificações push não configuradas.");
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(keyPayload.publicKey),
      });

      const subscriptionJson = subscription.toJSON();

      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: subscriptionJson.endpoint,
          keys: subscriptionJson.keys,
        }),
      });
      const payload = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Não foi possível ativar as notificações.");
      }

      setPushSubscribed(true);
      setPushFeedback("Notificações no navegador ativadas.");
    } catch (error) {
      setPushFeedback(error instanceof Error ? error.message : "Não foi possível ativar as notificações.");
    } finally {
      setPushBusy(false);
    }
  }

  async function handleDisablePush() {
    setPushBusy(true);
    setPushFeedback("");

    try {
      const registration = await navigator.serviceWorker.getRegistration("/sw.js");
      const subscription = await registration?.pushManager.getSubscription();

      if (subscription) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }

      setPushSubscribed(false);
      setPushFeedback("Notificações no navegador desativadas.");
    } catch (error) {
      setPushFeedback(
        error instanceof Error ? error.message : "Não foi possível desativar as notificações.",
      );
    } finally {
      setPushBusy(false);
    }
  }

  async function handleGenerateTelegramLink() {
    setTelegramBusy(true);
    setTelegramFeedback("");

    try {
      const response = await fetch("/api/telegram/link", { method: "POST" });
      const payload = (await response.json()) as { url?: string; expiresAt?: string; error?: string };

      if (!response.ok || !payload.url) {
        throw new Error(payload.error ?? "Não foi possível gerar o link do Telegram.");
      }

      setTelegramLinkUrl(payload.url);
      setTelegramLinkExpiresAt(payload.expiresAt ?? null);
    } catch (error) {
      setTelegramFeedback(
        error instanceof Error ? error.message : "Não foi possível gerar o link do Telegram.",
      );
    } finally {
      setTelegramBusy(false);
    }
  }

  async function handleDisconnectTelegram(id: string) {
    setTelegramFeedback("");

    try {
      const response = await fetch("/api/telegram/link", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Não foi possível desconectar.");
      }

      setTelegramLinks((current) => current.filter((link) => link.id !== id));
    } catch (error) {
      setTelegramFeedback(error instanceof Error ? error.message : "Não foi possível desconectar.");
    }
  }

  return (
    <div className={styles.adminPage}>
      <div className={styles.adminShell}>
        <aside className={styles.adminSidebar}>
          <div className={styles.sidebarBrand}>
            <strong>{config.businessName}</strong>
            <span>Painel de gestão da barbearia</span>
          </div>

          <AdminSidebarNav pathname="/admin/notificacoes" />
        </aside>

        <main className={styles.adminContent}>
          <section className={styles.adminHeader}>
            <div>
              <p className={styles.sectionEyebrow}>Notificações</p>
              <h1>Fique sabendo na hora de cada novo agendamento</h1>
              <p>
                Ative um ou os dois canais abaixo para receber um aviso assim que um cliente
                agendar um horário — funciona mesmo com o painel fechado.
              </p>
            </div>
            <div className={styles.adminHeaderActions}>
              <a className={styles.inlineNavigationLink} href="/admin">
                Voltar para visão geral
              </a>
            </div>
          </section>

          <section className={styles.contentCard}>
            <div className={styles.contentCardHeader}>
              <p className={styles.sectionEyebrow}>Navegador</p>
              <h2>Notificação no navegador (Web Push)</h2>
              <p>
                Funciona em Android e computador mesmo com o navegador fechado. No iPhone, só
                funciona se o site for adicionado à tela de início.
              </p>
            </div>

            <div className={styles.onboardingItem}>
              <span
                className={pushSubscribed ? styles.onboardingCheckDone : styles.onboardingCheck}
                aria-hidden="true"
              >
                {pushSubscribed ? "✓" : ""}
              </span>
              <div className={styles.onboardingItemBody}>
                <strong>{pushSubscribed ? "Ativado neste navegador" : "Não ativado neste navegador"}</strong>
                <p>
                  {initialPushDeviceCount} dispositivo{initialPushDeviceCount === 1 ? "" : "s"} conectado
                  {initialPushDeviceCount === 1 ? "" : "s"} no total.
                </p>
              </div>
              {pushSupported ? (
                <AdminButton
                  variant="secondary"
                  type="button"
                  disabled={pushBusy}
                  onClick={() => void (pushSubscribed ? handleDisablePush() : handleEnablePush())}
                >
                  {pushSubscribed ? "Desativar" : "Ativar"}
                </AdminButton>
              ) : null}
            </div>

            {!pushSupported ? (
              <p className={styles.inlineStatusMessage}>Esse navegador não suporta notificações push.</p>
            ) : null}
            {pushFeedback ? <p className={styles.inlineStatusMessage}>{pushFeedback}</p> : null}
          </section>

          <section className={styles.contentCard}>
            <div className={styles.contentCardHeader}>
              <p className={styles.sectionEyebrow}>Telegram</p>
              <h2>Notificação por Telegram</h2>
              <p>
                Cobre o iPhone sem precisar instalar nada como app. Gere um link, abra no Telegram e
                mande &ldquo;Iniciar&rdquo; — pronto, esse chat passa a receber os agendamentos.
              </p>
            </div>

            <AdminButton
              variant="secondary"
              type="button"
              disabled={telegramBusy}
              onClick={() => void handleGenerateTelegramLink()}
            >
              {telegramBusy ? "Gerando..." : "Gerar link de conexão"}
            </AdminButton>

            {telegramLinkUrl ? (
              <p className={styles.inlineStatusMessage}>
                <a href={telegramLinkUrl} target="_blank" rel="noopener noreferrer">
                  Abrir no Telegram
                </a>
                {telegramLinkExpiresAt
                  ? ` — expira às ${formatDateTime(telegramLinkExpiresAt)}`
                  : null}
              </p>
            ) : null}
            {telegramFeedback ? <p className={styles.inlineStatusMessage}>{telegramFeedback}</p> : null}

            {telegramLinks.length > 0 ? (
              <div className={styles.stackedList}>
                {telegramLinks.map((link) => (
                  <div className={styles.stackedListItem} key={link.id}>
                    <div className={styles.stackedListText}>
                      <strong>Chat conectado</strong>
                      <span>Desde {formatDateTime(link.createdAt)}</span>
                    </div>
                    <AdminButton
                      variant="danger"
                      type="button"
                      onClick={() => void handleDisconnectTelegram(link.id)}
                    >
                      Desconectar
                    </AdminButton>
                  </div>
                ))}
              </div>
            ) : null}
          </section>

          <footer className={styles.adminFooter}>
            <DaBiTechSignature
              containerClassName={styles.adminFooterInner}
              labelClassName={styles.adminFooterLabel}
              labelLinkClassName={styles.adminFooterLabelLink}
              logoClassName={styles.adminFooterLogo}
              linkClassName={styles.adminFooterLink}
            />
          </footer>
        </main>
      </div>
    </div>
  );
}
