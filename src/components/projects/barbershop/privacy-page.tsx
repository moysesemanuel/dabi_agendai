"use client";

import styles from "./privacy-page.module.css";
import { FooterSection, Header } from "./home-page";
import { useSiteConfig } from "./use-site-config";

export function PrivacyPage() {
  const config = useSiteConfig();

  return (
    <div className={styles.page}>
      <section className={styles.heroShell}>
        <Header config={config} homeLinks />

        <main className={styles.main}>
          <div className={styles.intro}>
            <span>Privacidade</span>
            <h1>Política de Privacidade</h1>
            <p>
              Como a {config.businessName} coleta, usa e protege os seus dados pessoais ao usar
              este site e agendar atendimentos conosco.
            </p>
          </div>

          <div className={styles.contentCard}>
            <p className={styles.placeholderNote}>
              Documento em elaboração final: razão social e CNPJ do responsável pelo tratamento de
              dados serão publicados aqui assim que o cadastro jurídico da empresa for concluído.
              As práticas de tratamento de dados descritas abaixo já estão em vigor.
            </p>

            <div className={styles.policySection}>
              <h2>1. Quem trata os seus dados</h2>
              <p>
                A {config.businessName} é a responsável pelo tratamento dos dados pessoais
                coletados através deste site, nos termos da Lei Geral de Proteção de Dados (Lei nº
                13.709/2018 — LGPD).
              </p>
            </div>

            <div className={styles.policySection}>
              <h2>2. Quais dados coletamos</h2>
              <ul>
                <li>Nome completo</li>
                <li>Telefone (WhatsApp)</li>
                <li>E-mail (opcional)</li>
                <li>Histórico de agendamentos, serviços e preferências de atendimento</li>
              </ul>
            </div>

            <div className={styles.policySection}>
              <h2>3. Para que usamos esses dados</h2>
              <ul>
                <li>Criar e gerenciar a sua conta de cliente</li>
                <li>Confirmar, remarcar e cancelar agendamentos</li>
                <li>Calcular pontos e recompensas do programa de fidelidade</li>
                <li>Entrar em contato sobre o seu agendamento</li>
              </ul>
              <p>
                Não vendemos nem compartilhamos os seus dados pessoais com terceiros para fins de
                marketing.
              </p>
            </div>

            <div className={styles.policySection}>
              <h2>4. Por quanto tempo guardamos os seus dados</h2>
              <p>
                Mantemos os seus dados enquanto sua conta estiver ativa. Registros de
                agendamentos já realizados podem ser mantidos por prazo adicional para cumprir
                obrigações legais e fiscais, mesmo após a exclusão da sua conta — nesse caso, os
                dados pessoais associados a esses registros são anonimizados.
              </p>
            </div>

            <div className={styles.policySection}>
              <h2>5. Os seus direitos</h2>
              <p>Nos termos da LGPD, você pode a qualquer momento:</p>
              <ul>
                <li>Confirmar a existência de tratamento dos seus dados</li>
                <li>Acessar os dados que temos sobre você</li>
                <li>Corrigir dados incompletos, desatualizados ou incorretos</li>
                <li>Solicitar a exclusão dos seus dados pessoais</li>
              </ul>
              <p>
                Clientes cadastrados podem excluir a própria conta e anonimizar seus dados
                pessoais a qualquer momento na página{" "}
                <a href="/agendamentos">Meus agendamentos</a>.
              </p>
            </div>

            <div className={styles.policySection}>
              <h2>6. Contato</h2>
              <p>
                Duvidas sobre esta política ou sobre o tratamento dos seus dados podem ser
                enviadas pelo WhatsApp {config.whatsapp}.
              </p>
            </div>
          </div>

          <FooterSection />
        </main>
      </section>
    </div>
  );
}
