"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./platform-dashboard-page.module.css";

type Tenant = {
  id: string;
  name: string;
  domain: string;
  active: boolean;
  createdAt: string;
  barbersCount: number;
  customersCount: number;
  appointmentsCount: number;
};

const emptyForm = {
  name: "",
  domain: "",
  adminName: "",
  adminEmail: "",
  adminPhone: "",
  adminPassword: "",
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

export function PlatformDashboardPage() {
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [togglingTenantId, setTogglingTenantId] = useState<string | null>(null);

  async function loadTenants() {
    setIsLoading(true);

    try {
      const response = await fetch("/api/platform/tenants", { cache: "no-store" });
      const payload = (await response.json()) as { tenants?: Tenant[] };
      setTenants(payload.tenants ?? []);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadTenants();
  }, []);

  async function handleLogout() {
    await fetch("/api/platform/session", { method: "DELETE" });
    router.push("/platform/login");
    router.refresh();
  }

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
    } finally {
      setTogglingTenantId(null);
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          <span className={styles.eyebrow}>DaBi Tech</span>
          <h1>Admin da plataforma</h1>
        </div>
        <button className={styles.logoutButton} onClick={() => void handleLogout()} type="button">
          Sair
        </button>
      </header>

      <main className={styles.main}>
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
                    <th>Status</th>
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
                        <span
                          className={`${styles.statusBadge} ${
                            tenant.active ? styles.statusActive : styles.statusInactive
                          }`}
                        >
                          {tenant.active ? "Ativo" : "Inativo"}
                        </span>
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
      </main>
    </div>
  );
}
