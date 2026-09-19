import styles from "@/app/admin/admin.module.css";
import { AdminSidebarNav } from "@/components/projects/barbershop/admin/admin-sidebar-nav";
import { DaBiTechSignature } from "@/components/shared/dabi-tech-signature";

type FaqItem = { question: string; answer: string };
type FaqGroup = { eyebrow: string; title: string; items: FaqItem[] };

const FAQ_GROUPS: FaqGroup[] = [
  {
    eyebrow: "Site",
    title: "Informações do negócio, planos e fidelidade",
    items: [
      {
        question: "Onde aparece o que eu preencher em \"Nome da barbearia\" e \"Linha de apoio\"?",
        answer:
          "Nome da barbearia é o nome principal exibido em toda a home e no cabeçalho do site. Linha de apoio é o texto pequeno logo abaixo, tipo um subtítulo.",
      },
      {
        question: "Preciso digitar o CEP com traço?",
        answer:
          "Não precisa. Ao preencher o CEP, o sistema busca automaticamente o endereço, cidade e bairro — você só confere e ajusta o número.",
      },
      {
        question: "Como preencho o campo do Instagram?",
        answer:
          "Só o seu usuário (ex.: suabarbearia), sem o link completo. O sistema monta o link sozinho.",
      },
      {
        question: "Por que o campo \"Média de avaliações\" não deixa eu editar?",
        answer:
          "Esse número é calculado automaticamente a partir das avaliações do site e do Google — não é um campo manual.",
      },
      {
        question: "Qual a diferença entre os \"Níveis\" e as \"Recompensas\" da fidelidade?",
        answer:
          "Níveis são faixas de pontos com nome e cor (ex.: Bronze, Prata, Ouro). Recompensas são metas específicas: ao atingir X pontos, o cliente ganha um prêmio definido por você.",
      },
    ],
  },
  {
    eyebrow: "Catálogo",
    title: "Serviços, produtos e equipe",
    items: [
      {
        question: "Qual a diferença entre Serviços e Produtos?",
        answer:
          "Serviços são o que o cliente agenda (tem duração e ocupa um horário na agenda de um barbeiro). Produtos são itens à venda (pomada, óleo de barba etc.) que aparecem no site, mas não ocupam agenda.",
      },
      {
        question: "O campo Valor formata sozinho?",
        answer:
          "Sim. Digite só os números — o campo formata automaticamente como R$ enquanto você digita.",
      },
      {
        question: "Pra que serve o campo \"Clube / assinatura\" de um serviço?",
        answer:
          "É um texto livre pra avisar o cliente que aquele serviço está incluso ou tem desconto num plano do clube (ex.: \"Incluso no plano mensal\").",
      },
      {
        question: "Os barbeiros cadastrados aqui aparecem onde?",
        answer:
          "Na tela de agendamento do cliente, como opção de profissional para escolher, e na agenda do admin.",
      },
    ],
  },
  {
    eyebrow: "Agenda",
    title: "Horários, bloqueios e confirmações",
    items: [
      {
        question: "Como bloqueio um dia inteiro (feriado, viagem, etc.)?",
        answer:
          "Use \"Datas bloqueadas\" — isso fecha a agenda inteira da barbearia naquele dia, pra todos os barbeiros.",
      },
      {
        question: "Um barbeiro específico vai faltar, mas o resto continua atendendo. Como faço?",
        answer:
          "Use \"Folga do barbeiro\" em vez de bloquear a data inteira — só aquele profissional fica indisponível no dia escolhido.",
      },
      {
        question: "O que o botão \"Confirmar + WhatsApp\" faz exatamente?",
        answer:
          "Ele confirma o agendamento no sistema e abre o WhatsApp com uma mensagem já pronta pro cliente — você ainda precisa apertar enviar por lá. Não é uma mensagem automática.",
      },
      {
        question: "Um cliente ligou ou chegou sem ter agendado pelo site. Dá pra lançar isso na agenda?",
        answer: "Sim, use a seção de agendamento manual — funciona igual ao agendamento do cliente, só que preenchido por você.",
      },
    ],
  },
  {
    eyebrow: "Dados",
    title: "Clientes, receita e pontos",
    items: [
      {
        question: "De onde vêm os números de receita e ticket médio?",
        answer:
          "São calculados automaticamente a partir dos agendamentos que não foram cancelados, usando o preço do serviço cadastrado no Catálogo.",
      },
      {
        question: "Como os pontos de fidelidade de cada cliente são calculados?",
        answer: "10 pontos por agendamento concluído (não cancelado) — não dá pra ajustar manualmente hoje.",
      },
    ],
  },
  {
    eyebrow: "Notificações",
    title: "Web Push e Telegram",
    items: [
      {
        question: "Preciso ativar Web Push e Telegram, ou só um dos dois já basta?",
        answer:
          "Recomendado ativar os dois: Web Push funciona bem em Android e computador, mas no iPhone só funciona se o site for instalado na tela de início. O Telegram cobre justamente esse caso do iPhone.",
      },
      {
        question: "Ativei, mas não chegou nenhuma notificação. O que eu confiro?",
        answer:
          "No navegador: veja se o ícone mostra \"Ativado neste navegador\" — se não, clique em Ativar de novo e aceite a permissão que o navegador pedir. No Telegram: confirme que você mandou \"Iniciar\" pro bot depois de abrir o link, e que o chat aparece na lista de conectados.",
      },
      {
        question: "O link de conexão do Telegram expirou. E agora?",
        answer: "Ele vale por 10 minutos. Só gerar um novo link na página de Notificações.",
      },
      {
        question: "Desconectei um dispositivo ou chat sem querer. Perco algum histórico?",
        answer:
          "Não, desconectar só para de mandar notificação ali. Pode reativar/reconectar quando quiser, sem perder nada.",
      },
    ],
  },
  {
    eyebrow: "Assinatura",
    title: "Cobrança e acesso ao painel",
    items: [
      {
        question: "O que acontece se o pagamento da assinatura atrasar?",
        answer:
          "O acesso ao painel administrativo fica bloqueado até a situação ser regularizada. O site público da barbearia não é afetado.",
      },
      {
        question: "Dá pra trocar de plano pelo painel?",
        answer: "Ainda não — fale com o suporte (aba Suporte) que a gente ajusta manualmente.",
      },
    ],
  },
];

