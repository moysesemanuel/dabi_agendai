import { Inter, Space_Grotesk } from "next/font/google";
import Link from "next/link";
import { DaBiTechLogo } from "@/components/shared/dabi-tech-logo";
import { buildWhatsappUrl } from "@/components/shared/whatsapp";
import { WhatsappCtaLink } from "./whatsapp-cta-link";
import styles from "./sales-landing-page.module.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display-marketing",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body-marketing",
});

const WHATSAPP_PHONE = "41988875659";
const WHATSAPP_MESSAGE =
  "Oi! Vi a página do DaBi Agendaí e quero saber como colocar minha barbearia lá.";
const whatsappUrl = buildWhatsappUrl(WHATSAPP_PHONE, WHATSAPP_MESSAGE);

const beforeSlots = [
  { time: "08:40", text: '"oi, vc abre hj?"' },
  { time: "09:15", text: '"tem horário pra sábado de manhã?"' },
  { time: "09:15", text: "cliente marcado sem querer no mesmo horário" },
  { time: "11:30", text: '"desculpa, vou ter que remarcar"' },
];

const afterSlots = [
  { time: "08:00", client: "Lucas Andrade", service: "Corte + barba" },
  { time: "09:00", client: "Rafael Souza", service: "Corte" },
  { time: "10:00", client: "Diego Martins", service: "Barba" },
  { time: "11:00", client: "Bruno Lima", service: "Corte + sobrancelha" },
];

const painPoints = [
  "Cliente manda mensagem, você para o que está fazendo pra responder.",
  "Dois clientes marcam sem querer o mesmo horário.",
  "Sexta lota, terça esvazia — e você só percebe depois que já aconteceu.",
];

const dailySteps = [
  {
    when: "De manhã",
    title: "Cliente agenda sozinho",
    text: "Ele escolhe serviço, dia e horário pelo link da sua barbearia, sem trocar mensagem com ninguém.",
  },
  {
    when: "Durante o dia",
    title: "Você acompanha tudo em um lugar só",
    text: "A agenda fica visível pelo celular ou computador, com bloqueios de horário e histórico de cada cliente.",
  },
  {
    when: "Fim do mês",
    title: "Você vê quem sempre volta",
    text: "O clube de fidelidade soma pontos a cada visita automaticamente, sem planilha e sem cartão de papel.",
  },
];

const features = [
  {
    title: "Agenda online 24 horas",
    text: "O cliente marca fora do seu horário de expediente, sem esperar você responder.",
  },
  {
    title: "Painel de administração",
    text: "Bloqueios de horário, cadastro de serviços e histórico de cada cliente em um painel simples.",
  },
  {
    title: "Clube de fidelidade",
    text: "Pontos automáticos a cada visita — o cliente acompanha, você não precisa controlar nada.",
  },
  {
    title: "Site com a cara do seu negócio",
    text: "Nome, cores e identidade da sua barbearia, não um template genérico de agendamento.",
  },
];

const plans = [
  {
    planId: "essencial",
    name: "Essencial",
    price: "R$ 59/mês",
    for: "Para quem está começando a organizar a agenda.",
    items: [
      "Agenda online para os clientes",
      "Painel de administração",
      "Um usuário administrador",
    ],
    featured: false,
  },
  {
    planId: "completo",
    name: "Completo",
    price: "R$ 99/mês",
    for: "Para quem já tem fluxo de clientes e quer fidelizar.",
    items: [
      "Tudo do plano Essencial",
      "Clube de fidelidade automático",
      "Suporte prioritário com a DaBi Tech",
    ],
    featured: true,
  },
];

