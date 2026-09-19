import styles from "@/app/admin/admin.module.css";

const ADMIN_NAV_ITEMS = [
  { href: "/admin", label: "Visão geral" },
  { href: "/admin/site", label: "Site" },
  { href: "/admin/catalogo", label: "Catálogo" },
  { href: "/admin/agenda", label: "Agenda" },
  { href: "/admin/dados", label: "Dados" },
  { href: "/admin/notificacoes", label: "Notificações" },
  { href: "/admin/faq", label: "FAQ" },
  { href: "/admin/suporte", label: "Suporte" },
  { href: "/admin/assinatura", label: "Assinatura" },
];

export function AdminSidebarNav({ pathname }: { pathname: string }) {
  return (
    <nav className={styles.sidebarNav}>
      {/* <a> de proposito em toda a nav do admin: navegacao client-side
          (<Link>) pode reaproveitar o layout ja renderizado (bloqueado
          ou liberado) em vez de reavaliar o gate de assinatura pro novo
          pathname a cada troca de pagina. */}
      {ADMIN_NAV_ITEMS.map((item) => (
        <a
          key={item.href}
          className={pathname === item.href ? styles.sidebarNavLinkActive : ""}
          href={item.href}
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}