export function AdminFaqPage({ businessName }: { businessName: string }) {
  return (
    <div className={styles.adminPage}>
      <div className={styles.adminShell}>
        <aside className={styles.adminSidebar}>
          <div className={styles.sidebarBrand}>
            <strong>{businessName}</strong>
            <span>Painel de gestão da barbearia</span>
          </div>

          <AdminSidebarNav pathname="/admin/faq" />
        </aside>

        <main className={styles.adminContent}>
          <section className={styles.adminHeader}>
            <div>
              <p className={styles.sectionEyebrow}>FAQ</p>
              <h1>Dúvidas sobre como preencher o painel</h1>
              <p>Respostas rápidas pra cada parte do sistema, organizadas por seção do menu.</p>
            </div>
            <div className={styles.adminHeaderActions}>
              <a className={styles.inlineNavigationLink} href="/admin">
                Voltar para visão geral
              </a>
            </div>
          </section>

          {FAQ_GROUPS.map((group) => (
            <section className={styles.contentCard} key={group.eyebrow}>
              <div className={styles.contentCardHeader}>
                <p className={styles.sectionEyebrow}>{group.eyebrow}</p>
                <h2>{group.title}</h2>
              </div>

              <div className={styles.faqList}>
                {group.items.map((item) => (
                  <details className={styles.faqItem} key={item.question}>
                    <summary>{item.question}</summary>
                    <p>{item.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}

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
