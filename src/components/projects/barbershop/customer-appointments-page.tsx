"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import styles from "./customer-appointments-page.module.css";
import {
  CUSTOMER_SESSION_EVENT,
  type CustomerSession,
  readCustomerSession,
  writeCustomerSession,
} from "./customer-session";
import { FooterSection, Header } from "./home-page";
import { useSiteConfig } from "./use-site-config";
import flowStyles from "./service-booking-flow.module.css";
import { useToast } from "@/components/shared/toast-provider";

type CustomerAppointment = {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  notes?: string | null;
  preferSilent: boolean;
  status: "SCHEDULED" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  startsAt: string;
  endsAt: string;
  barberName: string;
  serviceName: string;
  servicePriceInCents: number;
  serviceDurationMinutes: number;
};

type AppointmentsResponse = {
  appointments?: CustomerAppointment[];
  error?: string;
};

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

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function getBookableDates() {
  return Array.from({ length: 10 }, (_, index) => {
    const date = addDays(new Date(), index);
    const value = `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}-${`${date.getDate()}`.padStart(2, "0")}`;

    return {
      value,
      weekday: new Intl.DateTimeFormat("pt-BR", {
        weekday: "short",
        timeZone: "UTC",
      }).format(new Date(`${value}T12:00:00Z`)),
      day: new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        timeZone: "UTC",
      }).format(new Date(`${value}T12:00:00Z`)),
    };
  });
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(date));
}

function formatTime(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(date));
}

function formatCurrency(priceInCents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(priceInCents / 100);
}

function getStatusLabel(status: CustomerAppointment["status"]) {
  const labels = {
    SCHEDULED: "Agendado",
    CONFIRMED: "Confirmado",
    CANCELLED: "Cancelado",
    COMPLETED: "Concluído",
  } as const;

  return labels[status];
}

function getStatusClass(status: CustomerAppointment["status"]) {
  const classes = {
    SCHEDULED: styles.statusScheduled,
    CONFIRMED: styles.statusConfirmed,
    CANCELLED: styles.statusCancelled,
    COMPLETED: styles.statusCompleted,
  } as const;

  return classes[status];
}

function isUpcomingAppointment(appointment: CustomerAppointment) {
  return appointment.status !== "CANCELLED" && new Date(appointment.startsAt).getTime() > Date.now();
}

