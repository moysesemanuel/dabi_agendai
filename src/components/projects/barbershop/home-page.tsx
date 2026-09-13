"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import bookingStyles from "./home-booking.module.css";
import { BOOKING_CART_EVENT, getTotalCartCount } from "./cart-storage";
import {
  CUSTOMER_SESSION_EVENT,
  type CustomerSession,
  readCustomerSession,
  writeCustomerSession,
} from "./customer-session";
import { readCustomerReviews } from "./reviews-storage";
import contactStyles from "./home-contact.module.css";
import layoutStyles from "./home-layout.module.css";
import sectionStyles from "./home-sections.module.css";
import flowStyles from "./service-booking-flow.module.css";
import { useSiteConfig } from "./use-site-config";
import {
  getBusinessAddress,
  getDisplayStats,
  type SiteConfig,
} from "@/components/shared/site-config";
import { DaBiTechSignature } from "@/components/shared/dabi-tech-signature";
import {
  buildWhatsappUrl,
  formatWhatsappDisplay,
} from "@/components/shared/whatsapp";
import { useToast } from "@/components/shared/toast-provider";
import { SectionHeading } from "./section-heading";

const styles = {
  ...layoutStyles,
  ...sectionStyles,
  ...bookingStyles,
  ...contactStyles,
};

function formatSelectedDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(new Date(`${date}T12:00:00`));
}

export type NextAvailableSlot = {
  date: string;
  time: string;
  barberName: string;
} | null;

type AvailabilityResponse = {
  slots: string[];
  closedReason: string | null;
  nextAvailable: NextAvailableSlot;
};

type BookingSuccessState = {
  customerName: string;
  serviceName: string;
  barberName: string;
  date: string;
  time: string;
};

type HeaderAuthMode = "login" | "register";

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatNextAvailable(slot: NextAvailableSlot) {
  if (!slot) {
    return "Agenda temporariamente indisponivel";
  }

  const today = getTodayDateString();
  const tomorrowDate = new Date(`${today}T12:00:00`);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = tomorrowDate.toISOString().slice(0, 10);
  const label =
    slot.date === today
      ? "Hoje"
      : slot.date === tomorrow
        ? "Amanha"
        : new Intl.DateTimeFormat("pt-BR", {
            day: "2-digit",
            month: "2-digit",
          }).format(new Date(`${slot.date}T12:00:00`));

  return `${label} as ${slot.time} com ${slot.barberName}`;
}

function buildCustomerWhatsappMessage(params: BookingSuccessState) {
  return [
    `Olá, meu nome é ${params.customerName}.`,
    "",
    "Acabei de fazer um agendamento pelo site da Prime Cut Studio.",
    `${params.serviceName} com ${params.barberName}`,
    `${formatSelectedDate(params.date)} às ${params.time}`,
    "",
    "Se precisarem confirmar algum detalhe, fico à disposição.",
  ].join("\n");
}

function getBusinessMapQuery(config: SiteConfig) {
  return [
    config.address,
    config.addressNumber,
    config.neighborhood,
    config.city,
    config.zipCode,
    "Brasil",
  ]
    .filter(Boolean)
    .join(", ");
}