export function SalesLandingPage() {
  return (
    <div className={`${styles.page} ${spaceGrotesk.variable} ${inter.variable}`}>
      <div className={styles.dark}>
        <header className={styles.header}>
          <DaBiTechLogo className={styles.logo} variant="light" />
          <div className={styles.headerLinks}>
            <WhatsappCtaLink className={styles.buttonPrimary} href={whatsappUrl} location="header">
              Falar no WhatsApp
            </WhatsappCtaLink>
          </div>
        </header>

        <div className={styles.shell}>
          <section className={styles.hero}>
            <div className={styles.heroCopy}>
              <h1>Sua barbearia para de correr atrás de horário no WhatsApp.</h1>
              <p className={styles.heroLede}>
                O DaBi Agendaí deixa o cliente marcar sozinho, mantém sua agenda
                organizada e ainda traz ele de volta com um clube de fidelidade
                automático.
              </p>
              <div className={styles.heroActions}>
                <WhatsappCtaLink className={styles.buttonPrimary} href={whatsappUrl} location="hero">
                  Falar no WhatsApp
                </WhatsappCtaLink>
                <a className={styles.buttonGhost} href="#como-funciona">
                  Ver como funciona
                </a>
              </div>
              <p className={styles.heroNote}>
                A implantação é feita com a gente, sem cadastro automático — você
                fala com a DaBi Tech e a sua agenda entra no ar.
              </p>
            </div>

            <div className={styles.compare} aria-hidden="true">
              <div className={`${styles.comparePane} ${styles.comparePaneBefore}`}>
                <span className={styles.compareLabel}>Como é hoje</span>
                {beforeSlots.map((slot, index) => (
                  <div className={`${styles.compareRow} ${styles.compareRowBefore}`} key={index}>
                    <span className={styles.compareTime}>{slot.time}</span>
                    <span className={styles.compareTextBefore}>{slot.text}</span>
                  </div>
                ))}
              </div>
              <div className={`${styles.comparePane} ${styles.comparePaneAfter}`}>
                <span className={styles.compareLabel}>Com o DaBi Agendaí</span>
                {afterSlots.map((slot, index) => (
                  <div className={styles.compareRow} key={index}>
                    <span className={styles.compareTime}>{slot.time}</span>
                    <span className={styles.compareTextAfter}>
                      {slot.client}
                      <span>{slot.service}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>

      <section className={styles.section}>
        <div className={styles.shell}>
          <div className={styles.sectionNarrow}>
            <h2 className={styles.sectionHeading}>O problema não é a barbearia. É o WhatsApp como agenda.</h2>
          </div>
          <div className={styles.painList}>
            {painPoints.map((text, index) => (
              <div className={styles.painRow} key={index}>
                <span className={styles.painIndex}>{String(index + 1).padStart(2, "0")}</span>
                <p className={styles.painText}>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section} id="como-funciona">
        <div className={styles.shell}>
          <div className={styles.sectionNarrow}>
            <h2 className={styles.sectionHeading}>Como funciona no dia a dia</h2>
            <p className={styles.sectionLede}>
              Nada de trocar de sistema no meio da semana: o DaBi Agendaí entra na
              rotina que você já tem, só tira o WhatsApp do meio da agenda.
            </p>
          </div>
          <div className={styles.timeline}>
            {dailySteps.map((step) => (
              <div className={styles.timelineStep} key={step.when}>
                <span className={styles.timelineWhen}>{step.when}</span>
                <div>
                  <h3 className={styles.timelineTitle}>{step.title}</h3>
                  <p className={styles.timelineText}>{step.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.shell}>
          <div className={styles.sectionNarrow}>
            <h2 className={styles.sectionHeading}>O que já está pronto</h2>
          </div>
          <div className={styles.featureGrid}>
            {features.map((feature) => (
              <div key={feature.title}>
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureText}>{feature.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.shell}>
          <div className={styles.sectionNarrow}>
            <h2 className={styles.sectionHeading}>Planos</h2>
            <p className={styles.plansIntro}>
              Sem taxa de adesão. A gente ajusta os detalhes com você na
              implantação, mas o valor mensal é este.
            </p>
          </div>
          <div className={styles.plans}>
            {plans.map((plan) => (
              <div
                className={plan.featured ? `${styles.plan} ${styles.planFeatured}` : styles.plan}
                key={plan.name}
              >
                <h3 className={styles.planName}>{plan.name}</h3>
                <p className={styles.planPrice}>{plan.price}</p>
                <p className={styles.planFor}>{plan.for}</p>
                <ul className={styles.planList}>
                  {plan.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <Link className={styles.buttonPrimary} href={`/barbearias/assinar?plano=${plan.planId}`}>
                  Assinar {plan.name}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className={styles.dark}>
        <section className={styles.closing}>
          <div className={styles.shell}>
            <h2 className={styles.sectionHeading}>Bora tirar sua agenda do WhatsApp?</h2>
            <p className={styles.closingLede}>
              Fale com a DaBi Tech e a gente mostra o DaBi Agendaí funcionando com
              os serviços e horários da sua barbearia.
            </p>
            <div className={styles.closingActions}>
              <WhatsappCtaLink className={styles.buttonPrimary} href={whatsappUrl} location="closing">
                Falar no WhatsApp
              </WhatsappCtaLink>
            </div>
          </div>
        </section>

        <footer className={styles.footer}>
          <DaBiTechLogo className={styles.footerLogo} variant="light" />
          <p className={styles.footerSignature}>
            Desenvolvido por DaBi Tech - Digital Solutions © {new Date().getFullYear()}
          </p>
          <div className={styles.footerLinks}>
            <Link href="/termos-de-uso">Termos de Uso</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