export function CustomerAppointmentsPage() {
  const config = useSiteConfig();
  const { showToast } = useToast();
  const [customerSession, setCustomerSession] = useState<CustomerSession | null>(null);
  const [appointments, setAppointments] = useState<CustomerAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingAppointment, setEditingAppointment] = useState<CustomerAppointment | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [availabilityMessage, setAvailabilityMessage] = useState("");
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [isSubmittingChange, setIsSubmittingChange] = useState(false);
  const bookableDates = useMemo(() => getBookableDates(), []);

  useEffect(() => {
    function syncCustomerSession() {
      const nextSession = readCustomerSession();
      setCustomerSession(nextSession);

      if (!nextSession) {
        setAppointments([]);
        setError("");
      }
    }

    syncCustomerSession();
    window.addEventListener(CUSTOMER_SESSION_EVENT, syncCustomerSession);

    return () => {
      window.removeEventListener(CUSTOMER_SESSION_EVENT, syncCustomerSession);
    };
  }, []);

  useEffect(() => {
    if (!customerSession) {
      setIsLoading(false);
      return;
    }

    const customerId = customerSession.id;
    let active = true;

    async function loadAppointments() {
      setIsLoading(true);

      try {
        const response = await fetch(`/api/appointments?customerId=${customerId}`, {
          cache: "no-store",
        });
        const payload = (await response.json()) as AppointmentsResponse;

        if (!response.ok) {
          throw new Error(payload.error ?? "Nao foi possivel carregar seus agendamentos.");
        }

        if (!active) {
          return;
        }

        setAppointments(payload.appointments ?? []);
        setError("");
      } catch (nextError) {
        if (!active) {
          return;
        }

        setAppointments([]);
        setError(
          nextError instanceof Error
            ? nextError.message
            : "Nao foi possivel carregar seus agendamentos.",
        );
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadAppointments();

    return () => {
      active = false;
    };
  }, [customerSession]);

  useEffect(() => {
    if (!editingAppointment || !selectedDate) {
      return;
    }

    const appointment = editingAppointment;
    let active = true;

    async function loadAvailability() {
      setIsLoadingAvailability(true);
      setAvailabilityMessage("");

      try {
        const params = new URLSearchParams({
          service: appointment.serviceName,
          barber: appointment.barberName,
          date: selectedDate,
          excludeAppointmentId: appointment.id,
        });

        const response = await fetch(`/api/availability?${params.toString()}`, {
          cache: "no-store",
        });
        const payload = (await response.json()) as AvailabilityResponse;

        if (!response.ok) {
          throw new Error(payload.error ?? "Nao foi possivel carregar os horários.");
        }

        if (!active) {
          return;
        }

        setAvailableTimes(payload.slots);
        setAvailabilityMessage(
          payload.closedReason ??
            (payload.slots.length === 0
              ? "Nenhum horário livre para este profissional nesta data."
              : ""),
        );
        setSelectedTime((current) => (payload.slots.includes(current) ? current : ""));
      } catch (nextError) {
        if (!active) {
          return;
        }

        setAvailableTimes([]);
        setAvailabilityMessage(
          nextError instanceof Error ? nextError.message : "Nao foi possivel carregar os horários.",
        );
      } finally {
        if (active) {
          setIsLoadingAvailability(false);
        }
      }
    }

    void loadAvailability();

    return () => {
      active = false;
    };
  }, [editingAppointment, selectedDate]);

  const upcomingAppointments = useMemo(
    () => appointments.filter((appointment) => isUpcomingAppointment(appointment)),
    [appointments],
  );
  const pastAppointments = useMemo(
    () => appointments.filter((appointment) => !isUpcomingAppointment(appointment)),
    [appointments],
  );

  function openRescheduleModal(appointment: CustomerAppointment) {
    const currentDate = appointment.startsAt.slice(0, 10);
    setEditingAppointment(appointment);
    setSelectedDate(currentDate);
    setSelectedTime("");
    setAvailableTimes([]);
    setAvailabilityMessage("");
  }

  function closeRescheduleModal() {
    setEditingAppointment(null);
    setSelectedDate("");
    setSelectedTime("");
    setAvailableTimes([]);
    setAvailabilityMessage("");
  }

  async function refreshAppointments() {
    if (!customerSession) {
      return;
    }

    const response = await fetch(`/api/appointments?customerId=${customerSession.id}`, {
      cache: "no-store",
    });
    const payload = (await response.json()) as AppointmentsResponse;

    if (!response.ok) {
      throw new Error(payload.error ?? "Nao foi possivel atualizar seus agendamentos.");
    }

    setAppointments(payload.appointments ?? []);
  }

  async function handleCancelAppointment(appointment: CustomerAppointment) {
    if (isSubmittingChange) {
      return;
    }

    setIsSubmittingChange(true);

    try {
      const response = await fetch(`/api/appointments/${appointment.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      const payload = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Nao foi possivel cancelar o agendamento.");
      }

      await refreshAppointments();
      showToast({
        variant: "success",
        message: payload.message ?? "Agendamento cancelado com sucesso.",
      });
    } catch (nextError) {
      showToast({
        variant: "error",
        message:
          nextError instanceof Error
            ? nextError.message
            : "Nao foi possivel cancelar o agendamento.",
      });
    } finally {
      setIsSubmittingChange(false);
    }
  }

  async function handleRescheduleAppointment() {
    if (!editingAppointment || !selectedDate || !selectedTime || isSubmittingChange) {
      return;
    }

    setIsSubmittingChange(true);

    try {
      const response = await fetch(`/api/appointments/${editingAppointment.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: selectedDate,
          time: selectedTime,
        }),
      });
      const payload = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Nao foi possivel remarcar o agendamento.");
      }

      await refreshAppointments();
      closeRescheduleModal();
      showToast({
        variant: "success",
        message: payload.message ?? "Agendamento remarcado com sucesso.",
      });
    } catch (nextError) {
      showToast({
        variant: "error",
        message:
          nextError instanceof Error
            ? nextError.message
            : "Nao foi possivel remarcar o agendamento.",
      });
    } finally {
      setIsSubmittingChange(false);
    }
  }

  function renderAppointmentsList(items: CustomerAppointment[], title: string, description: string) {
    return (
      <section className={styles.sectionCard}>
        <div className={styles.sectionHeading}>
          <span className={styles.eyebrow}>{title}</span>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>

        {items.length > 0 ? (
          <div className={styles.appointmentsGrid}>
            {items.map((appointment) => (
              <article className={styles.appointmentCard} key={appointment.id}>
                <div className={styles.appointmentMain}>
                  <div className={styles.appointmentHeader}>
                    <div>
                      <h3>{appointment.serviceName}</h3>
                      <p className={styles.appointmentMeta}>
                        com {appointment.barberName} às {formatTime(appointment.startsAt)}
                      </p>
                    </div>
                    <span className={`${styles.statusBadge} ${getStatusClass(appointment.status)}`}>
                      {getStatusLabel(appointment.status)}
                    </span>
                  </div>

                  <div className={styles.appointmentMetaGrid}>
                    <div className={styles.metaItem}>
                      <span>Data</span>
                      <strong>{formatDate(appointment.startsAt)}</strong>
                    </div>
                    <div className={styles.metaItem}>
                      <span>Horário</span>
                      <strong>
                        {formatTime(appointment.startsAt)} - {formatTime(appointment.endsAt)}
                      </strong>
                    </div>
                    <div className={styles.metaItem}>
                      <span>Investimento</span>
                      <strong>{formatCurrency(appointment.servicePriceInCents)}</strong>
                    </div>
                    <div className={styles.metaItem}>
                      <span>Duração</span>
                      <strong>{appointment.serviceDurationMinutes} min</strong>
                    </div>
                  </div>

                  {appointment.notes ? (
                    <p className={styles.appointmentNotes}>Observação: {appointment.notes}</p>
                  ) : null}
                </div>

                <aside className={styles.appointmentAside}>
                  <div>
                    <strong>{appointment.preferSilent ? "Atendimento silencioso" : "Atendimento padrão"}</strong>
                    <p className={styles.message}>
                      {appointment.preferSilent
                        ? "Sua preferência por menos conversa foi registrada nesse atendimento."
                        : "Você pode remarcar ou cancelar enquanto o horário ainda estiver futuro."}
                    </p>
                  </div>

                  {isUpcomingAppointment(appointment) ? (
                    <div className={styles.appointmentActions}>
                      <button
                        className={styles.secondaryButton}
                        onClick={() => openRescheduleModal(appointment)}
                        type="button"
                      >
                        Remarcar
                      </button>
                      <button
                        className={styles.dangerButton}
                        onClick={() => void handleCancelAppointment(appointment)}
                        type="button"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : null}
                </aside>
              </article>
            ))}
          </div>
        ) : (
          <div className={styles.emptyCard}>
            <strong>Nenhum agendamento nessa seção.</strong>
            <p>Assim que você reservar um horário, ele aparecerá aqui com ações rápidas.</p>
          </div>
        )}
      </section>
    );
  }

  return (
    <div className={styles.page}>
      <section className={styles.heroShell}>
        <Header
          config={config}
          homeLinks
          profileHref="/agendamentos"
          profileTitle={customerSession ? `Perfil de ${customerSession.name}` : "Acesso do cliente"}
          profileName={customerSession?.name}
          profileSubtitle={customerSession?.email || customerSession?.phone}
          profileRole={customerSession?.role}
          onProfileLogout={() => {
            writeCustomerSession(null);
            setCustomerSession(null);
          }}
        />

        <main className={styles.main}>
          <section className={styles.introCard}>
            <span className={styles.eyebrow}>Agendamentos</span>
            <h1>Gerencie seus horários sem sair da plataforma.</h1>
            <p>
              Aqui você acompanha os atendimentos futuros, consulta o histórico e pode remarcar ou
              cancelar reservas em poucos toques.
            </p>
          </section>

          {!customerSession ? (
            <section className={styles.emptyCard}>
              <strong>Faça login para acompanhar seus horários.</strong>
              <p>
                Entre com sua conta para visualizar reservas, remarcar atendimentos e acompanhar seu
                histórico no studio.
              </p>
              <div className={styles.emptyActions}>
                <Link className={styles.primaryButton} href="/agendamento">
                  Ir para agendamento
                </Link>
                <Link className={styles.secondaryButton} href="/">
                  Voltar para home
                </Link>
              </div>
            </section>
          ) : isLoading ? (
            <section className={styles.emptyCard}>
              <strong>Carregando seus agendamentos...</strong>
            </section>
          ) : error ? (
            <section className={styles.emptyCard}>
              <strong>Não foi possível carregar seus agendamentos.</strong>
              <p>{error}</p>
            </section>
          ) : (
            <>
              {renderAppointmentsList(
                upcomingAppointments,
                "Próximos horários",
                "Visualize os atendimentos futuros e ajuste o que precisar antes do horário.",
              )}
              {renderAppointmentsList(
                pastAppointments,
                "Histórico",
                "Consulte seus horários anteriores e o status de cada atendimento.",
              )}
            </>
          )}

          <FooterSection />
        </main>
      </section>

      {editingAppointment ? (
        <div className={flowStyles.modalOverlay}>
          <div className={flowStyles.modal}>
            <button
              className={flowStyles.modalCloseButton}
              onClick={closeRescheduleModal}
              type="button"
            >
              Fechar
            </button>

            <div className={styles.modalSection}>
              <span className={styles.eyebrow}>Remarcar</span>
              <h3>{editingAppointment.serviceName}</h3>
              <div className={styles.modalSummary}>
                <strong>{editingAppointment.barberName}</strong>
                <span>
                  Horário atual: {formatDate(editingAppointment.startsAt)} às{" "}
                  {formatTime(editingAppointment.startsAt)}
                </span>
              </div>
            </div>

            <div className={styles.modalSection}>
              <h3>Escolha a nova data</h3>
              <div className={styles.dateGrid}>
                {bookableDates.map((date) => (
                  <button
                    className={`${styles.dateCard} ${selectedDate === date.value ? styles.dateCardActive : ""}`}
                    key={date.value}
                    onClick={() => setSelectedDate(date.value)}
                    type="button"
                  >
                    <strong>{date.day}</strong>
                    <span>{date.weekday}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.modalSection}>
              <h3>Horários disponíveis</h3>
              {isLoadingAvailability ? (
                <p className={styles.message}>Consultando horários disponíveis...</p>
              ) : availableTimes.length > 0 ? (
                <div className={styles.timeGrid}>
                  {availableTimes.map((time) => (
                    <button
                      className={`${styles.timeCard} ${selectedTime === time ? styles.timeCardActive : ""}`}
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      type="button"
                    >
                      <strong>{time}</strong>
                      <span>{editingAppointment.barberName}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className={styles.message}>{availabilityMessage || "Nenhum horário livre nessa data."}</p>
              )}
            </div>

            <p className={styles.modalHint}>
              Sua remarcação mantém o mesmo serviço e o mesmo profissional. Só o horário será alterado.
            </p>

            <div className={flowStyles.modalActions}>
              <button
                className={styles.secondaryButton}
                onClick={closeRescheduleModal}
                type="button"
              >
                Voltar
              </button>
              <button
                className={styles.primaryButton}
                disabled={!selectedTime || isSubmittingChange}
                onClick={() => void handleRescheduleAppointment()}
                type="button"
              >
                {isSubmittingChange ? "Salvando..." : "Confirmar remarcação"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
