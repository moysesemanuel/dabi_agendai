import { notFound } from "next/navigation";
import { AppointmentStatus } from "@prisma/client";
import styles from "@/app/admin/admin.module.css";
import { DaBiTechSignature } from "@/components/shared/dabi-tech-signature";
import { prisma } from "@/lib/prisma";
import { getCurrentTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

function formatCurrency(valueInCents: number) {
  return (valueInCents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDate(date: Date | null) {
  if (!date) {
    return "Sem histórico";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(date);
}

export default async function Page() {
  const tenant = await getCurrentTenant();

  if (!tenant) {
    notFound();
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const [customers, activeBarbers, nonCancelledAppointments] = await Promise.all([
    prisma.customer.findMany({
      where: { tenantId: tenant.id },
      include: {
        appointments: {
          where: {
            status: {
              not: AppointmentStatus.CANCELLED,
            },
          },
          include: {
            service: true,
          },
          orderBy: {
            startsAt: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.barber.count({
      where: {
        tenantId: tenant.id,
        active: true,
      },
    }),
    prisma.appointment.findMany({
      where: {
        tenantId: tenant.id,
        status: {
          not: AppointmentStatus.CANCELLED,
        },
      },
      include: {
        service: true,
        barber: true,
      },
      orderBy: {
        startsAt: "desc",
      },
    }),
  ]);

  const appointmentsToday = nonCancelledAppointments.filter(
    (appointment) => appointment.startsAt >= todayStart && appointment.startsAt <= todayEnd,
  );
  const appointmentsMonth = nonCancelledAppointments.filter(
    (appointment) => appointment.startsAt >= monthStart && appointment.startsAt <= monthEnd,
  );

  const revenueToday = appointmentsToday.reduce(
    (sum, appointment) => sum + appointment.service.priceInCents,
    0,
  );
  const revenueMonth = appointmentsMonth.reduce(
    (sum, appointment) => sum + appointment.service.priceInCents,
    0,
  );
  const averageTicket =
    appointmentsMonth.length > 0 ? Math.round(revenueMonth / appointmentsMonth.length) : 0;

  const customerRows = customers.map((customer) => {
    const totalAppointments = customer.appointments.length;
    const points = totalAppointments * 10;
    const totalSpent = customer.appointments.reduce(
      (sum, appointment) => sum + appointment.service.priceInCents,
      0,
    );
    const lastVisit = customer.appointments[0]?.startsAt ?? null;

    return {
      id: customer.id,
      name: customer.name,
      contact: customer.email || customer.phone,
      role: customer.role,
      points,
      totalAppointments,
      totalSpent,
      lastVisit,
    };
  });

  const recentAppointments = nonCancelledAppointments.slice(0, 10);

  const summaryMetrics = [
    { label: "Clientes cadastrados", value: String(customers.length) },
    { label: "Barbeiros ativos", value: String(activeBarbers) },
    { label: "Receita do dia", value: formatCurrency(revenueToday) },
    { label: "Receita do mês", value: formatCurrency(revenueMonth) },
    { label: "Agendamentos hoje", value: String(appointmentsToday.length) },
    { label: "Ticket médio do mês", value: formatCurrency(averageTicket) },
  ];

  return (
    <div className={styles.adminPage}>
      <div className={styles.adminShell}>
        <aside className={styles.adminSidebar}>
          <div className={styles.sidebarBrand}>
            <strong>{tenant.name}</strong>
            <span>Painel de gestão da barbearia</span>
          </div>

          <nav className={styles.sidebarNav}>
            {/* <a> de proposito em toda a nav do admin: navegacao client-side
                (<Link>) pode reaproveitar o layout ja renderizado (bloqueado
                ou liberado) em vez de reavaliar o gate de assinatura pro novo
                pathname a cada troca de pagina. */}
            <a href="/admin">Visão geral</a>
            <a href="/admin/site">Site</a>
            <a href="/admin/catalogo">Catálogo</a>
            <a href="/admin/agenda">Agenda</a>
            <a className={styles.sidebarNavLinkActive} href="/admin/dados">
              Dados
            </a>
            <a href="/admin/suporte">Suporte</a>
            <a href="/admin/assinatura">Assinatura</a>
          </nav>

          <div className={styles.sidebarStats}>
            <div>
              <div className={styles.sidebarMetaLabel}>Base de clientes</div>
              <div className={styles.sidebarMetaValue}>{customers.length} clientes</div>
            </div>
            <div>
              <div className={styles.sidebarMetaLabel}>Receita no mês</div>
              <div className={styles.sidebarMetaValue}>{formatCurrency(revenueMonth)}</div>
            </div>
          </div>
        </aside>

        <main className={styles.adminContent}>
          <section className={styles.adminHeader}>
            <div>
              <p className={styles.sectionEyebrow}>Dados do negócio</p>
              <h1>Clientes, fidelidade e receita</h1>
              <p>
                Base inicial para o futuro dashboard com visão de clientes, recorrência e desempenho financeiro.
              </p>
            </div>
            <div className={styles.adminHeaderActions}>
              <a className={styles.inlineNavigationLink} href="/admin">
                Voltar para visão geral
              </a>
            </div>
          </section>

          <section className={styles.summaryMetricsGrid}>
            {summaryMetrics.map((item) => (
              <article className={styles.summaryMetricCard} key={item.label}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </article>
            ))}
          </section>

          <div className={styles.adminSections}>
            <section className={styles.contentCard}>
              <div className={styles.contentCardHeader}>
                <p className={styles.sectionEyebrow}>Clientes</p>
                <h2>Base de clientes e fidelidade</h2>
                <p>Veja os clientes cadastrados, pontos atuais e o valor acumulado por histórico.</p>
              </div>

              <div className={styles.tableWrapper}>
                <table className={styles.adminTable}>
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Contato</th>
                      <th>Role</th>
                      <th>Pontos</th>
                      <th>Atendimentos</th>
                      <th>Total gasto</th>
                      <th>Última visita</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerRows.map((customer) => (
                      <tr key={customer.id}>
                        <td>{customer.name}</td>
                        <td>{customer.contact}</td>
                        <td>{customer.role}</td>
                        <td>{customer.points} pts</td>
                        <td>{customer.totalAppointments}</td>
                        <td>{formatCurrency(customer.totalSpent)}</td>
                        <td>{formatDate(customer.lastVisit)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className={styles.contentCard}>
              <div className={styles.contentCardHeader}>
                <p className={styles.sectionEyebrow}>Movimento</p>
                <h2>Atendimentos recentes</h2>
                <p>Histórico recente para conferência rápida do que entrou na operação.</p>
              </div>

              <div className={styles.tableWrapper}>
                <table className={styles.adminTable}>
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Cliente</th>
                      <th>Serviço</th>
                      <th>Barbeiro</th>
                      <th>Status</th>
                      <th>Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentAppointments.map((appointment) => (
                      <tr key={appointment.id}>
                        <td>{formatDateTime(appointment.startsAt)}</td>
                        <td>{appointment.customerName}</td>
                        <td>{appointment.service.name}</td>
                        <td>{appointment.barber.name}</td>
                        <td>{appointment.status}</td>
                        <td>{formatCurrency(appointment.service.priceInCents)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
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
