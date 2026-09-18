import { headers } from "next/headers";
import Link from "next/link";
import { SubscriptionStatus } from "@prisma/client";
import styles from "@/app/admin/admin.module.css";
import { getCurrentTenant } from "@/lib/tenant";
import { getTenantSubscription } from "@/lib/billing/subscription-service";

const SUBSCRIPTION_PAGE_PATH = "/admin/assinatura";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = (await headers()).get("x-pathname") ?? "";

  if (pathname === SUBSCRIPTION_PAGE_PATH) {
    return children;
  }

  const tenant = await getCurrentTenant();

  if (!tenant) {
    return children;
  }

  const subscription = await getTenantSubscription(tenant.id);

  // Sem linha de assinatura = tenant criado antes desse recurso existir - nao
  // bloqueia retroativamente quem ja usava o sistema sem esse conceito. Todo
  // tenant novo a partir de agora ja nasce com uma assinatura "pending" (ver
  // scripts/create-tenant.ts), entao o gate vale pra eles desde o primeiro dia.
  if (!subscription || subscription.status === SubscriptionStatus.ACTIVE) {
    return children;
  }

  return (
    <div className={styles.adminPage}>
      <div className={styles.adminShell}>
        <main className={styles.adminContent}>
          <section className={styles.contentCard}>
            <div className={styles.contentCardHeader}>
              <p className={styles.sectionEyebrow}>Assinatura</p>
              <h1>Assinatura pendente</h1>
              <p>
                O acesso ao painel administrativo do DaBi Agendaí está pausado porque a
                assinatura mensal não está ativa. Regularize o pagamento para voltar a usar o
                sistema.
              </p>
            </div>
            <Link className={styles.buttonPrimary} href={SUBSCRIPTION_PAGE_PATH}>
              Ver assinatura
            </Link>
          </section>
        </main>
      </div>
    </div>
  );
}
