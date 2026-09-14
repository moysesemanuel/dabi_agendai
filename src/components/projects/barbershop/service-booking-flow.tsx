"use client";

import { useEffect, useMemo, useState } from "react";
import {
  readCustomerSession,
  type CustomerSession,
  writeCustomerSession,
} from "./customer-session";
import { readBookingCart, writeBookingCart } from "./cart-storage";
import bookingStyles from "./home-booking.module.css";
import layoutStyles from "./home-layout.module.css";
import sectionStyles from "./home-sections.module.css";
import flowStyles from "./service-booking-flow.module.css";
import { type ServiceItem, type SiteConfig } from "@/components/shared/site-config";
import { useToast } from "@/components/shared/toast-provider";

const styles = {
  ...layoutStyles,
  ...sectionStyles,
  ...bookingStyles,
  ...flowStyles,
};

const BOOKABLE_DAYS_AHEAD = 10;

type AuthMode = "login" | "register";

type AvailabilityResponse = {
  slots: string[];
  closedReason: string | null;
  nextAvailable: {
    date: string;
    time: string;
    barberName: string;
  } | null;
  error?: string;
};

function getTodayDateKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function getBookableDates() {
  return Array.from({ length: BOOKABLE_DAYS_AHEAD }, (_, index) => {
    const date = addDays(new Date(), index);
    const dateKey = `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}-${`${date.getDate()}`.padStart(2, "0")}`;

    return {
      value: dateKey,
      weekday: new Intl.DateTimeFormat("pt-BR", { weekday: "short" }).format(date),
      day: new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(date),
    };
  });
}

function parseDurationToMinutes(duration: string) {
  const minutes = Number(duration.replace(/[^\d]/g, ""));
  return Number.isFinite(minutes) ? minutes : 30;
}

function getEndTime(startTime: string, duration: string) {
  const [hours, minutes] = startTime.split(":").map(Number);
  const totalMinutes = hours * 60 + minutes + parseDurationToMinutes(duration);
  const endHours = `${Math.floor(totalMinutes / 60)}`.padStart(2, "0");
  const endMinutes = `${totalMinutes % 60}`.padStart(2, "0");
  return `${endHours}:${endMinutes}`;
}

function formatDateLabel(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(new Date(`${date}T12:00:00`));
}

function getBarberImage(name: string) {
  const imagesByBarber: Record<string, string> = {
    "Rafael Costa": "/img/um-cliente-a-cortar-o-cabelo-num-barbeiro_1303-20861.avif",
    "Mateus Lima": "/img/homem-bonito-na-barbearia-barbeando-a-barba_1303-26258.avif",
    "João Vitor": "/img/VISS-Babearia-Visagista.jpg",
  };

  return imagesByBarber[name] ?? "/img/espaco-masculino-interior-de-barbearia-moderna-gerado-por-ia_866663-5580.avif";
}

type SelectionState = {
  service: ServiceItem;
  date: string;
  barberName: string;
  time: string;
};

