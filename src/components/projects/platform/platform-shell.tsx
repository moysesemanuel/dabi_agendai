"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import styles from "./platform-shell.module.css";

export const PLATFORM_NOTIFICATIONS_UPDATED_EVENT = "dabi-platform-notifications-updated";

const navItems = [
  { href: "/platform", label: "Tenants" },
  { href: "/platform/notificacoes", label: "Notificações" },
];

type NotificationSummary = { read: boolean };

export function PlatformShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadUnreadCount() {
      try {
        const response = await fetch("/api/platform/notifications", { cache: "no-store" });
        const payload = (await response.json()) as { notifications?: NotificationSummary[] };

        if (active) {
          setUnreadCount((payload.notifications ?? []).filter((n) => !n.read).length);
        }
      } catch {
        if (active) {
          setUnreadCount(0);
        }
      }
    }

    void loadUnreadCount();
    window.addEventListener(PLATFORM_NOTIFICATIONS_UPDATED_EVENT, loadUnreadCount);

    return () => {
      active = false;
      window.removeEventListener(PLATFORM_NOTIFICATIONS_UPDATED_EVENT, loadUnreadCount);
    };
  }, []);

  async function handleLogout() {
    await fetch("/api/platform/session", { method: "DELETE" });
    router.push("/platform/login");
    router.refresh();
  }

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.eyebrow}>DaBi Tech</span>
          <strong>Admin da plataforma</strong>
        </div>

        <nav className={styles.nav}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              className={pathname === item.href ? styles.navLinkActive : styles.navLink}
              href={item.href}
            >
              {item.label}
              {item.href === "/platform/notificacoes" && unreadCount > 0 ? (
                <span className={styles.navBadge}>{unreadCount > 99 ? "99+" : unreadCount}</span>
              ) : null}
            </Link>
          ))}
        </nav>

        <button className={styles.logoutButton} onClick={() => void handleLogout()} type="button">
          Sair
        </button>
      </aside>

      <main className={styles.content}>{children}</main>
    </div>
  );
}
