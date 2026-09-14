"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import styles from "./platform-shell.module.css";

const navItems = [
  { href: "/platform", label: "Tenants" },
  { href: "/platform/notificacoes", label: "Notificações" },
];

export function PlatformShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

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
