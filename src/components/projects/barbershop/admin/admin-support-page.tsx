"use client";

import { useState } from "react";
import styles from "@/app/admin/admin.module.css";
import { AdminButton } from "@/components/projects/barbershop/admin/admin-button";
import { DaBiTechSignature } from "@/components/shared/dabi-tech-signature";
import { useSiteConfig } from "@/components/projects/barbershop/use-site-config";

export function AdminSupportPage() {
  const config = useSiteConfig();
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(
    null,
  );

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!message.trim() || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/admin/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim() }),
      });
      const payload = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Nao foi possivel enviar a mensagem.");
      }

      setFeedback({ type: "success", text: payload.message ?? "Mensagem enviada." });
      setMessage("");
    } catch (error) {
      setFeedback({
        type: "error",
        text: error instanceof Error ? error.message : "Nao foi possivel enviar a mensagem.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={styles.adminPage}>
      <div className={styles.adminShell}>
        <aside className={styles.adminSidebar}>
          <div className={styles.sidebarBrand}>
            <strong>{config.businessName}</strong>
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
            <a className={styles.sidebarNavLinkActive} href="/admin/suporte">
              Suporte
            </a>
            <a href="/admin/assinatura">Assinatura</a>
          </nav>
        </aside>

        <main className={styles.adminContent}>
          <section className={styles.adminHeader}>
            <div>
              <p className={styles.sectionEyebrow}>Suporte</p>
              <h1>Fale com a DaBi Tech</h1>
              <p>
                Dúvidas, problemas ou pedidos sobre o sistema? Mande uma mensagem e nossa equipe
                responde em breve.
              </p>
            </div>
            <div className={styles.adminHeaderActions}>
              <a className={styles.inlineNavigationLink} href="/admin">
                Voltar para visão geral
              </a>
            </div>
          </section>

          <div className={styles.contentCard}>
            <form onSubmit={handleSubmit}>
              <div className={styles.formFieldsGrid}>
                <div className={`${styles.formField} ${styles.formFieldFull}`}>
                  <label htmlFor="support-message">Sua mensagem</label>
                  <textarea
                    id="support-message"
                    rows={6}
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Descreva o que voce precisa..."
                  />
                </div>
              </div>

              {feedback ? (
                <p style={{ color: feedback.type === "error" ? "#b13a3a" : "#3f8b52" }}>
                  {feedback.text}
                </p>
              ) : null}

              <div className={styles.supportSubmitRow}>
                <AdminButton disabled={isSubmitting || !message.trim()} type="submit">
                  {isSubmitting ? "Enviando..." : "Enviar mensagem"}
                </AdminButton>
              </div>
            </form>
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
