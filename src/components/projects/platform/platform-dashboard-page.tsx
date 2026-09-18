"use client";

import { useEffect, useState } from "react";
import { PLATFORM_NOTIFICATIONS_UPDATED_EVENT } from "./platform-shell";
import styles from "./platform-dashboard-page.module.css";

type Tenant = {
  id: string;
  name: string;
  domain: string;
  active: boolean;
  brandColor: string;
  createdAt: string;
  barbersCount: number;
  customersCount: number;
  appointmentsCount: number;
  subscriptionStatus: "PENDING" | "ACTIVE" | "PAUSED" | "CANCELED" | null;
  subscriptionPlanId: string | null;
  adminName: string | null;
  adminEmail: string | null;
  adminPhone: string | null;
};

const subscriptionStatusLabels: Record<NonNullable<Tenant["subscriptionStatus"]>, string> = {
  PENDING: "Pendente",
  ACTIVE: "Ativa",
  PAUSED: "Pausada",
  CANCELED: "Cancelada",
};

function buildWhatsappLink(phone: string) {
  return `https://wa.me/55${phone.replace(/\D/g, "")}`;
}

const emptyForm = {
  name: "",
  domain: "",
  adminName: "",
  adminEmail: "",
  adminPhone: "",
  adminPassword: "",
  planId: "essencial",
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

export function PlatformDashboardPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [togglingTenantId, setTogglingTenantId] = useState<string | null>(null);
  const [brandColorDrafts, setBrandColorDrafts] = useState<Record<string, string>>({});
  const [savingBrandColorId, setSavingBrandColorId] = useState<string | null>(null);

  async function loadTenants() {
    setIsLoading(true);

    try {
      const response = await fetch("/api/platform/tenants", { cache: "no-store" });
      const payload = (await response.json()) as { tenants?: Tenant[] };
      const nextTenants = payload.tenants ?? [];
      setTenants(nextTenants);
      setBrandColorDrafts(
        Object.fromEntries(nextTenants.map((tenant) => [tenant.id, tenant.brandColor])),
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadTenants();
  }, []);

  async function handleCreateTenant(event: React.FormEvent) {
    event.preventDefault();
    setFormError("");
    setFormSuccess("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/platform/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Nao foi possivel criar o tenant.");
      }

      setForm(emptyForm);
      setFormSuccess("Tenant criado com sucesso.");
      await loadTenants();
      window.dispatchEvent(new Event(PLATFORM_NOTIFICATIONS_UPDATED_EVENT));
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Nao foi possivel criar o tenant.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleActive(tenant: Tenant) {
    setTogglingTenantId(tenant.id);

    try {
      await fetch(`/api/platform/tenants/${tenant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !tenant.active }),
      });
      await loadTenants();
      window.dispatchEvent(new Event(PLATFORM_NOTIFICATIONS_UPDATED_EVENT));
    } finally {
      setTogglingTenantId(null);
    }
  }

  async function handleSaveBrandColor(tenant: Tenant) {
    const brandColor = brandColorDrafts[tenant.id];

    if (!brandColor || brandColor === tenant.brandColor) {
      return;
    }

    setSavingBrandColorId(tenant.id);

    try {
      await fetch(`/api/platform/tenants/${tenant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandColor }),
      });
      await loadTenants();
    } finally {
      setSavingBrandColorId(null);
    }
  }

  return (
    <div className={styles.page}>
      <section className={styles.card}>
        <h2>Criar novo tenant</h2>
        <form className={styles.formGrid} onSubmit={handleCreateTenant}>
          <label className={styles.field}>
            <span>Nome da barbearia</span>
            <input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
          </label>
          <label className={styles.field}>
            <span>Dominio</span>
            <input
              placeholder="barbearia.com"
              value={form.domain}
              onChange={(event) => setForm({ ...form, domain: event.target.value })}
            />
          </label>
          <label className={styles.field}>
            <span>Nome do admin</span>
            <input
              value={form.adminName}
              onChange={(event) => setForm({ ...form, adminName: event.target.value })}
            />
          </label>
          <label className={styles.field}>
            <span>E-mail do admin</span>
            <input
              type="email"
              value={form.adminEmail}
              onChange={(event) => setForm({ ...form, adminEmail: event.target.value })}
            />
          </label>
          <label className={styles.field}>
            <span>Telefone do admin</span>
            <input
              value={form.adminPhone}
              onChange={(event) => setForm({ ...form, adminPhone: event.target.value })}
            />
          </label>
          <label className={styles.field}>
            <span>Senha do admin</span>
            <input
              type="password"
              value={form.adminPassword}
              onChange={(event) => setForm({ ...form, adminPassword: event.target.value })}
            />
          </label>
          <label className={styles.field}>
            <span>Plano</span>
            <select
              value={form.planId}
              onChange={(event) => setForm({ ...form, planId: event.target.value })}
            >
              <option value="essencial">Essencial (R$ 59/mês)</option>
              <option value="completo">Completo (R$ 99/mês)</option>
            </select>
          </label>

          {formError ? <div className={styles.error}>{formError}</div> : null}
          {formSuccess ? <div className={styles.success}>{formSuccess}</div> : null}

          <button className={styles.submitButton} disabled={isSubmitting} type="submit">
            {isSubmitting ? "Criando..." : "Criar tenant"}
          </button>
        </form>
      </section>

      <section className={styles.card}>
        <h2>Tenants ({tenants.length})</h2>

        {isLoading ? (
          <p>Carregando...</p>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Dominio</th>
                  <th>Contato</th>
                  <th>Status</th>
                  <th>Assinatura</th>
                  <th>Cor de marca</th>
                  <th>Barbeiros</th>
                  <th>Clientes</th>
                  <th>Agendamentos</th>
                  <th>Criado em</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((tenant) => (
                  <tr key={tenant.id}>
                    <td>{tenant.name}</td>
                    <td>
                      <a href={`https://${tenant.domain}`} target="_blank" rel="noreferrer">
                        {tenant.domain}
                      </a>
                    </td>
                    <td>
                      {tenant.adminName || tenant.adminEmail || tenant.adminPhone ? (
                        <div className={styles.contactCell}>
                          {tenant.adminName ? <span>{tenant.adminName}</span> : null}
                          {tenant.adminEmail ? (
                            <a href={`mailto:${tenant.adminEmail}`}>{tenant.adminEmail}</a>
                          ) : null}
                          {tenant.adminPhone ? (
                            <a href={buildWhatsappLink(tenant.adminPhone)} target="_blank" rel="noreferrer">
                              {tenant.adminPhone}
                            </a>
                          ) : null}
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td>
                      <span
                        className={`${styles.statusBadge} ${
                          tenant.active ? styles.statusActive : styles.statusInactive
                        }`}
                      >
                        {tenant.active ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td>
                      {tenant.subscriptionStatus
                        ? `${subscriptionStatusLabels[tenant.subscriptionStatus]} (${tenant.subscriptionPlanId ?? "-"})`
                        : "Sem assinatura"}
                    </td>
                    <td>
                      <div className={styles.brandColorCell}>
                        <input
                          type="color"
                          value={brandColorDrafts[tenant.id] ?? tenant.brandColor}
                          onChange={(event) =>
                            setBrandColorDrafts({
                              ...brandColorDrafts,
                              [tenant.id]: event.target.value,
                            })
                          }
                        />
                        <button
                          className={styles.toggleButton}
                          disabled={
                            savingBrandColorId === tenant.id ||
                            (brandColorDrafts[tenant.id] ?? tenant.brandColor) === tenant.brandColor
                          }
                          onClick={() => void handleSaveBrandColor(tenant)}
                          type="button"
                        >
                          Salvar
                        </button>
                      </div>
                    </td>
                    <td>{tenant.barbersCount}</td>
                    <td>{tenant.customersCount}</td>
                    <td>{tenant.appointmentsCount}</td>
                    <td>{formatDate(tenant.createdAt)}</td>
                    <td>
                      <button
                        className={styles.toggleButton}
                        disabled={togglingTenantId === tenant.id}
                        onClick={() => void handleToggleActive(tenant)}
                        type="button"
                      >
                        {tenant.active ? "Desativar" : "Ativar"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
