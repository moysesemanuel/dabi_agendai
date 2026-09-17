"use client";

import Link from "next/link";
import styles from "@/app/admin/admin.module.css";
import { AdminButton } from "@/components/projects/barbershop/admin/admin-button";
import { DaBiTechSignature } from "@/components/shared/dabi-tech-signature";
import { AdminCatalogSection } from "./admin-catalog-section";
import { AdminOverlays } from "./admin-overlays";
import { AdminScheduleSection } from "./admin-schedule-section";
import { AdminSiteSection } from "./admin-site-section";
import { type AdminSectionView } from "./admin-types";
import { useAdminPageState } from "./use-admin-page-state";

export function AdminPage({ section = "overview" }: { section?: AdminSectionView }) {
  const state = useAdminPageState(section);
  const {
    pathname,
    config,
    savingSync,
    statusMessage,
    notificationsEnabled,
    soundAlertsEnabled,
    notificationFeedback,
    enableBrowserNotifications,
    toggleSoundAlerts,
    saveChanges,
    openPublicSite,
    displayStats,
    currentPage,
    showSiteSections,
    showCatalogSections,
    showScheduleSections,
    showOverview,
    showSaveAction,
  } = state;

  return (
    <div className={styles.adminPage}>
      <div className={styles.adminShell}>
        <aside className={styles.adminSidebar}>
          <div className={styles.sidebarBrand}>
            <strong>Prime Cut Admin</strong>
            <span>Painel de gestão da barbearia</span>
          </div>

          <nav className={styles.sidebarNav}>
            <Link className={pathname === "/admin" ? styles.sidebarNavLinkActive : ""} href="/admin">
              Visão geral
            </Link>
            <Link className={pathname === "/admin/site" ? styles.sidebarNavLinkActive : ""} href="/admin/site">
              Site
            </Link>
            <Link className={pathname === "/admin/catalogo" ? styles.sidebarNavLinkActive : ""} href="/admin/catalogo">
              Catálogo
            </Link>
            <Link className={pathname === "/admin/agenda" ? styles.sidebarNavLinkActive : ""} href="/admin/agenda">
              Agenda
            </Link>
            <Link className={pathname === "/admin/dados" ? styles.sidebarNavLinkActive : ""} href="/admin/dados">
              Dados
            </Link>
            <Link href="/admin/suporte">Suporte</Link>
          </nav>

          <div className={styles.sidebarStats}>
            <div>
              <div className={styles.sidebarMetaLabel}>Slots padrão</div>
              <div className={styles.sidebarMetaValue}>{config.availableTimes.join(" · ")}</div>
            </div>
            <div>
              <div className={styles.sidebarMetaLabel}>Planos do clube</div>
              <div className={styles.sidebarMetaValue}>{config.plans.length} planos ativos</div>
            </div>
          </div>
        </aside>

        <main className={styles.adminContent}>
          <section className={styles.adminHeader} id="visao-geral">
            <div>
              <p className={styles.sectionEyebrow}>{currentPage.eyebrow}</p>
              <h1>{currentPage.title}</h1>
              <p>{currentPage.description}</p>
            </div>
            <div className={styles.adminHeaderActions}>
              <AdminButton variant="secondary" type="button" onClick={openPublicSite}>
                Ver site público
              </AdminButton>
              <AdminButton variant="secondary" type="button" onClick={toggleSoundAlerts}>
                {soundAlertsEnabled ? "Som ativo" : "Ativar som"}
              </AdminButton>
              <AdminButton
                variant="secondary"
                type="button"
                onClick={() => void enableBrowserNotifications()}
              >
                {notificationsEnabled ? "Alertas ativos" : "Ativar alertas"}
              </AdminButton>
            </div>
          </section>

          {notificationFeedback ? (
            <p className={styles.inlineStatusMessage}>{notificationFeedback}</p>
          ) : null}

          <section className={styles.summaryMetricsGrid}>
            {displayStats.map((item) => (
              <article className={styles.summaryMetricCard} key={item.label}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </article>
            ))}
          </section>

          <div className={styles.adminSections}>
            {showOverview ? (
              <section className={styles.quickLinksGrid}>
                <article className={styles.contentCard}>
                  <div className={styles.contentCardHeader}>
                    <p className={styles.sectionEyebrow}>Site</p>
                    <h2>Conteúdo e fidelidade</h2>
                    <p>Textos do negócio, indicadores da home, níveis e recompensas.</p>
                  </div>
                  <Link className={styles.inlineNavigationLink} href="/admin/site">
                    Abrir configurações do site
                  </Link>
                </article>
                <article className={styles.contentCard}>
                  <div className={styles.contentCardHeader}>
                    <p className={styles.sectionEyebrow}>Catálogo</p>
                    <h2>Serviços, imagens e equipe</h2>
                    <p>Catálogo público, galeria do site e barbeiros cadastrados.</p>
                  </div>
                  <Link className={styles.inlineNavigationLink} href="/admin/catalogo">
                    Abrir catálogo e equipe
                  </Link>
                </article>
                <article className={styles.contentCard}>
                  <div className={styles.contentCardHeader}>
                    <p className={styles.sectionEyebrow}>Agenda</p>
                    <h2>Operação do dia</h2>
                    <p>Bloqueios, encaixes manuais, calendário e agendamentos reais.</p>
                  </div>
                  <Link className={styles.inlineNavigationLink} href="/admin/agenda">
                    Abrir agenda
                  </Link>
                </article>
                <article className={styles.contentCard}>
                  <div className={styles.contentCardHeader}>
                    <p className={styles.sectionEyebrow}>Dados</p>
                    <h2>Clientes e desempenho</h2>
                    <p>Clientes, fidelidade, receita diária e dados para o futuro dashboard.</p>
                  </div>
                  <Link className={styles.inlineNavigationLink} href="/admin/dados">
                    Abrir dados
                  </Link>
                </article>
              </section>
            ) : null}

            {showSiteSections ? <AdminSiteSection state={state} /> : null}

            {showCatalogSections ? <AdminCatalogSection state={state} /> : null}

            {showScheduleSections ? <AdminScheduleSection state={state} /> : null}
          </div>

          {showSaveAction ? (
            <div className={styles.adminSaveBar}>
              <p className={styles.saveStatusMessage}>{statusMessage}</p>
              <AdminButton variant="primary" type="button" onClick={() => void saveChanges()}>
                {savingSync ? "Salvando..." : "Salvar alterações"}
              </AdminButton>
            </div>
          ) : null}

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

      <AdminOverlays state={state} />
    </div>
  );
}
