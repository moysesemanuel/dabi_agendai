"use client";

import { useEffect, useState } from "react";
import styles from "./platform-notifications-page.module.css";

type Notification = {
  id: string;
  type: "SUPPORT" | "SYSTEM";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  tenantName: string | null;
};

function formatDateTime(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function PlatformNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function loadNotifications() {
    setIsLoading(true);

    try {
      const response = await fetch("/api/platform/notifications", { cache: "no-store" });
      const payload = (await response.json()) as { notifications?: Notification[] };
      setNotifications(payload.notifications ?? []);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadNotifications();
  }, []);

  async function toggleRead(notification: Notification) {
    setUpdatingId(notification.id);

    try {
      await fetch(`/api/platform/notifications/${notification.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: !notification.read }),
      });
      await loadNotifications();
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Notificações</h1>
        <p>Pedidos de suporte dos tenants e eventos automáticos da plataforma.</p>
      </div>

      {isLoading ? (
        <p className={styles.empty}>Carregando...</p>
      ) : notifications.length === 0 ? (
        <p className={styles.empty}>Nenhuma notificação ainda.</p>
      ) : (
        <div className={styles.list}>
          {notifications.map((notification) => (
            <article
              className={`${styles.item} ${!notification.read ? styles.itemUnread : ""}`}
              key={notification.id}
            >
              <div className={styles.itemTop}>
                <div className={styles.itemMeta}>
                  <span
                    className={`${styles.typeBadge} ${
                      notification.type === "SUPPORT" ? styles.typeSupport : styles.typeSystem
                    }`}
                  >
                    {notification.type === "SUPPORT" ? "Suporte" : "Sistema"}
                  </span>
                  {notification.tenantName ? (
                    <span className={styles.tenantTag}>{notification.tenantName}</span>
                  ) : null}
                  <span className={styles.date}>{formatDateTime(notification.createdAt)}</span>
                </div>
                <button
                  className={styles.readButton}
                  disabled={updatingId === notification.id}
                  onClick={() => void toggleRead(notification)}
                  type="button"
                >
                  {notification.read ? "Marcar como não lida" : "Marcar como lida"}
                </button>
              </div>
              <div className={styles.title}>{notification.title}</div>
              <div className={styles.message}>{notification.message}</div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