export function Header({
  config,
  homeLinks = false,
  homeBasePath = "/",
  profileHref,
  profileTitle = "Perfil do cliente",
  profileName,
  profileSubtitle,
  profilePoints,
  profileRole,
  onProfileLogout,
}: {
  config: SiteConfig;
  homeLinks?: boolean;
  homeBasePath?: string;
  profileHref?: string;
  profileTitle?: string;
  profileName?: string;
  profileSubtitle?: string;
  profilePoints?: number;
  profileRole?: "CUSTOMER" | "ADMIN";
  onProfileLogout?: () => void;
}) {
  const { showToast } = useToast();
  const pathname = usePathname();
  const normalizedHomeBasePath =
    homeBasePath !== "/" ? homeBasePath.replace(/\/$/, "") : homeBasePath;
  const homePrefix = homeLinks ? `${normalizedHomeBasePath}#` : "#";
  const [currentHash, setCurrentHash] = useState("");
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<HeaderAuthMode>("login");
  const [authName, setAuthName] = useState("");
  const [authPhone, setAuthPhone] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function syncHash() {
      setCurrentHash(window.location.hash);
    }

    syncHash();
    window.addEventListener("hashchange", syncHash);

    return () => {
      window.removeEventListener("hashchange", syncHash);
    };
  }, []);

  useEffect(() => {
    function syncCartCount() {
      setCartCount(getTotalCartCount());
    }

    syncCartCount();
    window.addEventListener(BOOKING_CART_EVENT, syncCartCount);
    window.addEventListener("storage", syncCartCount);

    return () => {
      window.removeEventListener(BOOKING_CART_EVENT, syncCartCount);
      window.removeEventListener("storage", syncCartCount);
    };
  }, []);

  useEffect(() => {
    if (!isProfileMenuOpen) {
      return;
    }

    function handleClickOutside(event: MouseEvent) {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProfileMenuOpen]);

  async function handleHeaderCustomerAccess() {
    setAuthError("");

    if (!authEmail.trim() || !authPassword.trim()) {
      const message = "Preencha e-mail e senha para continuar.";
      setAuthError(message);
      showToast({ variant: "warning", message });
      return;
    }

    if (authMode === "register" && !authName.trim()) {
      const message = "Preencha seu nome para criar a conta.";
      setAuthError(message);
      showToast({ variant: "warning", message });
      return;
    }

    if (authMode === "register" && !authPhone.trim()) {
      const message = "Preencha o WhatsApp para criar a conta.";
      setAuthError(message);
      showToast({ variant: "warning", message });
      return;
    }

    setIsSubmittingAuth(true);

    try {
      const response = await fetch("/api/customers/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: authMode,
          name: authName.trim(),
          phone: authPhone.trim(),
          email: authEmail.trim(),
          password: authPassword.trim(),
        }),
      });
      const payload = (await response.json()) as {
        customer?: CustomerSession;
        error?: string;
      };

      if (!response.ok || !payload.customer) {
        throw new Error(payload.error ?? "Nao foi possivel acessar sua conta.");
      }

      writeCustomerSession(payload.customer);
      setIsAuthModalOpen(false);
      setAuthPassword("");
      setIsProfileMenuOpen(false);
      showToast({
        variant: "success",
        message: authMode === "login" ? "Login realizado com sucesso." : "Conta criada com sucesso.",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Nao foi possivel acessar sua conta.";
      setAuthError(message);
      showToast({ variant: "error", message });
    } finally {
      setIsSubmittingAuth(false);
    }
  }

  const navItems = [
    {
      label: "O studio",
      href: homeLinks ? normalizedHomeBasePath : "#studio",
      sectionHash: "#studio",
      routePrefix: undefined,
    },
    { label: "Clube", href: `${homePrefix}clube`, sectionHash: "#clube", routePrefix: undefined },
    { label: "Serviços", href: `${homePrefix}servicos`, sectionHash: "#servicos", routePrefix: undefined },
    { label: "Agendamento", href: "/agendamento", routePrefix: "/agendamento", sectionHash: undefined },
    { label: "Localização", href: `${homePrefix}contato`, sectionHash: "#contato", routePrefix: undefined },
  ] as const;

  function isNavItemActive(item: (typeof navItems)[number]) {
    if (item.routePrefix) {
      return pathname.startsWith(item.routePrefix);
    }

    if (pathname !== normalizedHomeBasePath) {
      return false;
    }

    if (item.sectionHash === "#studio") {
      return currentHash === "" || currentHash === "#studio";
    }

    return currentHash === item.sectionHash;
  }

  return (
    <>
      <header className={styles.header}>
        <div>
          <span className={styles.brand}>{config.businessName}</span>
          <p className={styles.brandTag}>{config.businessTag}</p>
        </div>
        <nav className={styles.nav}>
        {navItems.map((item) => (
          <Link
            className={`${styles.navLink} ${isNavItemActive(item) ? styles.navLinkActive : ""}`}
            href={item.href}
            key={item.label}
          >
            {item.label}
          </Link>
        ))}
      </nav>
        <div className={styles.headerActions}>
          <Link
            className={styles.cartButton}
            href="/agendamento/carrinho"
            aria-label={`Carrinho com ${cartCount} item${cartCount === 1 ? "" : "s"}`}
            title="Carrinho"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M3 5.25h2.17l1.24 6.2a2.25 2.25 0 0 0 2.2 1.8h7.83a2.25 2.25 0 0 0 2.2-1.8l1.06-5.3H7.12"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="9.25" cy="18.25" r="1.4" fill="currentColor" />
              <circle cx="17.25" cy="18.25" r="1.4" fill="currentColor" />
            </svg>
            {cartCount > 0 ? <span className={styles.cartBadge}>{cartCount}</span> : null}
          </Link>
          {profileHref ? (
            <div className={styles.profileMenu} ref={profileMenuRef}>
              <button
                className={styles.profileButton}
                onClick={() => setIsProfileMenuOpen((current) => !current)}
                type="button"
                title={profileTitle}
                aria-label={profileTitle}
                aria-expanded={isProfileMenuOpen}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M12 12a4.5 4.5 0 1 0-4.5-4.5A4.5 4.5 0 0 0 12 12Zm0 2.25c-3.66 0-6.75 1.88-6.75 4.13V20h13.5v-1.62c0-2.25-3.09-4.13-6.75-4.13Z"
                    fill="currentColor"
                  />
                </svg>
              </button>
              {isProfileMenuOpen ? (
                <div className={styles.profileDropdown}>
                  {profileName && onProfileLogout ? (
                    <>
                      <div className={styles.profileIdentity}>
                        <strong>{profileName}</strong>
                        <span>{profileSubtitle}</span>
                      </div>
                      <Link
                        className={styles.profileMetaLink}
                        href="/agendamentos"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        <span>Agendamentos</span>
                        <strong>Gerenciar</strong>
                      </Link>
                      <Link
                        className={styles.profileMetaLink}
                        href="/fidelidade"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        <span>Fidelidade</span>
                        <strong>{profilePoints ?? 0} pts</strong>
                      </Link>
                      {profileRole === "ADMIN" ? (
                        <Link
                          className={styles.profileAdminButton}
                          href="/admin"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          Área do admin
                        </Link>
                      ) : null}
                      <button
                        className={styles.profileLogoutButton}
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          void fetch("/api/customers/session", { method: "DELETE" });
                          onProfileLogout();
                        }}
                        type="button"
                      >
                        Sair
                      </button>
                    </>
                  ) : (
                    <>
                      <div className={styles.profileIdentity}>
                        <strong>Acesso do cliente</strong>
                        <span>Entre para acompanhar seus agendamentos e reservas.</span>
                      </div>
                      <button
                        className={styles.profileLogoutButton}
                        onClick={() => {
                          setAuthMode("login");
                          setAuthError("");
                          setIsAuthModalOpen(true);
                          setIsProfileMenuOpen(false);
                        }}
                        type="button"
                      >
                        Entrar
                      </button>
                    </>
                  )}
                </div>
              ) : null}
            </div>
          ) : null}
          <Link className={styles.headerCta} href="/agendamento">
            Agende
          </Link>
        </div>
      </header>

      {isAuthModalOpen ? (
        <div className={flowStyles.modalOverlay}>
          <div className={`${flowStyles.modal} ${flowStyles.modalCompact}`}>
            <button
              className={flowStyles.modalCloseButton}
              onClick={() => {
                setIsAuthModalOpen(false);
                setAuthError("");
              }}
              type="button"
              aria-label="Fechar modal de acesso"
            >
              ×
            </button>
            <div className={flowStyles.modalHeader}>
              <span className={styles.sectionEyebrow}>Login do cliente</span>
              <h3>
                {authMode === "login"
                  ? "Faça login para acessar sua conta."
                  : "Crie sua conta para acessar sua área de cliente."}
              </h3>
              <p>
                Seu cadastro fica salvo para próximas reservas e evita preencher
                os dados novamente.
              </p>
            </div>

            <div className={flowStyles.modalActions}>
              <button
                className={authMode === "login" ? flowStyles.modeButtonActive : flowStyles.modeButton}
                onClick={() => {
                  setAuthMode("login");
                  setAuthError("");
                }}
                type="button"
              >
                Entrar
              </button>
              <button
                className={authMode === "register" ? flowStyles.modeButtonActive : flowStyles.modeButton}
                onClick={() => {
                  setAuthMode("register");
                  setAuthError("");
                }}
                type="button"
              >
                Criar conta
              </button>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                void handleHeaderCustomerAccess();
              }}
            >
              <div className={flowStyles.fieldGrid}>
              {authMode === "register" ? (
                <label className={flowStyles.field}>
                  <span>Nome completo</span>
                  <input value={authName} onChange={(event) => setAuthName(event.target.value)} />
                </label>
              ) : null}
              <label className={flowStyles.field}>
                <span>E-mail</span>
                <input
                  type="email"
                  value={authEmail}
                  onChange={(event) => setAuthEmail(event.target.value)}
                />
              </label>
              <label className={flowStyles.field}>
                <span>Senha</span>
                <input
                  type="password"
                  value={authPassword}
                  onChange={(event) => setAuthPassword(event.target.value)}
                />
                {authMode === "register" ? (
                  <small className={flowStyles.fieldHint}>
                    Use no mínimo 6 caracteres para criar sua senha.
                  </small>
                ) : null}
              </label>
              {authMode === "register" ? (
                <label className={`${flowStyles.field} ${flowStyles.fieldWide}`}>
                  <span>WhatsApp</span>
                  <input value={authPhone} onChange={(event) => setAuthPhone(event.target.value)} />
                </label>
              ) : null}
              </div>

              {authError ? (
                <div className={`${flowStyles.feedback} ${flowStyles.feedbackError}`}>{authError}</div>
              ) : null}

              <div className={flowStyles.modalActions}>
                <button
                  className={flowStyles.modalSecondaryButton}
                  onClick={() => setIsAuthModalOpen(false)}
                  type="button"
                >
                  Fechar
                </button>
                <button className={flowStyles.modalPrimaryButton} type="submit">
                  {isSubmittingAuth
                    ? authMode === "login"
                      ? "Entrando..."
                      : "Criando conta..."
                    : authMode === "login"
                      ? "Entrar"
                      : "Criar conta"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

function HeroSection({
  config,
  nextAvailable,
}: {
  config: SiteConfig;
  nextAvailable: NextAvailableSlot;
}) {
  return (
    <section className={styles.hero}>
      <div className={styles.heroContent}>
        <p className={styles.kicker}>Seu estilo tratado com padrão de studio</p>
        <h1>{config.headline}</h1>
        <p className={styles.description}>{config.heroDescription}</p>
        <div className={styles.ctas}>
          <Link className={styles.primary} href="/agendamento">
            Agendar agora
          </Link>
          <a className={styles.secondary} href="#servicos">
            Ver serviços
          </a>
        </div>
      </div>

      <div className={styles.heroPanel}>
        <span className={styles.panelTag}>Atendimento com hora marcada</span>
        <h2>Agende em poucos passos. Atendimento no horário, sem espera.</h2>
        <p>
          Escolha o serviço, selecione o profissional e confirme seu horário em
          poucos passos.
        </p>
        <div className={styles.panelHighlights}>
          <div>
            <strong>Próximo horário livre:</strong>
            <span>{formatNextAvailable(nextAvailable)}</span>
          </div>
          <div>
            <strong>Confirmação imediata:</strong>
            <span>Resumo do agendamento e lembrete no WhatsApp</span>
          </div>
        </div>
        <div className={styles.panelInfo}>
          <strong>Seg a Sex: 9h às 20h</strong>
          <strong>Sáb: 8h às 18h</strong>
        </div>
      </div>
    </section>
  );
}

function ShowcaseSection({ config }: { config: SiteConfig }) {
  const variantClassName = {
    tall: styles.showcaseTall,
    wide: styles.showcaseWide,
    square: styles.showcaseSquare,
  } as const;

  return (
    <section className={styles.heroGallery}>
      {config.showcaseImages.map((item) => (
        <article
          className={`${styles.showcaseCard} ${variantClassName[item.variant]}`}
          key={item.src}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={styles.showcaseImage} src={item.src} alt={item.alt} />
          <div className={styles.showcaseOverlay}>
            <span>{item.label}</span>
            <strong>{item.title}</strong>
          </div>
        </article>
      ))}
    </section>
  );
}

function AboutSection() {
  return (
    <section className={styles.aboutSection} id="studio">
      <SectionHeading
        eyebrow="Nosso negócio é o seu estilo"
        title="Mais que agenda cheia: padrão de atendimento e resultado."
      />
      <div className={styles.aboutGrid}>
        <article className={styles.aboutCardLarge}>
          <p className={styles.benefitsTitle}>Por que escolher a gente?</p>
          <ul className={styles.benefitsList}>
            <li>Atendimento personalizado para o seu estilo</li>
            <li>Profissionais experientes e atualizados</li>
            <li>Ambiente confortável e acolhedor</li>
            <li>Agendamento prático e rápido</li>
            <li>Resultado consistente em cada visita</li>
          </ul>
        </article>
      </div>
    </section>
  );
}

function PlansSection({ config }: { config: SiteConfig }) {
  return (
    <section className={styles.section} id="clube">
      <SectionHeading
        eyebrow="Clube Prime"
        title="Planos pensados para fidelização e recorrência."
      />
      <div className={styles.planGrid}>
        {config.plans.map((plan) => (
          <article className={styles.planCard} key={plan.name}>
            <h3>{plan.name}</h3>
            <p>{plan.summary}</p>
            <strong>{plan.price}</strong>
            <a href="#contato">Saiba mais</a>
          </article>
        ))}
      </div>
    </section>
  );
}

function ServicesSection({ config }: { config: SiteConfig }) {
  return (
    <section className={styles.section} id="servicos">
      <SectionHeading
        eyebrow="Serviços"
        title="Catálogo claro, preços objetivos e atendimento com tempo definido."
      />
      <div className={styles.serviceGrid}>
        {config.services.map((service) => (
          <article className={styles.serviceCard} key={service.name}>
            <div className={styles.serviceVisual}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className={styles.serviceImage}
                src={service.image}
                alt={`Imagem do serviço ${service.name}`}
              />
            </div>
            <h3>{service.name}</h3>
            <p>{service.description}</p>
            <div className={styles.serviceMeta}>
              <strong>{service.price}</strong>
              <span>{service.membership}</span>
              <span>{service.duration}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function BookingSection({
  config,
  onNextAvailableChange,
}: {
  config: SiteConfig;
  onNextAvailableChange: (slot: NextAvailableSlot) => void;
}) {
  const [selectedService, setSelectedService] = useState<string>(
    config.services[2]?.name ?? config.services[0]?.name ?? "",
  );
  const [selectedBarber, setSelectedBarber] = useState<string>(
    config.barbers[0]?.name ?? "",
  );
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [availabilityMessage, setAvailabilityMessage] = useState<string>("");
  const [bookingFeedback, setBookingFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [bookingSuccessState, setBookingSuccessState] = useState<BookingSuccessState | null>(null);
  const [loadingAvailability, setLoadingAvailability] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [refreshToken, setRefreshToken] = useState<number>(0);

  useEffect(() => {
    const fallbackService = config.services[2]?.name ?? config.services[0]?.name ?? "";
    setSelectedService((current) =>
      config.services.some((service) => service.name === current) ? current : fallbackService,
    );
  }, [config.services]);

  useEffect(() => {
    const fallbackBarber = config.barbers[0]?.name ?? "";
    setSelectedBarber((current) =>
      config.barbers.some((barber) => barber.name === current) ? current : fallbackBarber,
    );
  }, [config.barbers]);

  const selectedServiceData = useMemo(
    () =>
      config.services.find((service) => service.name === selectedService) ??
      config.services[0],
    [config.services, selectedService],
  );

  const formattedDate = useMemo(() => formatSelectedDate(selectedDate), [selectedDate]);
  const businessAddress = useMemo(() => getBusinessAddress(config), [config]);

  useEffect(() => {
    let active = true;

    async function loadAvailability() {
      setLoadingAvailability(true);
      setAvailabilityMessage("");

      try {
        const params = new URLSearchParams({
          service: selectedService,
          barber: selectedBarber,
          date: selectedDate,
        });
        const response = await fetch(`/api/availability?${params.toString()}`, {
          cache: "no-store",
        });
        const payload = (await response.json()) as AvailabilityResponse & { error?: string };

        if (!response.ok) {
          throw new Error(payload.error ?? "Nao foi possivel consultar os horarios.");
        }

        if (!active) {
          return;
        }

        onNextAvailableChange(payload.nextAvailable);
        setAvailableTimes(payload.slots);
        setAvailabilityMessage(
          payload.closedReason ??
            (payload.slots.length === 0 ? "Nenhum horario livre para esta selecao." : ""),
        );
        setSelectedTime((currentTime) =>
          payload.slots.includes(currentTime) ? currentTime : payload.slots[0] ?? "",
        );
      } catch (error) {
        if (!active) {
          return;
        }

        onNextAvailableChange(null);
        setAvailableTimes([]);
        setSelectedTime("");
        setAvailabilityMessage(
          error instanceof Error
            ? error.message
            : "Nao foi possivel consultar os horarios.",
        );
      } finally {
        if (active) {
          setLoadingAvailability(false);
        }
      }
    }

    void loadAvailability();

    return () => {
      active = false;
    };
  }, [onNextAvailableChange, refreshToken, selectedBarber, selectedDate, selectedService]);

  async function handleSubmit() {
    setBookingFeedback(null);

    if (!selectedTime) {
      setBookingFeedback({
        type: "error",
        message: "Selecione um horario disponivel antes de confirmar.",
      });
      return;
    }

    if (!customerName.trim() || !customerPhone.trim()) {
      setBookingFeedback({
        type: "error",
        message: "Preencha nome completo e WhatsApp para concluir o agendamento.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serviceName: selectedService,
          barberName: selectedBarber,
          date: selectedDate,
          time: selectedTime,
          customerName,
          customerPhone,
          notes,
        }),
      });
      const payload = (await response.json()) as { message?: string; error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Nao foi possivel concluir o agendamento.");
      }

      setBookingFeedback({
        type: "success",
        message: payload.message ?? "Agendamento confirmado com sucesso.",
      });
      setBookingSuccessState({
        customerName: customerName.trim(),
        serviceName: selectedService,
        barberName: selectedBarber,
        date: selectedDate,
        time: selectedTime,
      });
      setNotes("");
      setRefreshToken((current) => current + 1);
    } catch (error) {
      setBookingSuccessState(null);
      setBookingFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Nao foi possivel concluir o agendamento.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className={styles.section} id="agendamento">
      <SectionHeading
        eyebrow="Agendamento online"
        title="Agende seu horário em poucos passos."
      />
      <div className={styles.bookingLayout}>
        <form className={styles.bookingForm}>
          <label className={styles.field}>
            <span>Serviço</span>
            <select value={selectedService} onChange={(event) => setSelectedService(event.target.value)}>
              {config.services.map((service) => (
                <option key={service.name} value={service.name}>
                  {service.name}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span>Profissional</span>
            <select value={selectedBarber} onChange={(event) => setSelectedBarber(event.target.value)}>
              {config.barbers.map((barber) => (
                <option key={barber.name} value={barber.name}>
                  {barber.name}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span>Data</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
            />
          </label>

          <label className={styles.field}>
            <span>Nome completo</span>
            <input
              type="text"
              placeholder="Seu nome"
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
            />
          </label>

          <label className={styles.field}>
            <span>WhatsApp</span>
            <input
              type="tel"
              placeholder="(11) 99999-9999"
              value={customerPhone}
              onChange={(event) => setCustomerPhone(event.target.value)}
            />
          </label>

          <label className={styles.field}>
            <span>Observações</span>
            <textarea
              rows={4}
              placeholder="Ex.: preferência por acabamento na navalha"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </label>
        </form>

        <aside className={styles.bookingPanel}>
          <div className={styles.bookingIntro}>
            <span className={styles.panelTag}>Horários disponíveis</span>
            <h3>{formattedDate}</h3>
            <p>Selecione o horário ideal e confirme em minutos.</p>
          </div>

          <div className={styles.timeGrid}>
            {loadingAvailability ? (
              <p className={styles.bookingStatus}>Carregando horarios...</p>
            ) : availableTimes.length > 0 ? (
              availableTimes.map((time) => (
                <button
                  className={`${styles.timeSlot} ${
                    selectedTime === time ? styles.timeSlotActive : ""
                  }`}
                  key={time}
                  type="button"
                  onClick={() => setSelectedTime(time)}
                >
                  {time}
                </button>
              ))
            ) : (
              <p className={`${styles.bookingStatus} ${styles.bookingStatusError}`}>
                {availabilityMessage}
              </p>
            )}
          </div>

          <div className={styles.bookingSummary}>
            <strong>Resumo da reserva</strong>
            <p>
              {selectedServiceData.name} com {selectedBarber}
            </p>
            <p>
              {formattedDate} {selectedTime ? `as ${selectedTime}` : ""}
            </p>
            <p>Duração estimada: {selectedServiceData.duration}</p>
            <p>{businessAddress}</p>
          </div>

          {bookingFeedback ? (
            <div
              className={`${styles.bookingStatus} ${
                bookingFeedback.type === "success"
                  ? styles.bookingStatusSuccess
                  : styles.bookingStatusError
              }`}
            >
              <p>{bookingFeedback.message}</p>
              {bookingFeedback.type === "success" && bookingSuccessState ? (
                <a
                  className={styles.secondary}
                  href={buildWhatsappUrl(
                    config.whatsapp,
                    buildCustomerWhatsappMessage(bookingSuccessState),
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Enviar no WhatsApp
                </a>
              ) : null}
            </div>
          ) : null}

          <button
            className={styles.primary}
            type="button"
            onClick={() => void handleSubmit()}
            disabled={isSubmitting || loadingAvailability || !selectedTime}
          >
            {isSubmitting ? "Confirmando..." : "Confirmar agendamento"}
          </button>
        </aside>
      </div>
    </section>
  );
}

function StatsSection({
  config,
  averageRatingValue,
}: {
  config: SiteConfig;
  averageRatingValue?: string;
}) {
  const displayStats = getDisplayStats(config, averageRatingValue);

  return (
    <section className={styles.statsSection}>
      <div className={styles.statsGrid}>
        {displayStats.map((item) => (
          <article className={styles.statCard} key={item.label}>
            <strong>{item.value}</strong>
            <p>{item.label}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function ContactSection({ config }: { config: SiteConfig }) {
  const businessAddress = useMemo(() => getBusinessAddress(config), [config]);
  const mapQuery = useMemo(() => getBusinessMapQuery(config), [config]);
  const mapUrl = useMemo(() => {
    return `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`;
  }, [mapQuery]);
  const googleMapsDirectionsUrl = useMemo(() => {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapQuery)}`;
  }, [mapQuery]);
  const wazeDirectionsUrl = useMemo(() => {
    return `https://www.waze.com/ul?q=${encodeURIComponent(mapQuery)}&navigate=yes`;
  }, [mapQuery]);

  return (
    <section className={styles.contactSection} id="contato">
      <div className={styles.contactMapCard}>
        <div className={styles.contactMapHeader}>
          <span className={styles.contactLabel}>Localização</span>
          <p>Veja a localização da barbearia e escolha a melhor rota até o studio.</p>
        </div>
        <div className={styles.contactMapFrame}>
          <div className={styles.contactMapActions}>
            <a
              className={styles.mapActionButton}
              href={googleMapsDirectionsUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="Abrir rota no Google Maps"
              title="Abrir rota no Google Maps"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className={styles.mapActionIcon}
                src="/img/Google_Maps_Logo_2020.svg"
                alt=""
              />
            </a>
            <a
              className={styles.mapActionButton}
              href={wazeDirectionsUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="Abrir rota no Waze"
              title="Abrir rota no Waze"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className={styles.mapActionIcon} src="/img/waze.svg" alt="" />
            </a>
          </div>
          <iframe
            title={`Mapa de ${config.businessName}`}
            src={mapUrl}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>

      <div className={styles.contactCard}>
        <div className={styles.contactIntro}>
          <p className={styles.sectionEyebrow}>Contato</p>
          <h2>Garanta seu horário agora.</h2>
        </div>
        <div>
          <span className={styles.contactLabel}>Endereço</span>
          <p>{businessAddress}</p>
        </div>
        <div>
          <span className={styles.contactLabel}>Horários</span>
          <p>Seg a sex, 9h às 20h | Sáb, 8h às 18h</p>
        </div>
        <div>
          <span className={styles.contactLabel}>WhatsApp</span>
          <p>{formatWhatsappDisplay(config.whatsapp)}</p>
        </div>
        <div className={styles.contactActions}>
          <a className={styles.primary} href={`https://wa.me/55${config.whatsapp.replace(/\D/g, "")}`}>
            Agendar pelo WhatsApp
          </a>
          <Link className={styles.contactSecondaryButton} href="/agendamento">
            Agendar no site
          </Link>
        </div>
      </div>
    </section>
  );
}

export function FooterSection() {
  return (
    <footer className={styles.footer}>
      <DaBiTechSignature
        containerClassName={styles.footerInner}
        labelClassName={styles.footerLabel}
        logoClassName={styles.footerLogo}
        linkClassName={styles.footerLink}
      />
    </footer>
  );
}

export function HomePage({ homeBasePath = "/" }: { homeBasePath?: string }) {
  const config = useSiteConfig();
  const [nextAvailable, setNextAvailable] = useState<NextAvailableSlot>(null);
  const [customerSession, setCustomerSession] = useState<CustomerSession | null>(null);
  const [profilePoints, setProfilePoints] = useState(0);
  const [averageRatingValue, setAverageRatingValue] = useState("5,0/5");

  useEffect(() => {
    function syncCustomerSession() {
      setCustomerSession(readCustomerSession());
    }

    syncCustomerSession();
    window.addEventListener(CUSTOMER_SESSION_EVENT, syncCustomerSession);

    return () => {
      window.removeEventListener(CUSTOMER_SESSION_EVENT, syncCustomerSession);
    };
  }, []);

  useEffect(() => {
    if (!customerSession) {
      setProfilePoints(0);
      return;
    }

    const customerId = customerSession.id;
    let active = true;

    async function loadProfilePoints() {
      try {
        const response = await fetch(
          `/api/customers/loyalty?customerId=${encodeURIComponent(customerId)}`,
          { cache: "no-store" },
        );
        const payload = (await response.json()) as { points?: number };

        if (!response.ok) {
          throw new Error();
        }

        if (active) {
          setProfilePoints(payload.points ?? 0);
        }
      } catch {
        if (active) {
          setProfilePoints(0);
        }
      }
    }

    void loadProfilePoints();

    return () => {
      active = false;
    };
  }, [customerSession]);

  useEffect(() => {
    let active = true;

    async function loadAverageRating() {
      try {
        const localTestimonials = config.testimonials.map((item) => ({
          rating: 5,
          quote: item.quote,
        }));
        const customerReviews = readCustomerReviews().map((item) => ({
          rating: item.rating ?? 5,
          quote: item.quote,
        }));

        const response = await fetch("/api/google-reviews", {
          cache: "no-store",
        });
        const payload = (await response.json()) as {
          reviews?: Array<{ rating?: number; quote?: string }>;
        };

        const googleReviews = (payload.reviews ?? []).map((item) => ({
          rating: item.rating ?? 5,
          quote: item.quote ?? "",
        }));

        const allReviews = [...localTestimonials, ...customerReviews, ...googleReviews].filter(
          (item) => item.quote,
        );

        const average =
          allReviews.length > 0
            ? allReviews.reduce((total, item) => total + (item.rating ?? 5), 0) /
              allReviews.length
            : 5;

        if (active) {
          setAverageRatingValue(`${average.toFixed(1).replace(".", ",")}/5`);
        }
      } catch {
        if (active) {
          setAverageRatingValue("5,0/5");
        }
      }
    }

    void loadAverageRating();

    return () => {
      active = false;
    };
  }, [config.testimonials]);

  useEffect(() => {
    let active = true;

    async function loadNextAvailable() {
      const defaultService = config.services[2]?.name ?? config.services[0]?.name;
      const defaultBarber = config.barbers[0]?.name;

      if (!defaultService || !defaultBarber) {
        setNextAvailable(null);
        return;
      }

      try {
        const params = new URLSearchParams({
          service: defaultService,
          barber: defaultBarber,
          date: getTodayDateString(),
        });
        const response = await fetch(`/api/availability?${params.toString()}`, {
          cache: "no-store",
        });
        const payload = (await response.json()) as AvailabilityResponse & { error?: string };

        if (!response.ok) {
          throw new Error(payload.error ?? "Nao foi possivel consultar a agenda.");
        }

        if (active) {
          setNextAvailable(payload.nextAvailable);
        }
      } catch {
        if (active) {
          setNextAvailable(null);
        }
      }
    }

    void loadNextAvailable();

    return () => {
      active = false;
    };
  }, [config.barbers, config.services]);

  return (
    <div className={styles.page}>
      <section className={styles.heroShell}>
        <Header
          config={config}
          homeBasePath={homeBasePath}
          profileHref="/agendamento#acesso-cliente"
          profileTitle={customerSession ? `Perfil de ${customerSession.name}` : "Acesso do cliente"}
          profileName={customerSession?.name}
          profileSubtitle={customerSession?.email || customerSession?.phone}
          profilePoints={profilePoints}
          profileRole={customerSession?.role}
          onProfileLogout={() => {
            writeCustomerSession(null);
            setCustomerSession(null);
            setProfilePoints(0);
          }}
        />
        <main className={styles.main}>
          <HeroSection config={config} nextAvailable={nextAvailable} />
          <ShowcaseSection config={config} />
        </main>
      </section>

      <section className={styles.contentSurface}>
        <div className={styles.contentInner}>
          <AboutSection />
          <StatsSection config={config} averageRatingValue={averageRatingValue} />
          <PlansSection config={config} />
          <ServicesSection config={config} />
          <ContactSection config={config} />
          <FooterSection />
        </div>
      </section>
    </div>
  );
}
