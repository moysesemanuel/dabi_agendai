import { Inter } from "next/font/google";
import Link from "next/link";
import { DaBiTechLogo } from "@/components/shared/dabi-tech-logo";
import styles from "./terms-page.module.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});

export function TermsPage() {
  return (
    <div className={`${styles.page} ${inter.variable}`}>
      <header className={styles.header}>
        <DaBiTechLogo className={styles.logo} variant="light" />
      </header>

      <main className={styles.main}>
        <div className={styles.intro}>
          <Link className={styles.backLink} href="/barbearias">
            ← Voltar
          </Link>
          <span>Termos de Uso</span>
          <h1>Termos de Uso do DaBi Agendaí</h1>
          <p>
            Estes termos regem a contratação do DaBi Agendaí pela sua
            barbearia junto à DaBi Tech. Ao contratar o serviço, você
            concorda com o que está descrito abaixo.
          </p>
        </div>

        <div className={styles.card}>
          <div className={styles.section}>
            <h2>1. Quem presta o serviço</h2>
            <p>
              O DaBi Agendaí é operado pela DaBi Tech (57.936.721 MOYSES
              EMANUEL COSTA SILVA, CNPJ 57.936.721/0001-25, Empresário
              Individual), com sede em Curitiba/PR. Contato: (41) 98887-5659.
            </p>
          </div>

          <div className={styles.section}>
            <h2>2. O que é o DaBi Agendaí</h2>
            <p>
              O DaBi Agendaí é um sistema de agenda online, painel de
              administração e clube de fidelidade voltado a barbearias. Cada
              barbearia contratante (&quot;você&quot;) recebe um site próprio,
              com identidade visual e dados de configuração específicos do seu
              negócio.
            </p>
          </div>

          <div className={styles.section}>
            <h2>3. Como a contratação funciona</h2>
            <p>
              Hoje não existe cadastro automático: a implantação é feita
              manualmente pela DaBi Tech após contato (geralmente via
              WhatsApp). A DaBi Tech configura o site, os serviços e o acesso
              de administrador da sua barbearia antes de colocar tudo no ar.
            </p>
          </div>

          <div className={styles.section}>
            <h2>4. Planos e valores</h2>
            <ul>
              <li>Essencial — R$ 59/mês</li>
              <li>Completo — R$ 99/mês</li>
            </ul>
            <p>
              Não há taxa de adesão. Os valores vigentes são sempre os
              informados no momento da contratação; caso mudem depois, a DaBi
              Tech avisa com pelo menos 30 dias de antecedência antes de
              aplicar o novo valor à sua assinatura.
            </p>
          </div>

          <div className={styles.section}>
            <h2>5. Cobrança e pagamento</h2>
            <p>
              A cobrança é mensal, na forma combinada diretamente com você no
              momento da implantação. Em caso de atraso, a DaBi Tech pode
              suspender o acesso ao painel de administração até a
              regularização, sem suspender o site público da sua barbearia
              sem aviso prévio.
            </p>
          </div>

          <div className={styles.section}>
            <h2>6. Cancelamento</h2>
            <p>
              Você pode cancelar quando quiser, sem multa, avisando a DaBi
              Tech com pelo menos 5 dias úteis de antecedência da próxima
              cobrança. Após o cancelamento, o site da sua barbearia sai do
              ar; dados do seu negócio (catálogo de serviços, histórico de
              agendamentos) ficam disponíveis para exportação por 30 dias
              antes de serem removidos.
            </p>
          </div>

          <div className={styles.section}>
            <h2>7. Dados dos seus clientes</h2>
            <p>
              O tratamento dos dados pessoais dos clientes que agendam na sua
              barbearia é descrito na Política de Privacidade do site da sua
              própria barbearia (disponível em{" "}
              <code>/privacidade</code> dentro do seu domínio) — nela, a sua
              barbearia é a controladora desses dados e a DaBi Tech é a
              operadora técnica.
            </p>
          </div>

          <div className={styles.section}>
            <h2>8. Disponibilidade e suporte</h2>
            <p>
              A DaBi Tech se esforça para manter o serviço disponível e
              estável, mas hoje não oferece um SLA formal de disponibilidade.
              O suporte é feito por WhatsApp, com prioridade maior para
              clientes do plano Completo.
            </p>
          </div>

          <div className={styles.section}>
            <h2>9. Limite de responsabilidade</h2>
            <p>
              A DaBi Tech não se responsabiliza por perdas indiretas
              decorrentes de indisponibilidade do serviço, como agendamentos
              não realizados por clientes durante uma eventual instabilidade.
              A DaBi Tech se compromete a corrigir problemas técnicos
              reportados dentro de um prazo razoável.
            </p>
          </div>

          <div className={styles.section}>
            <h2>10. Alterações nestes termos</h2>
            <p>
              Estes termos podem ser atualizados conforme o serviço evolui. Mudanças
              relevantes serão comunicadas com antecedência pelos canais de
              contato já usados com você (WhatsApp ou e-mail).
            </p>
          </div>

          <div className={styles.section}>
            <h2>11. Legislação aplicável</h2>
            <p>
              Estes termos são regidos pela legislação brasileira, com foro na
              comarca de Curitiba/PR para resolução de eventuais conflitos.
            </p>
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        <DaBiTechLogo className={styles.footerLogo} variant="light" />
      </footer>
    </div>
  );
}
