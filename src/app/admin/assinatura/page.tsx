import { notFound } from "next/navigation";
import { SubscriptionStatus } from "@prisma/client";
import styles from "@/app/admin/admin.module.css";
import { DaBiTechSignature } from "@/components/shared/dabi-tech-signature";
import { SubscriptionCheckoutButton } from "@/components/projects/barbershop/admin/subscription-checkout-button";
import { prisma } from "@/lib/prisma";
import { getCurrentTenant } from "@/lib/tenant";
import { getTenantSubscription } from "@/lib/billing/subscription-service";
import { PLANS } from "@/lib/billing/plans";

export const dynamic = "force-dynamic";

const statusLabels: Record<SubscriptionStatus, string> = {
  [SubscriptionStatus.PENDING]: "Aguardando pagamento",
  [SubscriptionStatus.ACTIVE]: "Ativa",
  [SubscriptionStatus.PAUSED]: "Pausada",
  [SubscriptionStatus.CANCELED]: "Cancelada",
};

function formatCurrency(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(date: Date | null) {
  if (!date) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

export default async function Page() {
  const tenant = await getCurrentTenant();

  if (!tenant) {
    notFound();
  }

  const [subscription, admin] = await Promise.all([
    getTenantSubscription(tenant.id),
    prisma.customer.findFirst({ where: { tenantId: tenant.id, role: "ADMIN" } }),
  ]);

  const isActive = subscription?.status === SubscriptionStatus.ACTIVE;

  return (
    <div className={styles.adminPage}>
      <div className={styles.adminShell}>
        <aside className={styles.adminSidebar}>
          <div className={styles.sidebarBrand}>
            <strong>{tenant.name}</strong>
            <span>Painel de gestão da barbearia</span>
          </div>

          <nav className={styles.sidebarNav}>
            {/* <a> de proposito: ver nota em admin-page.tsx sobre navegacao
                client-side reaproveitando o gate de assinatura desatualizado. */}
            <a href="/admin">Visão geral</a>
            <a href="/admin/site">Site</a>
            <a href="/admin/catalogo">Catálogo</a>
            <a href="/admin/agenda">Agenda</a>
            <a href="/admin/dados">Dados</a>
            <a href="/admin/suporte">Suporte</a>
            <a className={styles.sidebarNavLinkActive} href="/admin/assinatura">
              Assinatura
            </a>
          </nav>
        </aside>

        <main className={styles.adminContent}>
          <section className={styles.adminHeader}>
            <div>
              <p className={styles.sectionEyebrow}>Cobrança</p>
              <h1>Assinatura do DaBi Agendaí</h1>
              <p>Gerencie o plano e o pagamento mensal de acesso ao sistema.</p>
            </div>
            <div className={styles.adminHeaderActions}>
              <a className={styles.inlineNavigationLink} href="/admin">
                Voltar para visão geral
              </a>
            </div>
          </section>

          <div className={styles.adminSections}>
            <section className={styles.contentCard}>
              <div className={styles.contentCardHeader}>
                <p className={styles.sectionEyebrow}>Status atual</p>
                <h2>{subscription ? `Plano ${PLANS[subscription.planId as keyof typeof PLANS]?.name ?? subscription.planId}` : "Sem assinatura"}</h2>
              </div>

              {subscription ? (
                <ul className={styles.summaryChecklist}>
                  <li>Status: {statusLabels[subscription.status]}</li>
                  <li>Valor: {formatCurrency(subscription.amountCents)}/mês</li>
                  {isActive ? <li>Próxima cobrança: {formatDate(subscription.currentPeriodEnd)}</li> : null}
                </ul>
              ) : (
                <p>Nenhuma assinatura iniciada ainda. Escolha um plano abaixo para ativar o acesso.</p>
              )}
            </section>

            {!isActive && subscription ? (
              <section className={styles.contentCard}>
                <div className={styles.contentCardHeader}>
                  <p className={styles.sectionEyebrow}>Pagamento</p>
                  <h2>Ativar plano {PLANS[subscription.planId as keyof typeof PLANS]?.name ?? subscription.planId}</h2>
                  <p>
                    Você será redirecionado ao Mercado Pago para escolher a forma de pagamento
                    (Pix, cartão ou boleto) e autorizar a cobrança mensal recorrente.
                  </p>
                </div>

                {admin?.email ? (
                  <div className={styles.formFieldsGrid}>
                    <SubscriptionCheckoutButton
                      planId={subscription.planId as keyof typeof PLANS}
                      planName={PLANS[subscription.planId as keyof typeof PLANS]?.name ?? subscription.planId}
                      payerEmail={admin.email}
                    />
                  </div>
                ) : (
                  <p>Cadastre um e-mail no seu usuário admin para liberar o pagamento.</p>
                )}
              </section>
            ) : null}

            {!isActive && !subscription ? (
              <section className={styles.contentCard}>
                <div className={styles.contentCardHeader}>
                  <p className={styles.sectionEyebrow}>Plano não definido</p>
                  <h2>Fale com a DaBi Tech pra ativar sua assinatura</h2>
                  <p>Entre em contato com a DaBi Tech para escolher um plano e liberar a cobrança.</p>
                </div>
              </section>
            ) : null}
          </div>

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