export function ServiceBookingFlow({ config }: { config: SiteConfig }) {
  const { showToast } = useToast();
  const [customerSession, setCustomerSession] = useState<CustomerSession | null>(null);
  const [pendingService, setPendingService] = useState<ServiceItem | null>(null);
  const [selection, setSelection] = useState<SelectionState | null>(null);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [availabilityMessage, setAvailabilityMessage] = useState("");
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);
  const [isSubmittingAppointment, setIsSubmittingAppointment] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authError, setAuthError] = useState("");
  const [bookingFeedback, setBookingFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [authName, setAuthName] = useState("");
  const [authPhone, setAuthPhone] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [preferSilent, setPreferSilent] = useState(false);
  const [notes, setNotes] = useState("");
  const bookableDates = useMemo(() => getBookableDates(), []);
  const selectedServiceName = selection?.service.name ?? "";
  const selectedBarberName = selection?.barberName ?? "";
  const selectedDate = selection?.date ?? "";

  const availableBarbersForDate = useMemo(
    () =>
      config.barbers.filter(
        (barber) =>
          !config.barberTimeOff.some(
            (timeOff) => timeOff.barberName === barber.name && timeOff.date === selectedDate,
          ),
      ),
    [config.barbers, config.barberTimeOff, selectedDate],
  );

  useEffect(() => {
    setCustomerSession(readCustomerSession());
  }, []);

  useEffect(() => {
    if (!isSelectionModalOpen || !selectedServiceName || !selectedBarberName) {
      return;
    }
    let active = true;

    async function loadAvailability() {
      setLoadingAvailability(true);
      setAvailabilityMessage("");

      try {
        const params = new URLSearchParams({
          service: selectedServiceName,
          barber: selectedBarberName,
          date: selectedDate,
        });

        const response = await fetch(`/api/availability?${params.toString()}`, {
          cache: "no-store",
        });
        const payload = (await response.json()) as AvailabilityResponse;

        if (!response.ok) {
          throw new Error(payload.error ?? "Nao foi possivel consultar os horarios.");
        }

        if (!active) {
          return;
        }

        setAvailableTimes(payload.slots);
        setAvailabilityMessage(
          payload.closedReason ?? (payload.slots.length === 0 ? "Nenhum horario livre para este profissional nesta data." : ""),
        );
        setSelection((current) =>
          current
            ? {
                ...current,
                time: payload.slots.includes(current.time) ? current.time : "",
              }
            : current,
        );
      } catch (error) {
        if (!active) {
          return;
        }

        setAvailableTimes([]);
        setAvailabilityMessage(
          error instanceof Error ? error.message : "Nao foi possivel consultar os horarios.",
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
  }, [isSelectionModalOpen, selectedBarberName, selectedDate, selectedServiceName]);

  const selectedBarberImage = selection?.barberName ? getBarberImage(selection.barberName) : "";
  const selectedEndTime =
    selection?.time && selection?.service
      ? getEndTime(selection.time, selection.service.duration)
      : "";

  function startServiceFlow(service: ServiceItem) {
    setBookingFeedback(null);

    if (!customerSession) {
      setPendingService(service);
      setAuthMode("login");
      setIsAuthModalOpen(true);
      return;
    }

    setSelection({
      service,
      date: getTodayDateKey(),
      barberName: "",
      time: "",
    });
    setAvailableTimes([]);
    setAvailabilityMessage("");
    setPreferSilent(false);
    setNotes("");
    setIsSelectionModalOpen(true);
  }

  async function handleCustomerAccess() {
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

    if (authMode === "register" && !privacyConsent) {
      const message = "Confirme que leu a Política de Privacidade para criar a conta.";
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
      setCustomerSession(payload.customer);
      setIsAuthModalOpen(false);
      setAuthPassword("");
      setPrivacyConsent(false);
      showToast({
        variant: "success",
        message: authMode === "login" ? "Login realizado com sucesso." : "Conta criada com sucesso.",
      });

      if (pendingService) {
        const nextService = pendingService;
        setPendingService(null);
        startServiceFlow(nextService);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Nao foi possivel acessar sua conta.";
      setAuthError(message);
      showToast({ variant: "error", message });
    } finally {
      setIsSubmittingAuth(false);
    }
  }

  async function handleConfirmAppointment() {
    if (!selection || !selection.time || !customerSession) {
      return;
    }

    setIsSubmittingAppointment(true);
    setBookingFeedback(null);

    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serviceName: selection.service.name,
          barberName: selection.barberName,
          date: selection.date,
          time: selection.time,
          customerId: customerSession.id,
          customerPhone: customerSession.phone,
          preferSilent,
          notes,
        }),
      });

      const payload = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Nao foi possivel concluir o agendamento.");
      }

      setBookingFeedback({
        type: "success",
        message: payload.message ?? "Agendamento confirmado com sucesso.",
      });
      showToast({
        variant: "success",
        message: payload.message ?? "Agendamento confirmado com sucesso.",
      });
      setIsConfirmModalOpen(false);
      setIsSelectionModalOpen(false);
      setSelection(null);
      setAvailableTimes([]);
      setPreferSilent(false);
      setNotes("");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Nao foi possivel concluir o agendamento.";
      setBookingFeedback({
        type: "error",
        message,
      });
      showToast({ variant: "error", message });
    } finally {
      setIsSubmittingAppointment(false);
    }
  }

  function handleAddToCart() {
    if (!selection || !selection.time) {
      return;
    }

    const currentItems = readBookingCart<{
      id: string;
      serviceName: string;
      barberName: string;
      barberImage: string;
      date: string;
      time: string;
      endTime: string;
      price: string;
      duration: string;
      preferSilent: boolean;
      notes: string;
    }>();

    const nextItems = [
      ...currentItems,
      {
        id: `${selection.service.name}-${selection.barberName}-${selection.date}-${selection.time}`,
        serviceName: selection.service.name,
        barberName: selection.barberName,
        barberImage: getBarberImage(selection.barberName),
        date: selection.date,
        time: selection.time,
        endTime: getEndTime(selection.time, selection.service.duration),
        price: selection.service.price,
        duration: selection.service.duration,
        preferSilent,
        notes,
      },
    ].filter(
      (item, index, array) => array.findIndex((entry) => entry.id === item.id) === index,
    );

    writeBookingCart(nextItems);
    showToast({
      variant: "success",
      message: "Serviço adicionado ao carrinho.",
    });
    setBookingFeedback({
      type: "success",
      message: "Servico adicionado ao carrinho. Voce pode incluir outro atendimento antes de confirmar.",
    });
    setIsConfirmModalOpen(false);
    setIsSelectionModalOpen(false);
    setSelection(null);
    setAvailableTimes([]);
    setPreferSilent(false);
    setNotes("");
  }

  return (
    <section className={styles.section} id="acesso-cliente">
      <div className={styles.topBar}>
        <div className={styles.intro}>
          <span className={styles.sectionEyebrow}>Agendamento online</span>
          <h2>Escolha seu serviço e monte o agendamento etapa por etapa.</h2>
        </div>
      </div>

      {bookingFeedback ? (
        <div
          className={`${styles.feedback} ${bookingFeedback.type === "success" ? styles.feedbackSuccess : styles.feedbackError}`}
        >
          {bookingFeedback.message}
        </div>
      ) : null}

      <div className={styles.serviceGrid}>
        {config.services.map((service) => (
          <article className={styles.serviceCard} key={service.name}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={styles.serviceImage} src={service.image} alt={`Imagem do serviço ${service.name}`} />
            <div className={styles.serviceBody}>
              <strong>{service.name}</strong>
              <span>{service.description}</span>
              <div className={styles.serviceMeta}>
                <span>{service.price}</span>
                <span>{service.duration}</span>
              </div>
              <button className={styles.primary} onClick={() => startServiceFlow(service)} type="button">
                Agendar
              </button>
            </div>
          </article>
        ))}
      </div>

      {isAuthModalOpen ? (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modal} ${styles.modalCompact}`}>
            <button
              className={styles.modalCloseButton}
              onClick={() => {
                setIsAuthModalOpen(false);
                setAuthError("");
                setPendingService(null);
              }}
              type="button"
              aria-label="Fechar modal de acesso"
            >
              ×
            </button>
            <div className={styles.modalHeader}>
              <span className={styles.sectionEyebrow}>Login do cliente</span>
              <h3>
                {authMode === "login"
                  ? "Faça login para continuar o agendamento."
                  : "Crie sua conta para continuar o agendamento."}
              </h3>
            </div>

            <div className={styles.modalActions}>
              <button
                className={authMode === "login" ? styles.modeButtonActive : styles.modeButton}
                onClick={() => {
                  setAuthMode("login");
                  setAuthError("");
                }}
                type="button"
              >
                Entrar
              </button>
              <button
                className={authMode === "register" ? styles.modeButtonActive : styles.modeButton}
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
                void handleCustomerAccess();
              }}
            >
              <div className={styles.fieldGrid}>
              {authMode === "register" ? (
                <label className={styles.field}>
                  <span>Nome completo</span>
                  <input value={authName} onChange={(event) => setAuthName(event.target.value)} />
                </label>
              ) : null}
              <label className={styles.field}>
                <span>E-mail</span>
                <input
                  type="email"
                  value={authEmail}
                  onChange={(event) => setAuthEmail(event.target.value)}
                />
              </label>
              <label className={styles.field}>
                <span>Senha</span>
                <input
                  type="password"
                  value={authPassword}
                  onChange={(event) => setAuthPassword(event.target.value)}
                />
                {authMode === "register" ? (
                  <small className={styles.fieldHint}>
                    Use no mínimo 6 caracteres para criar sua senha.
                  </small>
                ) : null}
              </label>
              {authMode === "register" ? (
                <label className={`${styles.field} ${styles.fieldWide}`}>
                  <span>WhatsApp</span>
                  <input value={authPhone} onChange={(event) => setAuthPhone(event.target.value)} />
                </label>
              ) : null}
              </div>

              {authMode === "register" ? (
                <label className={styles.consentField}>
                  <input
                    type="checkbox"
                    checked={privacyConsent}
                    onChange={(event) => setPrivacyConsent(event.target.checked)}
                  />
                  <span>
                    Li e concordo com a{" "}
                    <a href="/privacidade" target="_blank" rel="noreferrer">
                      Política de Privacidade
                    </a>
                    .
                  </span>
                </label>
              ) : null}

              {authError ? (
                <div className={`${styles.feedback} ${styles.feedbackError}`}>{authError}</div>
              ) : null}

              <div className={styles.modalActions}>
                <button className={styles.modalSecondaryButton} onClick={() => setIsAuthModalOpen(false)} type="button">
                  Fechar
                </button>
                <button className={styles.modalPrimaryButton} type="submit">
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

      {isSelectionModalOpen && selection ? (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <button
              className={styles.modalCloseButton}
              onClick={() => {
                setIsSelectionModalOpen(false);
                setIsConfirmModalOpen(false);
                setSelection(null);
              }}
              type="button"
              aria-label="Fechar modal de seleção"
            >
              ×
            </button>
            <div className={styles.modalHeader}>
              <span className={styles.sectionEyebrow}>{selection.service.name}</span>
              <h3>Escolha data, profissional e horário.</h3>
            </div>

            <div className={styles.selectionGrid}>
              <div className={styles.selectionSection}>
                <h4>Datas disponíveis</h4>
                <div className={styles.dateGrid}>
                  {bookableDates.map((date) => (
                    <button
                      className={`${styles.dateCard} ${selection.date === date.value ? styles.dateCardActive : ""}`}
                      key={date.value}
                      onClick={() =>
                        setSelection((current) => {
                          if (!current) {
                            return current;
                          }

                          const stillAvailable = config.barbers.some(
                            (barber) =>
                              barber.name === current.barberName &&
                              !config.barberTimeOff.some(
                                (timeOff) =>
                                  timeOff.barberName === barber.name && timeOff.date === date.value,
                              ),
                          );

                          return {
                            ...current,
                            date: date.value,
                            time: "",
                            barberName: stillAvailable ? current.barberName : "",
                          };
                        })
                      }
                      type="button"
                    >
                      <strong>{date.weekday}</strong>
                      <span>{date.day}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.selectionSection}>
                <h4>Profissionais</h4>
                {availableBarbersForDate.length === 0 ? (
                  <div className={styles.helperCard}>
                    Nenhum profissional disponível nesta data. Escolha outra data.
                  </div>
                ) : (
                <div className={styles.barberGrid}>
                  {availableBarbersForDate.map((barber) => (
                    <button
                      className={`${styles.barberCard} ${selection.barberName === barber.name ? styles.barberCardActive : ""}`}
                      key={barber.name}
                      onClick={() =>
                        setSelection((current) =>
                          current ? { ...current, barberName: barber.name, time: "" } : current,
                        )
                      }
                      type="button"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img className={styles.barberImage} src={getBarberImage(barber.name)} alt={barber.name} />
                      <strong>{barber.name}</strong>
                      <span>{barber.role}</span>
                    </button>
                  ))}
                </div>
                )}
              </div>

              <div className={styles.selectionSection}>
                <h4>Horários disponíveis</h4>
                {!selection.barberName ? (
                  <div className={styles.helperCard}>
                    Escolha um profissional para buscar os horários disponíveis
                    para agendamento.
                  </div>
                ) : loadingAvailability ? (
                  <div className={styles.helperCard}>Buscando horários disponíveis...</div>
                ) : availableTimes.length === 0 ? (
                  <div className={styles.helperCard}>
                    {availabilityMessage || "Nenhum horário livre para esta combinação."}
                  </div>
                ) : (
                  <div className={styles.timeGrid}>
                    {availableTimes.map((time) => (
                      <button
                        className={`${styles.timeSlot} ${selection.time === time ? styles.timeSlotActive : ""}`}
                        key={time}
                        onClick={() => {
                          setSelection((current) => (current ? { ...current, time } : current));
                          setIsConfirmModalOpen(true);
                        }}
                        type="button"
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className={styles.modalActions}>
              <button
                className={styles.secondary}
                onClick={() => {
                  setIsSelectionModalOpen(false);
                  setSelection(null);
                }}
                type="button"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isConfirmModalOpen && selection ? (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modal} ${styles.modalCompact}`}>
            <button
              className={styles.modalCloseButton}
              onClick={() => setIsConfirmModalOpen(false)}
              type="button"
              aria-label="Fechar modal de confirmação"
            >
              ×
            </button>
            <div className={styles.modalHeader}>
              <span className={styles.sectionEyebrow}>Confirmar agendamento</span>
              <h3>Revise os dados antes de concluir.</h3>
            </div>

            <div className={styles.summaryCard}>
              <div className={styles.summaryHead}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className={styles.summaryImage} src={selection.service.image} alt={selection.service.name} />
                <div className={styles.summaryMeta}>
                  <strong>{selection.service.name}</strong>
                  <span>{selection.service.description}</span>
                  <div className={styles.summaryLine}>
                    <span>{selection.service.price}</span>
                    <span>{selection.service.duration}</span>
                  </div>
                </div>
              </div>

              <div className={styles.summaryHead}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className={styles.summaryImage} src={selectedBarberImage} alt={selection.barberName} />
                <div className={styles.summaryMeta}>
                  <strong>{selection.barberName}</strong>
                  <span>{formatDateLabel(selection.date)}</span>
                  <div className={styles.summaryLine}>
                    <span>
                      {selection.time} - {selectedEndTime}
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.toggleRow}>
                <div>
                  <strong>Não quero conversar durante o atendimento</strong>
                  <span> Marque se preferir uma experiência mais silenciosa.</span>
                </div>
                <button
                  className={`${styles.toggle} ${preferSilent ? styles.toggleActive : ""}`}
                  onClick={() => setPreferSilent((current) => !current)}
                  type="button"
                  aria-pressed={preferSilent}
                />
              </div>

              <label className={styles.field}>
                <span>Alguma observação</span>
                <textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
              </label>
            </div>

            <div className={styles.modalActions}>
              <button className={styles.surfaceSecondaryButton} onClick={handleAddToCart} type="button">
                Adicionar ao carrinho
              </button>
              <button className={styles.surfacePrimaryButton} onClick={() => void handleConfirmAppointment()} type="button">
                {isSubmittingAppointment ? "Confirmando..." : "Confirmar agendamento"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
