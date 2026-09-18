import type { SiteConfig } from "@/components/shared/site-config";
import styles from "@/app/admin/admin.module.css";

type OnboardingStep = {
  label: string;
  description: string;
  href: string;
  done: boolean;
};

function buildSteps(config: SiteConfig): OnboardingStep[] {
  const hasCustomService =
    config.services.length > 1 || config.services.some((service) => service.price !== "R$ 0,00");
  const hasTeam = config.barbers.length > 1 || config.barbers.some((barber) => barber.role !== "Profissional");

  return [
    {
      label: "Preencha o endereço da barbearia",
      description: "Seus clientes precisam saber onde fica o atendimento.",
      href: "/admin/site",
      done: config.address.trim() !== "",
    },
    {
      label: "Cadastre seus serviços e preços reais",
      description: "Substitua o serviço de exemplo pelos que você realmente oferece.",
      href: "/admin/catalogo",
      done: hasCustomService,
    },
    {
      label: "Cadastre sua equipe",
      description: "Adicione os profissionais que vão atender, além de você.",
      href: "/admin/catalogo",
      done: hasTeam,
    },
    {
      label: "Adicione seu Instagram",
      description: "Aparece na página de agendamento para seus clientes.",
      href: "/admin/site",
      done: config.instagram.trim() !== "",
    },
  ];
}

export function AdminOnboardingChecklist({ config }: { config: SiteConfig }) {
  const steps = buildSteps(config);
  const doneCount = steps.filter((step) => step.done).length;

  if (doneCount === steps.length) {
    return null;
  }

  return (
    <section className={styles.contentCard}>
      <div className={styles.contentCardHeader}>
        <p className={styles.sectionEyebrow}>Primeiros passos</p>
        <h2>
          Configure sua barbearia ({doneCount}/{steps.length})
        </h2>
        <p>Complete esses passos para o seu site sair do modo de exemplo.</p>
      </div>

      <ul className={styles.onboardingList}>
        {steps.map((step) => (
          <li key={step.label} className={styles.onboardingItem}>
            <span
              className={step.done ? styles.onboardingCheckDone : styles.onboardingCheck}
              aria-hidden="true"
            >
              {step.done ? "✓" : ""}
            </span>
            <div className={styles.onboardingItemBody}>
              <strong>{step.label}</strong>
              <p>{step.description}</p>
            </div>
            {!step.done ? (
              <a className={styles.inlineNavigationLink} href={step.href}>
                Resolver
              </a>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
