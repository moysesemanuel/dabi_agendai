"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "@/app/admin/admin.module.css";
import { AdminButton } from "@/components/projects/barbershop/admin/admin-button";
import { useSiteConfig } from "@/components/projects/barbershop/use-site-config";
import { readCustomerReviews } from "@/components/projects/barbershop/reviews-storage";
import { DaBiTechSignature } from "@/components/shared/dabi-tech-signature";
import {
  getDisplayStats,
  LEGACY_BUSINESS_TAG_PREFIX,
  type PlanItem,
  type LoyaltyRewardItem,
  type LoyaltyTierItem,
  SITE_CONFIG_UPDATED_EVENT,
} from "@/components/shared/site-config";
import { useToast } from "@/components/shared/toast-provider";
import { buildWhatsappUrl } from "@/components/shared/whatsapp";

function formatDateToPtBr(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00`));
}

function getDateParts(date: string) {
  const baseDate = new Date(`${date}T12:00:00`);

  return {
    day: new Intl.DateTimeFormat("pt-BR", { day: "2-digit", timeZone: "UTC" }).format(baseDate),
    month: new Intl.DateTimeFormat("pt-BR", { month: "short" })
      .format(baseDate)
      .replace(".", "")
      .toUpperCase(),
    full: formatDateToPtBr(date),
  };
}

function formatMonthYear(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function getTodayDateKey() {
  const now = new Date();
  return `${now.getFullYear()}-${`${now.getMonth() + 1}`.padStart(2, "0")}-${`${now.getDate()}`.padStart(2, "0")}`;
}

function formatAppointmentTime(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(date));
}

function parseDurationToMinutes(duration: string) {
  const minutes = Number(duration.replace(/[^\d]/g, ""));
  return Number.isFinite(minutes) ? minutes : 30;
}

function formatServicePrice(value: string) {
  const normalized = value.replace(/[^\d,.\s]/g, "").trim();

  if (!normalized) {
    return "";
  }

  const compact = normalized.replace(/\s/g, "");
  return compact.toLowerCase().startsWith("r$")
    ? compact.replace(/^r\$/i, "R$ ")
    : `R$ ${compact}`;
}

function formatServiceDuration(value: string) {
  const minutes = value.replace(/[^\d]/g, "");

  if (!minutes) {
    return "";
  }

  return `${minutes} min`;
}

function buildAppointmentWhatsappMessage(appointment: AdminAppointment) {
  return [
    `Olá, ${appointment.customerName}.`,
    "",
    "Seu horário na Prime Cut Studio está confirmado:",
    `${appointment.serviceName} com ${appointment.barberName}`,
    `${formatDateToPtBr(appointment.startsAt.slice(0, 10))} às ${formatAppointmentTime(appointment.startsAt)}`,
    "",
    "Se precisar remarcar, responda esta mensagem.",
  ].join("\n");
}

function buildAppointmentCancellationWhatsappMessage(appointment: AdminAppointment) {
  return [
    `Olá, ${appointment.customerName}.`,
    "",
    "Precisamos informar que seu horário na Prime Cut Studio foi cancelado.",
    `${appointment.serviceName} com ${appointment.barberName}`,
    `${formatDateToPtBr(appointment.startsAt.slice(0, 10))} às ${formatAppointmentTime(appointment.startsAt)}`,
    "",
    "Se quiser, podemos remarcar um novo horário para você.",
  ].join("\n");
}

type AdminAppointment = {
  id: string;
  customerName: string;
  customerPhone: string;
  notes: string | null;
  status: string;
  startsAt: string;
  endsAt: string;
  barberName: string;
  serviceName: string;
};

const ADMIN_NOTIFICATIONS_STORAGE_KEY = "dabi-agendai-admin-browser-notifications";
const ADMIN_SOUND_ALERTS_STORAGE_KEY = "dabi-agendai-admin-sound-alerts";

type AvailabilityPayload = {
  slots?: string[];
  closedReason?: string | null;
  error?: string;
};

type HolidayLookupPayload = {
  isHoliday?: boolean;
  holidayName?: string | null;
  holidayType?: string | null;
  coverage?: string | null;
  month?: string;
  monthHolidays?: Array<{
    date: string;
    name: string;
    type?: string;
  }>;
  location?: {
    zipCode: string;
    city: string;
    state: string;
  };
  error?: string;
};

type AddressLookupPayload = {
  zipCode?: string;
  street?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  error?: string;
};

type CurrentMonthHoliday = {
  date: string;
  name: string;
  type?: string;
};

type DisplayClosedDate = {
  date: string;
  reason: string;
  source: "manual" | "holiday";
};

type ServiceDraft = {
  name: string;
  price: string;
  duration: string;
  membership: string;
  description: string;
  image: string;
};

type RemovalTarget =
  | { type: "service"; index: number; label: string }
  | { type: "barber"; name: string; label: string }
  | { type: "closedDate"; date: string; label: string }
  | { type: "barberTimeOff"; barberName: string; date: string; label: string };

type AdminSectionView = "overview" | "site" | "catalog" | "schedule";

function getRemovalModalCopy(target: RemovalTarget) {
  if (target.type === "barber") {
    return {
      title: "Remover este barbeiro?",
      description: `Essa ação remove o barbeiro ${target.label} do painel.`,
    };
  }

  if (target.type === "service") {
    return {
      title: "Remover este serviço?",
      description: `Essa ação remove o serviço ${target.label} do painel.`,
    };
  }

  if (target.type === "barberTimeOff") {
    return {
      title: "Remover esta folga?",
      description: `Essa ação remove a folga ${target.label} do painel.`,
    };
  }

  return {
    title: "Remover esta data bloqueada?",
    description: `Essa ação remove a data bloqueada ${target.label} do painel.`,
  };
}

function getAppointmentStatusLabel(status: string) {
  switch (status) {
    case "CONFIRMED":
      return "Confirmado";
    case "CANCELLED":
      return "Cancelado";
    case "COMPLETED":
      return "Concluído";
    default:
      return "Agendado";
  }
}

function getMonthDays(currentMonth: Date) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startOffset = (firstDayOfMonth.getDay() + 6) % 7;
  const totalDays = lastDayOfMonth.getDate();
  const days: Array<{ iso: string; day: number; isCurrentMonth: boolean }> = [];

  for (let index = 0; index < startOffset; index += 1) {
    const date = new Date(year, month, index - startOffset + 1);
    days.push({
      iso: date.toISOString().slice(0, 10),
      day: date.getDate(),
      isCurrentMonth: false,
    });
  }

  for (let day = 1; day <= totalDays; day += 1) {
    const date = new Date(year, month, day);
    days.push({
      iso: date.toISOString().slice(0, 10),
      day,
      isCurrentMonth: true,
    });
  }

  while (days.length % 7 !== 0) {
    const nextIndex = days.length - (startOffset + totalDays) + 1;
    const date = new Date(year, month + 1, nextIndex);
    days.push({
      iso: date.toISOString().slice(0, 10),
      day: date.getDate(),
      isCurrentMonth: false,
    });
  }

  return days;
}

type DatePickerFieldProps = {
  value: string;
  onChange: (value: string) => void;
};

function DatePickerField({ value, onChange }: DatePickerFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => new Date(`${value}T12:00:00`));
  const containerRef = useRef<HTMLDivElement | null>(null);

  const monthDays = useMemo(() => getMonthDays(currentMonth), [currentMonth]);
  const todayIso = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  function selectDate(nextValue: string) {
    onChange(nextValue);
    setCurrentMonth(new Date(`${nextValue}T12:00:00`));
    setIsOpen(false);
  }

  function shiftMonth(offset: number) {
    setCurrentMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() + offset, 1),
    );
  }

  return (
    <div className={styles.calendarField} ref={containerRef}>
      <button
        className={styles.calendarTrigger}
        type="button"
        onClick={() => setIsOpen((current) => !current)}
      >
        <span>{formatDateToPtBr(value)}</span>
      </button>

      {isOpen ? (
        <div className={styles.calendarPopoverCard}>
          <div className={styles.calendarToolbar}>
            <button className={styles.calendarNavButton} type="button" onClick={() => shiftMonth(-1)}>
              {"<"}
            </button>
            <strong>{formatMonthYear(currentMonth)}</strong>
            <button className={styles.calendarNavButton} type="button" onClick={() => shiftMonth(1)}>
              {">"}
            </button>
          </div>

          <div className={styles.calendarWeekdaysRow}>
            {["SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM"].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className={styles.calendarDaysGrid}>
            {monthDays.map((day) => {
              const isSelected = day.iso === value;
              const isToday = day.iso === todayIso;

              return (
                <button
                  className={`${styles.calendarDayButton} ${
                    !day.isCurrentMonth ? styles.calendarDayOutsideMonth : ""
                  } ${isSelected ? styles.calendarDaySelected : ""} ${
                    isToday ? styles.calendarDayToday : ""
                  }`}
                  key={day.iso}
                  type="button"
                  onClick={() => selectDate(day.iso)}
                >
                  {day.day}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function InlineCalendar({ value, onChange }: DatePickerFieldProps) {
  const [currentMonth, setCurrentMonth] = useState(() => new Date(`${value}T12:00:00`));
  const monthDays = useMemo(() => getMonthDays(currentMonth), [currentMonth]);
  const todayIso = new Date().toISOString().slice(0, 10);

  function shiftMonth(offset: number) {
    const nextMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + offset,
      1,
    );
    setCurrentMonth(nextMonth);
    onChange(nextMonth.toISOString().slice(0, 10));
  }

  return (
    <div className={styles.monthCalendar}>
      <div className={styles.calendarToolbar}>
        <button className={styles.calendarNavButton} type="button" onClick={() => shiftMonth(-1)}>
          {"<"}
        </button>
        <strong>{formatMonthYear(currentMonth)}</strong>
        <button className={styles.calendarNavButton} type="button" onClick={() => shiftMonth(1)}>
          {">"}
        </button>
      </div>

      <div className={styles.calendarWeekdaysRow}>
        {["SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM"].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>

      <div className={styles.calendarDaysGrid}>
        {monthDays.map((day) => {
          const isSelected = day.iso === value;
          const isToday = day.iso === todayIso;

          return (
            <button
              className={`${styles.calendarDayButton} ${
                !day.isCurrentMonth ? styles.calendarDayOutsideMonth : ""
              } ${isSelected ? styles.calendarDaySelected : ""} ${
                isToday ? styles.calendarDayToday : ""
              }`}
              key={day.iso}
              type="button"
              onClick={() => {
                setCurrentMonth(new Date(`${day.iso}T12:00:00`));
                onChange(day.iso);
              }}
            >
              {day.day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function AdminPage({ section = "overview" }: { section?: AdminSectionView }) {
  const { showToast } = useToast();
  const pathname = usePathname();
  const siteConfigSnapshot = useSiteConfig();
  const [config, setConfig] = useState(siteConfigSnapshot);
  const [closingDate, setClosingDate] = useState("2026-03-30");
  const [closingReason, setClosingReason] = useState("Treinamento interno");
  const [timeOffBarberName, setTimeOffBarberName] = useState("");
  const [timeOffDate, setTimeOffDate] = useState("2026-03-30");
  const [timeOffReason, setTimeOffReason] = useState("Folga");
  const [addressLookupMessage, setAddressLookupMessage] = useState("");
  const [addressLookupLoading, setAddressLookupLoading] = useState(false);
  const [holidayLookupMessage, setHolidayLookupMessage] = useState("");
  const [holidayLookupLoading, setHolidayLookupLoading] = useState(false);
  const [currentMonthHolidays, setCurrentMonthHolidays] = useState<CurrentMonthHoliday[]>([]);
  const [appointmentsDate, setAppointmentsDate] = useState(getTodayDateKey());
  const [appointments, setAppointments] = useState<AdminAppointment[]>([]);
  const [appointmentsMessage, setAppointmentsMessage] = useState("Carregando agendamentos...");
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [appointmentsRefreshToken, setAppointmentsRefreshToken] = useState(0);
  const [averageRatingValue, setAverageRatingValue] = useState("5,0/5");
  const [savingSync, setSavingSync] = useState(false);
  const [updatingAppointmentId, setUpdatingAppointmentId] = useState<string | null>(null);
  const [editingAppointmentId, setEditingAppointmentId] = useState<string | null>(null);
  const [cancelingAppointment, setCancelingAppointment] = useState<AdminAppointment | null>(null);
  const [removalTarget, setRemovalTarget] = useState<RemovalTarget | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState(getTodayDateKey());
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [rescheduleSlots, setRescheduleSlots] = useState<string[]>([]);
  const [rescheduleMessage, setRescheduleMessage] = useState("");
  const [loadingRescheduleSlots, setLoadingRescheduleSlots] = useState(false);
  const [manualService, setManualService] = useState(config.services[0]?.name ?? "");
  const [manualBarber, setManualBarber] = useState(config.barbers[0]?.name ?? "");
  const [manualDate, setManualDate] = useState(getTodayDateKey());
  const [manualTime, setManualTime] = useState("");
  const [manualCustomerName, setManualCustomerName] = useState("");
  const [manualCustomerPhone, setManualCustomerPhone] = useState("");
  const [manualNotes, setManualNotes] = useState("");
  const [manualSlots, setManualSlots] = useState<string[]>([]);
  const [manualMessage, setManualMessage] = useState("");
  const [manualLoadingSlots, setManualLoadingSlots] = useState(false);
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [barberName, setBarberName] = useState("");
  const [barberRole, setBarberRole] = useState("");
  const [statusMessage, setStatusMessage] = useState("Alterações locais ainda não salvas.");
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [soundAlertsEnabled, setSoundAlertsEnabled] = useState(false);
  const [notificationFeedback, setNotificationFeedback] = useState("");
  const [newAppointmentAlerts, setNewAppointmentAlerts] = useState<AdminAppointment[]>([]);
  const showcaseImageInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const serviceImageInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const newServiceImageInputRef = useRef<HTMLInputElement | null>(null);
  const newServiceDescriptionInputRef = useRef<HTMLTextAreaElement | null>(null);
  const autoDetectedHolidayRef = useRef<string | null>(null);
  const knownAppointmentIdsRef = useRef<Set<string>>(new Set());
  const notificationsBootstrappedRef = useRef(false);
  const [isCreateServiceModalOpen, setIsCreateServiceModalOpen] = useState(false);
  const [newServiceDescriptionInvalid, setNewServiceDescriptionInvalid] = useState(false);
  const [newService, setNewService] = useState<ServiceDraft>({
    name: "",
    price: "",
    duration: "",
    membership: "",
    description: "",
    image: config.services[0]?.image ?? "",
  });

  useEffect(() => {
    setConfig(siteConfigSnapshot);
  }, [siteConfigSnapshot]);

  useEffect(() => {
    if (!timeOffBarberName && config.barbers.length > 0) {
      setTimeOffBarberName(config.barbers[0].name);
    }
  }, [config.barbers, timeOffBarberName]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const savedSoundPreference =
      window.localStorage.getItem(ADMIN_SOUND_ALERTS_STORAGE_KEY) === "enabled";
    setSoundAlertsEnabled(
      window.localStorage.getItem(ADMIN_SOUND_ALERTS_STORAGE_KEY) === null
        ? true
        : savedSoundPreference,
    );

    if (!("Notification" in window)) {
      return;
    }

    const savedPreference =
      window.localStorage.getItem(ADMIN_NOTIFICATIONS_STORAGE_KEY) === "enabled";
    setNotificationsEnabled(savedPreference && window.Notification.permission === "granted");
  }, []);

  function playNewAppointmentSound() {
    if (typeof window === "undefined") {
      return;
    }

    const AudioContextConstructor =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextConstructor) {
      return;
    }

    try {
      const audioContext = new AudioContextConstructor();
      const currentTime = audioContext.currentTime;

      const playTone = (startTime: number, frequency: number, duration: number) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.type = "triangle";
        oscillator.frequency.setValueAtTime(frequency, startTime);
        oscillator.frequency.exponentialRampToValueAtTime(
          Math.max(frequency * 0.86, 220),
          startTime + duration,
        );

        gainNode.gain.setValueAtTime(0.0001, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.18, startTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.start(startTime);
        oscillator.stop(startTime + duration + 0.02);
      };

      playTone(currentTime, 988, 0.16);
      playTone(currentTime + 0.22, 1318, 0.18);

      window.setTimeout(() => {
        void audioContext.close().catch(() => {
          // noop
        });
      }, 700);
    } catch {
      // noop: fallback silencioso
    }
  }

  useEffect(() => {
    let active = true;

    async function loadAppointments() {
      setAppointmentsLoading(true);

      try {
        const response = await fetch(`/api/appointments?date=${appointmentsDate}`, {
          cache: "no-store",
        });
        const payload = (await response.json()) as {
          appointments?: AdminAppointment[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error ?? "Nao foi possivel carregar os agendamentos.");
        }

        if (!active) {
          return;
        }

        const nextAppointments = payload.appointments ?? [];
        setAppointments(nextAppointments);
        setAppointmentsMessage(
          nextAppointments.length === 0
            ? "Nenhum agendamento encontrado para esta data."
            : "",
        );
      } catch (error) {
        if (!active) {
          return;
        }

        setAppointments([]);
        setAppointmentsMessage(
          error instanceof Error
            ? error.message
            : "Nao foi possivel carregar os agendamentos.",
        );
      } finally {
        if (active) {
          setAppointmentsLoading(false);
        }
      }
    }

    void loadAppointments();

    return () => {
      active = false;
    };
  }, [appointmentsDate, appointmentsRefreshToken]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    let active = true;

    async function pollNewAppointments() {
      try {
        const response = await fetch("/api/appointments", {
          cache: "no-store",
        });
        const payload = (await response.json()) as {
          appointments?: AdminAppointment[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error ?? "Nao foi possivel verificar novos agendamentos.");
        }

        if (!active) {
          return;
        }

        const allAppointments = payload.appointments ?? [];
        const knownIds = knownAppointmentIdsRef.current;

        if (!notificationsBootstrappedRef.current) {
          allAppointments.forEach((appointment) => knownIds.add(appointment.id));
          notificationsBootstrappedRef.current = true;
          return;
        }

        const incomingAppointments = allAppointments.filter(
          (appointment) => appointment.status === "SCHEDULED" && !knownIds.has(appointment.id),
        );

        if (incomingAppointments.length > 0) {
          setNewAppointmentAlerts((current) => {
            const existingIds = new Set(current.map((item) => item.id));
            return [
              ...incomingAppointments.filter((item) => !existingIds.has(item.id)),
              ...current,
            ];
          });

          if (soundAlertsEnabled) {
            playNewAppointmentSound();
          }

          if (
            incomingAppointments.some(
              (appointment) => appointment.startsAt.slice(0, 10) === appointmentsDate,
            )
          ) {
            setAppointmentsRefreshToken((current) => current + 1);
          }

          if (notificationsEnabled && window.Notification.permission === "granted") {
            incomingAppointments.forEach((appointment) => {
              const notification = new window.Notification("Novo agendamento recebido", {
                body: `${appointment.customerName} agendou ${appointment.serviceName} com ${appointment.barberName}.`,
              });

              notification.onclick = () => {
                window.focus();
              };
            });
          }
        }

        allAppointments.forEach((appointment) => knownIds.add(appointment.id));
      } catch {
        // noop: polling silencioso
      }
    }

    void pollNewAppointments();
    const intervalId = window.setInterval(() => {
      void pollNewAppointments();
    }, 30000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [appointmentsDate, notificationsEnabled, soundAlertsEnabled]);

  async function enableBrowserNotifications() {
    if (typeof window === "undefined" || !("Notification" in window)) {
      const message = "Este navegador não suporta notificações.";
      setNotificationFeedback(message);
      showToast({ variant: "warning", message });
      return;
    }

    if (window.Notification.permission === "granted") {
      window.localStorage.setItem(ADMIN_NOTIFICATIONS_STORAGE_KEY, "enabled");
      setNotificationsEnabled(true);
      const message = "Alertas do navegador já estão ativos.";
      setNotificationFeedback(message);
      showToast({ variant: "success", message });
      return;
    }

    const permission = await window.Notification.requestPermission();

    if (permission === "granted") {
      window.localStorage.setItem(ADMIN_NOTIFICATIONS_STORAGE_KEY, "enabled");
      setNotificationsEnabled(true);
      const message = "Alertas ativados para novos agendamentos.";
      setNotificationFeedback(message);
      showToast({ variant: "success", message });
      return;
    }

    const message = "Permissão de notificação não concedida.";
    setNotificationFeedback(message);
    showToast({ variant: "warning", message });
  }

  function toggleSoundAlerts() {
    if (typeof window === "undefined") {
      return;
    }

    const nextValue = !soundAlertsEnabled;
    window.localStorage.setItem(
      ADMIN_SOUND_ALERTS_STORAGE_KEY,
      nextValue ? "enabled" : "disabled",
    );
    setSoundAlertsEnabled(nextValue);
    setNotificationFeedback(
      nextValue
        ? "Som ativado para novos agendamentos."
        : "Som desativado para novos agendamentos.",
    );
    showToast({
      variant: nextValue ? "success" : "warning",
      message: nextValue
        ? "Som ativado para novos agendamentos."
        : "Som desativado para novos agendamentos.",
    });

    if (nextValue) {
      playNewAppointmentSound();
    }
  }

  function dismissAppointmentAlert(appointmentId: string) {
    setNewAppointmentAlerts((current) => current.filter((item) => item.id !== appointmentId));
  }

  function setBusinessField<K extends "businessName" | "businessTag" | "headline" | "heroDescription" | "whatsapp" | "address" | "addressNumber" | "city" | "neighborhood" | "zipCode">(
    field: K,
    value: string,
  ) {
    setConfig((current) => ({ ...current, [field]: value }));
  }

  function updateStat(index: number, field: "value" | "label", value: string) {
    setConfig((current) => ({
      ...current,
      stats: current.stats.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    }));
  }

  function updatePlan(index: number, field: keyof PlanItem, value: string) {
    setConfig((current) => ({
      ...current,
      plans: current.plans.map((plan, itemIndex) =>
        itemIndex === index ? { ...plan, [field]: value } : plan,
      ),
    }));
  }

  function addPlan() {
    setConfig((current) => ({
      ...current,
      plans: [
        ...current.plans,
        {
          name: "",
          summary: "",
          price: "",
        },
      ],
    }));
  }

  function removePlan(index: number) {
    setConfig((current) => ({
      ...current,
      plans: current.plans.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  function updateLoyaltyReward(
    index: number,
    field: keyof LoyaltyRewardItem,
    value: string,
  ) {
    setConfig((current) => ({
      ...current,
      loyaltyRewards: current.loyaltyRewards.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: field === "points" ? Number(value.replace(/[^\d]/g, "") || "0") : value,
            }
          : item,
      ),
    }));
  }

  function addLoyaltyReward() {
    setConfig((current) => ({
      ...current,
      loyaltyRewards: [
        ...current.loyaltyRewards,
        {
          points: 0,
          title: "",
          description: "",
        },
      ],
    }));
  }

  function removeLoyaltyReward(index: number) {
    setConfig((current) => ({
      ...current,
      loyaltyRewards: current.loyaltyRewards.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  function updateLoyaltyTier(
    index: number,
    field: keyof LoyaltyTierItem,
    value: string,
  ) {
    setConfig((current) => ({
      ...current,
      loyaltyTiers: current.loyaltyTiers.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]:
                field === "minPoints"
                  ? Number(value.replace(/[^\d]/g, "") || "0")
                  : field === "maxPoints"
                    ? value.trim()
                      ? Number(value.replace(/[^\d]/g, "") || "0")
                      : null
                    : value,
            }
          : item,
      ),
    }));
  }

  function addLoyaltyTier() {
    const nextMinPoints =
      Math.max(...config.loyaltyTiers.map((tier) => tier.maxPoints ?? tier.minPoints), 0) + 1;

    setConfig((current) => ({
      ...current,
      loyaltyTiers: [
        ...current.loyaltyTiers,
        {
          name: "",
          minPoints: nextMinPoints,
          maxPoints: null,
          accent: "#c39a5c",
        },
      ],
    }));
  }

  function removeLoyaltyTier(index: number) {
    setConfig((current) => ({
      ...current,
      loyaltyTiers: current.loyaltyTiers.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  function updateService(index: number, field: keyof (typeof config.services)[number], value: string) {
    setConfig((current) => ({
      ...current,
      services: current.services.map((service, serviceIndex) =>
        serviceIndex === index ? { ...service, [field]: value } : service,
      ),
    }));
  }

  function removeService(index: number) {
    setConfig((current) => ({
      ...current,
      services: current.services.filter((_, serviceIndex) => serviceIndex !== index),
    }));
    setStatusMessage("Serviço removido. Salve para aplicar no site.");
    showToast({ variant: "warning", title: "Aviso", message: "Serviço removido. Salve para aplicar no site." });
  }

  function openCreateServiceModal() {
    setNewService({
      name: "",
      price: "",
      duration: "",
      membership: "",
      description: "",
      image: config.services[0]?.image ?? "",
    });
    setNewServiceDescriptionInvalid(false);
    setIsCreateServiceModalOpen(true);
  }

  function closeCreateServiceModal() {
    setNewServiceDescriptionInvalid(false);
    setIsCreateServiceModalOpen(false);
  }

  function updateNewServiceField(field: keyof ServiceDraft, value: string) {
    if (field === "description" && value.trim()) {
      setNewServiceDescriptionInvalid(false);
    }
    setNewService((current) => ({ ...current, [field]: value }));
  }

  function openNewServiceImagePicker() {
    newServiceImageInputRef.current?.click();
  }

  function updateNewServiceImage(file: File | null) {
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setNewService((current) => ({ ...current, image: result }));
    };
    reader.readAsDataURL(file);
  }

  function createService() {
    if (!newService.name.trim() || !newService.price.trim() || !newService.duration.trim()) {
      const message = "Preencha nome, preço, duração e descrição para criar o serviço.";
      setStatusMessage(message);
      showToast({ variant: "warning", message });
      return;
    }

    if (!newService.description.trim()) {
      setNewServiceDescriptionInvalid(true);
      newServiceDescriptionInputRef.current?.focus();
      const message = "Preencha a descrição para criar o serviço.";
      setStatusMessage(message);
      showToast({ variant: "warning", message });
      return;
    }

    setConfig((current) => ({
      ...current,
      services: [
        ...current.services,
        {
          name: newService.name.trim(),
          price: formatServicePrice(newService.price),
          duration: formatServiceDuration(newService.duration),
          membership: newService.membership.trim(),
          description: newService.description.trim(),
          image: newService.image || current.services[0]?.image || "",
        },
      ],
    }));
    setStatusMessage("Serviço adicionado. Salve para aplicar no site.");
    showToast({ variant: "success", message: "Serviço adicionado. Salve para aplicar no site." });
    setNewServiceDescriptionInvalid(false);
    setIsCreateServiceModalOpen(false);
  }

  function addBarber() {
    if (!barberName.trim() || !barberRole.trim()) {
      return;
    }

    setConfig((current) => ({
      ...current,
      barbers: [...current.barbers, { name: barberName.trim(), role: barberRole.trim() }],
    }));
    setBarberName("");
    setBarberRole("");
    setStatusMessage("Barbeiro adicionado. Salve para aplicar no site.");
    showToast({ variant: "success", message: "Barbeiro adicionado. Salve para aplicar no site." });
  }

  function removeBarber(name: string) {
    setConfig((current) => ({
      ...current,
      barbers: current.barbers.filter((barber) => barber.name !== name),
    }));
    setStatusMessage("Barbeiro removido. Salve para aplicar no site.");
    showToast({ variant: "warning", title: "Aviso", message: "Barbeiro removido. Salve para aplicar no site." });
  }

  function addClosedDate() {
    if (!closingDate || !closingReason.trim()) {
      return;
    }

    setConfig((current) => ({
      ...current,
      ignoredHolidayDates: current.ignoredHolidayDates.filter((date) => date !== closingDate),
      closedDates: current.closedDates.some((item) => item.date === closingDate)
        ? current.closedDates.map((item) =>
            item.date === closingDate
              ? { ...item, reason: closingReason.trim() }
              : item,
          )
        : [...current.closedDates, { date: closingDate, reason: closingReason.trim() }],
    }));
    setClosingReason("");
    setStatusMessage("Data bloqueada adicionada. Salve para aplicar no site.");
    showToast({ variant: "success", message: "Data bloqueada adicionada. Salve para aplicar no site." });
  }

  function removeClosedDate(date: string) {
    setConfig((current) => ({
      ...current,
      closedDates: current.closedDates.filter((item) => item.date !== date),
      ignoredHolidayDates: currentMonthHolidays.some((holiday) => holiday.date === date)
        ? [...new Set([...current.ignoredHolidayDates, date])]
        : current.ignoredHolidayDates,
    }));
    setStatusMessage("Data bloqueada removida. Salve para aplicar no site.");
    showToast({ variant: "warning", title: "Aviso", message: "Data bloqueada removida. Salve para aplicar no site." });
  }

  function addBarberTimeOff() {
    if (!timeOffBarberName || !timeOffDate || !timeOffReason.trim()) {
      return;
    }

    setConfig((current) => ({
      ...current,
      barberTimeOff: current.barberTimeOff.some(
        (item) => item.barberName === timeOffBarberName && item.date === timeOffDate,
      )
        ? current.barberTimeOff.map((item) =>
            item.barberName === timeOffBarberName && item.date === timeOffDate
              ? { ...item, reason: timeOffReason.trim() }
              : item,
          )
        : [
            ...current.barberTimeOff,
            { barberName: timeOffBarberName, date: timeOffDate, reason: timeOffReason.trim() },
          ],
    }));
    setStatusMessage("Folga adicionada. Salve para aplicar no site.");
    showToast({ variant: "success", message: "Folga adicionada. Salve para aplicar no site." });
  }

  function removeBarberTimeOff(barberName: string, date: string) {
    setConfig((current) => ({
      ...current,
      barberTimeOff: current.barberTimeOff.filter(
        (item) => !(item.barberName === barberName && item.date === date),
      ),
    }));
    setStatusMessage("Folga removida. Salve para aplicar no site.");
    showToast({ variant: "warning", title: "Aviso", message: "Folga removida. Salve para aplicar no site." });
  }

  function confirmRemoval() {
    if (!removalTarget) {
      return;
    }

    if (removalTarget.type === "service") {
      removeService(removalTarget.index);
    }

    if (removalTarget.type === "barber") {
      removeBarber(removalTarget.name);
    }

    if (removalTarget.type === "closedDate") {
      removeClosedDate(removalTarget.date);
    }

    if (removalTarget.type === "barberTimeOff") {
      removeBarberTimeOff(removalTarget.barberName, removalTarget.date);
    }

    setRemovalTarget(null);
  }

  const removalModalCopy = removalTarget ? getRemovalModalCopy(removalTarget) : null;

  async function saveChanges() {
    setSavingSync(true);

    try {
      const response = await fetch("/api/admin/site-sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          config: {
            ...config,
            closedDates: displayedClosedDates.map((item) => ({
              date: item.date,
              reason: item.reason,
            })),
          },
        }),
      });
      const payload = (await response.json()) as { message?: string; error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Nao foi possivel sincronizar os dados.");
      }

      window.dispatchEvent(new CustomEvent(SITE_CONFIG_UPDATED_EVENT));
      setStatusMessage("Alterações salvas no site e sincronizadas com a agenda.");
      showToast({ variant: "success", message: "Alterações salvas no site e sincronizadas com a agenda." });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Nao foi possivel sincronizar os dados com a agenda.";
      setStatusMessage(message);
      showToast({ variant: "error", message });
    } finally {
      setSavingSync(false);
    }
  }

  function openPublicSite() {
    window.open("/portfolio/barbearia", "_blank", "noopener,noreferrer");
  }

  function openShowcaseImagePicker(index: number) {
    showcaseImageInputRefs.current[index]?.click();
  }

  function updateShowcaseImage(index: number, file: File | null) {
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setConfig((current) => ({
        ...current,
        showcaseImages: current.showcaseImages.map((image, imageIndex) =>
          imageIndex === index ? { ...image, src: result } : image,
        ),
      }));
      setStatusMessage("Imagem atualizada. Salve para aplicar no site.");
      showToast({ variant: "success", message: "Imagem atualizada. Salve para aplicar no site." });
    };
    reader.readAsDataURL(file);
  }

  function openServiceImagePicker(index: number) {
    serviceImageInputRefs.current[index]?.click();
  }

  function updateServiceImage(index: number, file: File | null) {
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setConfig((current) => ({
        ...current,
        services: current.services.map((service, serviceIndex) =>
          serviceIndex === index ? { ...service, image: result } : service,
        ),
      }));
      setStatusMessage("Imagem do serviço atualizada. Salve para aplicar no site.");
      showToast({ variant: "success", message: "Imagem do serviço atualizada. Salve para aplicar no site." });
    };
    reader.readAsDataURL(file);
  }

  const displayStats = getDisplayStats(config, averageRatingValue);

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

    function handleStorage(event: StorageEvent) {
      if (event.key === "dabi-agendai-customer-reviews") {
        void loadAverageRating();
      }
    }

    window.addEventListener("storage", handleStorage);

    return () => {
      active = false;
      window.removeEventListener("storage", handleStorage);
    };
  }, [config.testimonials]);
  const serviceDurationMap = useMemo(
    () =>
      new Map(
        config.services.map((service) => [
          service.name,
          parseDurationToMinutes(service.duration),
        ]),
      ),
    [config.services],
  );
  const currentMonthKey = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${`${now.getMonth() + 1}`.padStart(2, "0")}`;
  }, []);
  const displayedClosedDates = useMemo<DisplayClosedDate[]>(() => {
    const closedDatesMap = new Map<string, DisplayClosedDate>(
      config.closedDates.map((item) => [
        item.date,
        { date: item.date, reason: item.reason, source: "manual" as const },
      ]),
    );

    for (const holiday of currentMonthHolidays) {
      if (config.ignoredHolidayDates.includes(holiday.date)) {
        continue;
      }

      if (!closedDatesMap.has(holiday.date)) {
        closedDatesMap.set(holiday.date, {
          date: holiday.date,
          reason: holiday.name,
          source: "holiday",
        });
      }
    }

    return [...closedDatesMap.values()].sort((left, right) => left.date.localeCompare(right.date));
  }, [config.closedDates, config.ignoredHolidayDates, currentMonthHolidays]);
  const selectedDateClosedReason =
    displayedClosedDates.find((item) => item.date === appointmentsDate)?.reason ?? null;
  const manualDateClosedReason =
    displayedClosedDates.find((item) => item.date === manualDate)?.reason ?? null;

  useEffect(() => {
    const normalizedZipCode = config.zipCode.replace(/\D/g, "");

    if (normalizedZipCode.length !== 8) {
      setAddressLookupLoading(false);
      setAddressLookupMessage(
        config.zipCode.trim()
          ? "Informe um CEP valido para preencher o endereco."
          : "Digite o CEP para preencher endereco e bairro automaticamente.",
      );
      return;
    }

    let active = true;

    async function loadAddressByZipCode() {
      setAddressLookupLoading(true);

      try {
        const response = await fetch(`/api/address/by-cep?cep=${normalizedZipCode}`, {
          cache: "no-store",
        });
        const payload = (await response.json()) as AddressLookupPayload;

        if (!response.ok) {
          throw new Error(payload.error ?? "Nao foi possivel consultar o CEP.");
        }

        if (!active) {
          return;
        }

        setConfig((current) => ({
          ...current,
          address: payload.street?.trim() || current.address,
          businessTag:
            current.businessTag.startsWith(LEGACY_BUSINESS_TAG_PREFIX) && payload.city?.trim()
              ? `${LEGACY_BUSINESS_TAG_PREFIX}${payload.city.trim()}`
              : current.businessTag,
          city: payload.city?.trim() || current.city,
          neighborhood: payload.neighborhood?.trim() || current.neighborhood,
          zipCode: payload.zipCode ?? current.zipCode,
        }));
        setAddressLookupMessage("");
      } catch (error) {
        if (!active) {
          return;
        }

        setAddressLookupMessage(
          error instanceof Error
            ? error.message
            : "Nao foi possivel preencher o endereco automaticamente.",
        );
      } finally {
        if (active) {
          setAddressLookupLoading(false);
        }
      }
    }

    void loadAddressByZipCode();

    return () => {
      active = false;
    };
  }, [config.zipCode]);

  useEffect(() => {
    const normalizedZipCode = config.zipCode.replace(/\D/g, "");

    if (normalizedZipCode.length !== 8) {
      setHolidayLookupMessage(
        config.zipCode.trim()
          ? "Informe um CEP valido para consultar feriados automaticamente."
          : "Cadastre o CEP da barbearia para reconhecer feriados automaticamente.",
      );
      setHolidayLookupLoading(false);
      setCurrentMonthHolidays([]);
      autoDetectedHolidayRef.current = null;
      return;
    }

    let active = true;

    async function loadHolidayByZipCode() {
      setHolidayLookupLoading(true);

      try {
        const params = new URLSearchParams({
          cep: normalizedZipCode,
          date: closingDate,
          month: currentMonthKey,
        });
        const response = await fetch(`/api/holidays/by-cep?${params.toString()}`, {
          cache: "no-store",
        });
        const payload = (await response.json()) as HolidayLookupPayload;

        if (!response.ok) {
          throw new Error(payload.error ?? "Nao foi possivel consultar os feriados.");
        }

        if (!active) {
          return;
        }

        const holidaysInMonth = payload.monthHolidays ?? [];
        setCurrentMonthHolidays(holidaysInMonth);

        const holidayName =
          closingDate.startsWith(`${currentMonthKey}-`) && payload.isHoliday
            ? payload.holidayName ?? "Feriado"
            : null;
        const previousAutoDetectedHoliday = autoDetectedHolidayRef.current;

        setClosingReason((current) => {
          const trimmedValue = current.trim();

          if (!holidayName) {
            return previousAutoDetectedHoliday && trimmedValue === previousAutoDetectedHoliday
              ? ""
              : current;
          }

          if (!trimmedValue || trimmedValue === previousAutoDetectedHoliday) {
            return holidayName;
          }

          return current;
        });

        autoDetectedHolidayRef.current = holidayName;

        if (holidayName) {
          setHolidayLookupMessage(
            `Feriado detectado no mes atual para ${payload.location?.city}/${payload.location?.state}: ${holidayName} em ${formatDateToPtBr(closingDate)} (${payload.coverage ?? "nacional"}).`,
          );
          return;
        }

        setHolidayLookupMessage(
          holidaysInMonth.length > 0
            ? `${holidaysInMonth.length} feriado(s) nacional(is) marcado(s) automaticamente no card ao lado para ${payload.location?.city}/${payload.location?.state}.`
            : "",
        );
      } catch (error) {
        if (!active) {
          return;
        }

        setHolidayLookupMessage(
          error instanceof Error
            ? error.message
            : "Nao foi possivel consultar os feriados automaticamente.",
        );
        setCurrentMonthHolidays([]);
        autoDetectedHolidayRef.current = null;
      } finally {
        if (active) {
          setHolidayLookupLoading(false);
        }
      }
    }

    void loadHolidayByZipCode();

    return () => {
      active = false;
    };
  }, [closingDate, config.zipCode, currentMonthKey]);

  const editingAppointment = useMemo(
    () => appointments.find((appointment) => appointment.id === editingAppointmentId) ?? null,
    [appointments, editingAppointmentId],
  );

  useEffect(() => {
    let active = true;

    async function loadRescheduleSlots() {
      if (!editingAppointment) {
        return;
      }

      setLoadingRescheduleSlots(true);
      setRescheduleMessage("");

      try {
        const params = new URLSearchParams({
          service: editingAppointment.serviceName,
          barber: editingAppointment.barberName,
          date: rescheduleDate,
          excludeAppointmentId: editingAppointment.id,
        });
        const response = await fetch(`/api/availability?${params.toString()}`, {
          cache: "no-store",
        });
        const payload = (await response.json()) as AvailabilityPayload;

        if (!response.ok) {
          throw new Error(payload.error ?? "Nao foi possivel carregar os horarios.");
        }

        if (!active) {
          return;
        }

        const nextSlots = payload.slots ?? [];
        setRescheduleSlots(nextSlots);
        setRescheduleMessage(
          payload.closedReason ??
            (nextSlots.length === 0
              ? "Nenhum horario livre para esta nova data."
              : ""),
        );
        setRescheduleTime((current) => (nextSlots.includes(current) ? current : nextSlots[0] ?? ""));
      } catch (error) {
        if (!active) {
          return;
        }

        setRescheduleSlots([]);
        setRescheduleTime("");
        setRescheduleMessage(
          error instanceof Error
            ? error.message
            : "Nao foi possivel carregar os horarios.",
        );
      } finally {
        if (active) {
          setLoadingRescheduleSlots(false);
        }
      }
    }

    void loadRescheduleSlots();

    return () => {
      active = false;
    };
  }, [editingAppointment, rescheduleDate]);

  useEffect(() => {
    let active = true;

    async function loadManualSlots() {
      setManualLoadingSlots(true);
      setManualMessage("");
      setManualSlots([]);
      setManualTime("");

      try {
        const params = new URLSearchParams({
          service: manualService,
          barber: manualBarber,
          date: manualDate,
        });
        const response = await fetch(`/api/availability?${params.toString()}`, {
          cache: "no-store",
        });
        const payload = (await response.json()) as AvailabilityPayload;

        if (!response.ok) {
          throw new Error(payload.error ?? "Nao foi possivel carregar os horarios.");
        }

        if (!active) {
          return;
        }

        const nextSlots = payload.slots ?? [];
        setManualSlots(nextSlots);
        setManualMessage(
          payload.closedReason ??
            (nextSlots.length === 0 ? "Nenhum horario livre para esta selecao." : ""),
        );
        setManualTime((current) => (nextSlots.includes(current) ? current : nextSlots[0] ?? ""));
      } catch (error) {
        if (!active) {
          return;
        }

        setManualSlots([]);
        setManualTime("");
        setManualMessage(
          error instanceof Error
            ? error.message
            : "Nao foi possivel carregar os horarios.",
        );
      } finally {
        if (active) {
          setManualLoadingSlots(false);
        }
      }
    }

    void loadManualSlots();

    return () => {
      active = false;
    };
  }, [appointmentsRefreshToken, manualBarber, manualDate, manualService]);

  function openAppointmentWhatsapp(appointment: AdminAppointment) {
    const url = buildWhatsappUrl(
      appointment.customerPhone,
      buildAppointmentWhatsappMessage(appointment),
    );
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function openAppointmentCancellationWhatsapp(appointment: AdminAppointment) {
    const url = buildWhatsappUrl(
      appointment.customerPhone,
      buildAppointmentCancellationWhatsappMessage(appointment),
    );
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function confirmAndOpenWhatsapp(appointment: AdminAppointment) {
    setUpdatingAppointmentId(appointment.id);

    try {
      const response = await fetch(`/api/appointments/${appointment.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "CONFIRMED" }),
      });
      const payload = (await response.json()) as { status?: string; error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Nao foi possivel confirmar o agendamento.");
      }

      const updatedAppointment = {
        ...appointment,
        status: payload.status ?? "CONFIRMED",
      };

      setAppointments((current) =>
        current.map((item) =>
          item.id === appointment.id ? updatedAppointment : item,
        ),
      );
      setAppointmentsRefreshToken((current) => current + 1);
      setStatusMessage("Agendamento confirmado e mensagem aberta no WhatsApp.");
      showToast({ variant: "success", message: "Agendamento confirmado e mensagem aberta no WhatsApp." });
      dismissAppointmentAlert(appointment.id);
      openAppointmentWhatsapp(updatedAppointment);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Nao foi possivel confirmar o agendamento.";
      setStatusMessage(message);
      showToast({ variant: "error", message });
    } finally {
      setUpdatingAppointmentId(null);
    }
  }

  async function cancelAndOpenWhatsapp(appointment: AdminAppointment) {
    setUpdatingAppointmentId(appointment.id);

    try {
      const response = await fetch(`/api/appointments/${appointment.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      const payload = (await response.json()) as { status?: string; error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Nao foi possivel cancelar o agendamento.");
      }

      const updatedAppointment = {
        ...appointment,
        status: payload.status ?? "CANCELLED",
      };

      setAppointments((current) =>
        current.map((item) =>
          item.id === appointment.id ? updatedAppointment : item,
        ),
      );
      setAppointmentsRefreshToken((current) => current + 1);
      setStatusMessage("Agendamento cancelado e mensagem aberta no WhatsApp.");
      showToast({ variant: "warning", title: "Aviso", message: "Agendamento cancelado e mensagem aberta no WhatsApp." });
      setCancelingAppointment(null);
      dismissAppointmentAlert(appointment.id);
      openAppointmentCancellationWhatsapp(updatedAppointment);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Nao foi possivel cancelar o agendamento.";
      setStatusMessage(message);
      showToast({ variant: "error", message });
    } finally {
      setUpdatingAppointmentId(null);
    }
  }

  function startReschedule(appointment: AdminAppointment) {
    setEditingAppointmentId(appointment.id);
    setRescheduleDate(appointment.startsAt.slice(0, 10));
    setRescheduleTime("");
    setRescheduleSlots([]);
    setRescheduleMessage("");
  }

  function cancelReschedule() {
    setEditingAppointmentId(null);
    setRescheduleSlots([]);
    setRescheduleTime("");
    setRescheduleMessage("");
  }

  async function saveReschedule() {
    if (!editingAppointmentId || !rescheduleTime) {
      const message = "Selecione um novo horario para remarcar.";
      setRescheduleMessage(message);
      showToast({ variant: "warning", message });
      return;
    }

    setUpdatingAppointmentId(editingAppointmentId);

    try {
      const response = await fetch(`/api/appointments/${editingAppointmentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: rescheduleDate,
          time: rescheduleTime,
        }),
      });
      const payload = (await response.json()) as {
        startsAt?: string;
        endsAt?: string;
        status?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Nao foi possivel remarcar o agendamento.");
      }

      setAppointments((current) =>
        current.map((appointment) =>
          appointment.id === editingAppointmentId
            ? {
                ...appointment,
                startsAt: payload.startsAt ?? appointment.startsAt,
                endsAt: payload.endsAt ?? appointment.endsAt,
                status: payload.status ?? appointment.status,
              }
            : appointment,
        ),
      );
      setStatusMessage("Agendamento remarcado com sucesso.");
      showToast({ variant: "success", message: "Agendamento remarcado com sucesso." });
      setAppointmentsRefreshToken((current) => current + 1);
      cancelReschedule();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Nao foi possivel remarcar o agendamento.";
      setRescheduleMessage(message);
      showToast({ variant: "error", message });
    } finally {
      setUpdatingAppointmentId(null);
    }
  }

  async function createManualAppointment() {
    if (!manualTime || !manualCustomerName.trim() || !manualCustomerPhone.trim()) {
      const message = "Preencha cliente, WhatsApp e horário para agendar.";
      setManualMessage(message);
      showToast({ variant: "warning", message });
      return;
    }

    setManualSubmitting(true);

    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serviceName: manualService,
          barberName: manualBarber,
          date: manualDate,
          time: manualTime,
          customerName: manualCustomerName,
          customerPhone: manualCustomerPhone,
          notes: manualNotes,
        }),
      });
      const payload = (await response.json()) as { message?: string; error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Nao foi possivel criar o agendamento.");
      }

      setManualMessage(payload.message ?? "Agendamento manual criado com sucesso.");
      setManualCustomerName("");
      setManualCustomerPhone("");
      setManualNotes("");
      setAppointmentsDate(manualDate);
      setAppointmentsRefreshToken((current) => current + 1);
      showToast({
        variant: "success",
        message: payload.message ?? "Agendamento manual criado com sucesso.",
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Nao foi possivel criar o agendamento.";
      setManualMessage(message);
      showToast({ variant: "error", message });
    } finally {
      setManualSubmitting(false);
    }
  }

  const barberAppointments = useMemo(
    () =>
      config.barbers
        .map((barber) => ({
          barber,
          appointments: appointments
            .filter(
              (appointment) =>
                appointment.barberName === barber.name && appointment.status !== "CANCELLED",
            )
            .sort(
              (left, right) =>
                new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime(),
            ),
        }))
        .filter((item) => item.appointments.length > 0),
    [appointments, config.barbers],
  );

  const appointmentStatusCounts = useMemo(
    () => ({
      scheduled: appointments.filter((appointment) => appointment.status === "SCHEDULED").length,
      confirmed: appointments.filter((appointment) => appointment.status === "CONFIRMED").length,
      cancelled: appointments.filter((appointment) => appointment.status === "CANCELLED").length,
    }),
    [appointments],
  );

  const pageCopy = {
    overview: {
      eyebrow: "Acesso admin",
      title: "Backoffice da barbearia",
      description:
        "Área para o dono navegar pelas configurações, agenda e indicadores sem depender de uma página única gigante.",
    },
    site: {
      eyebrow: "Configurações do site",
      title: "Conteúdo, prova social e fidelidade",
      description:
        "Atualize informações do negócio, cards da home e regras visuais da fidelidade.",
    },
    catalog: {
      eyebrow: "Catálogo e equipe",
      title: "Serviços, imagens e barbeiros",
      description:
        "Gerencie o catálogo público, os destaques visuais e a equipe exibida para o cliente.",
    },
    schedule: {
      eyebrow: "Agenda e operação",
      title: "Bloqueios, encaixes e agendamentos",
      description:
        "Controle o calendário da barbearia, crie reservas manuais e acompanhe a agenda real do dia.",
    },
  } as const;

  const currentPage = pageCopy[section];
  const showSiteSections = section === "site";
  const showCatalogSections = section === "catalog";
  const showScheduleSections = section === "schedule";
  const showOverview = section === "overview";
  const showSaveAction = section !== "overview";

  return (
    <div className={styles.adminPage}>
      <div className={styles.adminShell}>
        <aside className={styles.adminSidebar}>
          <div className={styles.sidebarBrand}>
            <strong>Prime Cut Admin</strong>
            <span>Painel de gestão da barbearia</span>
          </div>

          <nav className={styles.sidebarNav}>
            <Link className={pathname === "/admin" ? styles.sidebarNavLinkActive : ""} href="/admin">
              Visão geral
            </Link>
            <Link className={pathname === "/admin/site" ? styles.sidebarNavLinkActive : ""} href="/admin/site">
              Site
            </Link>
            <Link className={pathname === "/admin/catalogo" ? styles.sidebarNavLinkActive : ""} href="/admin/catalogo">
              Catálogo
            </Link>
            <Link className={pathname === "/admin/agenda" ? styles.sidebarNavLinkActive : ""} href="/admin/agenda">
              Agenda
            </Link>
            <Link className={pathname === "/admin/dados" ? styles.sidebarNavLinkActive : ""} href="/admin/dados">
              Dados
            </Link>
          </nav>

          <div className={styles.sidebarStats}>
            <div>
              <div className={styles.sidebarMetaLabel}>Slots padrão</div>
              <div className={styles.sidebarMetaValue}>{config.availableTimes.join(" · ")}</div>
            </div>
            <div>
              <div className={styles.sidebarMetaLabel}>Planos do clube</div>
              <div className={styles.sidebarMetaValue}>{config.plans.length} planos ativos</div>
            </div>
          </div>
        </aside>

        <main className={styles.adminContent}>
          <section className={styles.adminHeader} id="visao-geral">
            <div>
              <p className={styles.sectionEyebrow}>{currentPage.eyebrow}</p>
              <h1>{currentPage.title}</h1>
              <p>{currentPage.description}</p>
              <p className={styles.saveStatusMessage}>{statusMessage}</p>
            </div>
            <div className={styles.adminHeaderActions}>
              <AdminButton variant="secondary" type="button" onClick={openPublicSite}>
                Ver site público
              </AdminButton>
              <AdminButton variant="secondary" type="button" onClick={toggleSoundAlerts}>
                {soundAlertsEnabled ? "Som ativo" : "Ativar som"}
              </AdminButton>
              <AdminButton
                variant="secondary"
                type="button"
                onClick={() => void enableBrowserNotifications()}
              >
                {notificationsEnabled ? "Alertas ativos" : "Ativar alertas"}
              </AdminButton>
              {showSaveAction ? (
                <AdminButton variant="primary" type="button" onClick={() => void saveChanges()}>
                  {savingSync ? "Salvando..." : "Salvar alterações"}
                </AdminButton>
              ) : null}
            </div>
          </section>

          {notificationFeedback ? (
            <p className={styles.inlineStatusMessage}>{notificationFeedback}</p>
          ) : null}

          <section className={styles.summaryMetricsGrid}>
            {displayStats.map((item) => (
              <article className={styles.summaryMetricCard} key={item.label}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </article>
            ))}
          </section>

          <div className={styles.adminSections}>
            {showOverview ? (
              <section className={styles.quickLinksGrid}>
                <article className={styles.contentCard}>
                  <div className={styles.contentCardHeader}>
                    <p className={styles.sectionEyebrow}>Site</p>
                    <h2>Conteúdo e fidelidade</h2>
                    <p>Textos do negócio, indicadores da home, níveis e recompensas.</p>
                  </div>
                  <Link className={styles.inlineNavigationLink} href="/admin/site">
                    Abrir configurações do site
                  </Link>
                </article>
                <article className={styles.contentCard}>
                  <div className={styles.contentCardHeader}>
                    <p className={styles.sectionEyebrow}>Catálogo</p>
                    <h2>Serviços, imagens e equipe</h2>
                    <p>Catálogo público, galeria do site e barbeiros cadastrados.</p>
                  </div>
                  <Link className={styles.inlineNavigationLink} href="/admin/catalogo">
                    Abrir catálogo e equipe
                  </Link>
                </article>
                <article className={styles.contentCard}>
                  <div className={styles.contentCardHeader}>
                    <p className={styles.sectionEyebrow}>Agenda</p>
                    <h2>Operação do dia</h2>
                    <p>Bloqueios, encaixes manuais, calendário e agendamentos reais.</p>
                  </div>
                  <Link className={styles.inlineNavigationLink} href="/admin/agenda">
                    Abrir agenda
                  </Link>
                </article>
                <article className={styles.contentCard}>
                  <div className={styles.contentCardHeader}>
                    <p className={styles.sectionEyebrow}>Dados</p>
                    <h2>Clientes e desempenho</h2>
                    <p>Clientes, fidelidade, receita diária e dados para o futuro dashboard.</p>
                  </div>
                  <Link className={styles.inlineNavigationLink} href="/admin/dados">
                    Abrir dados
                  </Link>
                </article>
              </section>
            ) : null}

            {showSiteSections ? (
              <>
            <section className={styles.sectionSplitLayout} id="informacoes">
              <article className={styles.contentCard}>
                <div className={styles.contentCardHeader}>
                  <p className={styles.sectionEyebrow}>Conteúdo principal</p>
                  <h2>Informações do negócio</h2>
                  <p>Atualize os textos e dados principais que aparecem na home e no contato.</p>
                </div>

                <div className={styles.formFieldsGrid}>
                  <div className={styles.formField}>
                    <label htmlFor="business-name">Nome da barbearia</label>
                    <input
                      id="business-name"
                      value={config.businessName}
                      onChange={(event) => setBusinessField("businessName", event.target.value)}
                    />
                  </div>
                  <div className={styles.formField}>
                    <label htmlFor="business-tag">Linha de apoio</label>
                    <input
                      id="business-tag"
                      value={config.businessTag}
                      onChange={(event) => setBusinessField("businessTag", event.target.value)}
                    />
                  </div>
                  <div className={`${styles.formField} ${styles.formFieldFull}`}>
                    <label htmlFor="business-headline">Headline principal</label>
                    <textarea
                      id="business-headline"
                      value={config.headline}
                      onChange={(event) => setBusinessField("headline", event.target.value)}
                    />
                  </div>
                  <div className={`${styles.formField} ${styles.formFieldFull}`}>
                    <label htmlFor="hero-description">Descrição da hero</label>
                    <textarea
                      id="hero-description"
                      value={config.heroDescription}
                      onChange={(event) => setBusinessField("heroDescription", event.target.value)}
                    />
                  </div>
                  <div className={styles.formField}>
                    <label htmlFor="business-zip-code">CEP</label>
                    <input
                      id="business-zip-code"
                      value={config.zipCode}
                      onChange={(event) => setBusinessField("zipCode", event.target.value)}
                      placeholder="00000-000"
                    />
                    {addressLookupLoading || addressLookupMessage ? (
                      <p className={styles.formFieldHint}>
                        {addressLookupLoading
                          ? "Consultando CEP..."
                          : addressLookupMessage}
                      </p>
                    ) : null}
                  </div>
                  <div className={styles.formField}>
                    <label htmlFor="business-address">Endereço</label>
                    <input
                      id="business-address"
                      value={config.address}
                      onChange={(event) => setBusinessField("address", event.target.value)}
                    />
                  </div>
                  <div className={styles.formField}>
                    <label htmlFor="business-address-number">Número</label>
                    <input
                      id="business-address-number"
                      value={config.addressNumber}
                      onChange={(event) => setBusinessField("addressNumber", event.target.value)}
                      placeholder="412"
                    />
                  </div>
                  <div className={styles.formField}>
                    <label htmlFor="business-city">Cidade</label>
                    <input
                      id="business-city"
                      value={config.city}
                      onChange={(event) => setBusinessField("city", event.target.value)}
                    />
                  </div>
                  <div className={styles.formField}>
                    <label htmlFor="business-neighborhood">Bairro</label>
                    <input
                      id="business-neighborhood"
                      value={config.neighborhood}
                      onChange={(event) => setBusinessField("neighborhood", event.target.value)}
                    />
                  </div>
                  <div className={styles.formField}>
                    <label htmlFor="business-whatsapp">WhatsApp</label>
                    <input
                      id="business-whatsapp"
                      value={config.whatsapp}
                      onChange={(event) => setBusinessField("whatsapp", event.target.value)}
                    />
                  </div>
                </div>
              </article>

              <aside className={styles.infoSummaryCard}>
                <div className={styles.contentCardHeader}>
                  <p className={styles.sectionEyebrow}>Resumo</p>
                  <h2>O que esse painel controla</h2>
                </div>
                <br></br>
                <ul className={styles.summaryChecklist}>
                  <li>Título principal, endereço e canais de contato</li>
                  <li>Preços, duração e descrição dos serviços</li>
                  <li>Imagens de destaque e cards do catálogo</li>
                  <li>Equipe de barbeiros visível para o cliente</li>
                  <li>Datas bloqueadas e indisponibilidade da agenda</li>
                </ul>
              </aside>
            </section>

            <section className={styles.contentCard}>
              <div className={styles.contentCardHeader}>
                <p className={styles.sectionEyebrow}>Clube Prime</p>
                <h2>Planos do clube</h2>
                <p>
                  Edite os planos exibidos na home e na aba de assinaturas do agendamento.
                </p>
              </div>

              <div className={styles.servicesEditorList}>
                {config.plans.map((plan, index) => (
                  <div className={styles.serviceEditorCard} key={`${plan.name}-${index}`}>
                    <div className={styles.galleryCard}>
                      <div className={styles.galleryCardBody}>
                        <strong>Plano #{index + 1}</strong>
                        <span>{plan.name || "Sem nome"}</span>
                      </div>
                    </div>

                    <div className={styles.serviceEditorContent}>
                      <div className={styles.serviceEditorFields}>
                        <label className={styles.serviceField}>
                          <span>Nome do plano</span>
                          <input
                            className={styles.serviceFieldInput}
                            value={plan.name}
                            onChange={(event) => updatePlan(index, "name", event.target.value)}
                          />
                        </label>
                        <label className={styles.serviceField}>
                          <span>Preço</span>
                          <input
                            className={styles.serviceFieldInput}
                            value={plan.price}
                            onChange={(event) => updatePlan(index, "price", event.target.value)}
                          />
                        </label>
                        <label className={`${styles.serviceField} ${styles.serviceFieldDescription}`}>
                          <span>Resumo</span>
                          <textarea
                            className={styles.serviceFieldInput}
                            value={plan.summary}
                            onChange={(event) => updatePlan(index, "summary", event.target.value)}
                          />
                        </label>
                      </div>

                      <AdminButton
                        variant="danger"
                        type="button"
                        onClick={() => removePlan(index)}
                      >
                        Remover plano
                      </AdminButton>
                    </div>
                  </div>
                ))}
              </div>

              <AdminButton variant="primary" type="button" onClick={addPlan}>
                Adicionar plano
              </AdminButton>
            </section>

            <section className={styles.contentCard}>
              <div className={styles.contentCardHeader}>
                <p className={styles.sectionEyebrow}>Indicadores da home</p>
                <h2>Cards de prova social</h2>
                <p>
                  Edite os cards de clientes atendidos, nota média e tempo de operação.
                  A quantidade de barbeiros continua atualizando automaticamente pela equipe cadastrada.
                </p>
              </div>

              <div className={styles.formFieldsGrid}>
                <div className={styles.formField}>
                  <label htmlFor="stats-clients-value">Clientes atendidos</label>
                  <input
                    id="stats-clients-value"
                    value={config.stats[0]?.value ?? ""}
                    onChange={(event) => updateStat(0, "value", event.target.value)}
                  />
                </div>
                <div className={styles.formField}>
                  <label htmlFor="stats-clients-label">Texto do card</label>
                  <input
                    id="stats-clients-label"
                    value={config.stats[0]?.label ?? ""}
                    onChange={(event) => updateStat(0, "label", event.target.value)}
                  />
                </div>

                <div className={styles.formField}>
                  <label htmlFor="stats-rating-value">Média de avaliações</label>
                  <input
                    id="stats-rating-value"
                    value={averageRatingValue}
                    readOnly
                  />
                </div>
                <div className={styles.formField}>
                  <label htmlFor="stats-rating-label">Texto do card</label>
                  <input
                    id="stats-rating-label"
                    value={config.stats[1]?.label ?? ""}
                    onChange={(event) => updateStat(1, "label", event.target.value)}
                  />
                </div>

                <div className={styles.formField}>
                  <label htmlFor="stats-years-value">Tempo de operação</label>
                  <input
                    id="stats-years-value"
                    value={config.stats[2]?.value ?? ""}
                    onChange={(event) => updateStat(2, "value", event.target.value)}
                  />
                </div>
                <div className={styles.formField}>
                  <label htmlFor="stats-years-label">Texto do card</label>
                  <input
                    id="stats-years-label"
                    value={config.stats[2]?.label ?? ""}
                    onChange={(event) => updateStat(2, "label", event.target.value)}
                  />
                </div>
              </div>

              <p className={styles.formFieldHint}>
                A média de avaliações é calculada automaticamente a partir das avaliações do site e do Google.
              </p>
            </section>

            <section className={styles.contentCard} id="fidelidade">
              <div className={styles.contentCardHeader}>
                <p className={styles.sectionEyebrow}>Fidelidade</p>
                <h2>Vantagens e recompensas</h2>
                <p>
                  Edite as metas e benefícios exibidos na aba de fidelidade e na página do cliente.
                </p>
              </div>

              <div className={styles.contentCardHeader}>
                <p className={styles.sectionEyebrow}>Níveis</p>
                <h2>Níveis da fidelidade</h2>
                <p>
                  Ajuste nome, faixas de pontos e cor de destaque de cada nível do programa.
                </p>
              </div>

              <div className={styles.servicesEditorList}>
                {config.loyaltyTiers.map((tier, index) => (
                  <div className={styles.serviceEditorCard} key={`${tier.name}-${index}`}>
                    <div className={styles.galleryCard}>
                      <div className={styles.galleryCardBody}>
                        <strong>Nível #{index + 1}</strong>
                        <span>{tier.name || "Sem nome"}</span>
                        <div
                          className={styles.loyaltyTierSwatch}
                          style={{ backgroundColor: tier.accent }}
                        />
                      </div>
                    </div>

                    <div className={styles.serviceEditorContent}>
                      <div className={styles.serviceEditorFields}>
                        <label className={styles.serviceField}>
                          <span>Nome do nível</span>
                          <input
                            className={styles.serviceFieldInput}
                            value={tier.name}
                            onChange={(event) =>
                              updateLoyaltyTier(index, "name", event.target.value)
                            }
                          />
                        </label>
                        <label className={styles.serviceField}>
                          <span>Pontos iniciais</span>
                          <input
                            className={styles.serviceFieldInput}
                            value={tier.minPoints}
                            onChange={(event) =>
                              updateLoyaltyTier(index, "minPoints", event.target.value)
                            }
                          />
                        </label>
                        <label className={styles.serviceField}>
                          <span>Pontos finais</span>
                          <input
                            className={styles.serviceFieldInput}
                            value={tier.maxPoints ?? ""}
                            placeholder="Deixe vazio para nível máximo"
                            onChange={(event) =>
                              updateLoyaltyTier(index, "maxPoints", event.target.value)
                            }
                          />
                        </label>
                        <label className={styles.serviceField}>
                          <span>Cor</span>
                          <input
                            className={styles.serviceFieldInput}
                            value={tier.accent}
                            onChange={(event) =>
                              updateLoyaltyTier(index, "accent", event.target.value)
                            }
                          />
                        </label>
                      </div>

                      <AdminButton
                        variant="danger"
                        type="button"
                        onClick={() => removeLoyaltyTier(index)}
                      >
                        Remover nível
                      </AdminButton>
                    </div>
                  </div>
                ))}
              </div>

              <AdminButton variant="primary" type="button" onClick={addLoyaltyTier}>
                Adicionar nível
              </AdminButton>

              <div className={styles.servicesEditorList}>
                {config.loyaltyRewards.map((reward, index) => (
                  <div className={styles.serviceEditorCard} key={`${reward.points}-${index}`}>
                    <div className={styles.galleryCard}>
                      <div className={styles.galleryCardBody}>
                        <strong>Meta #{index + 1}</strong>
                        <span>{reward.points} pts</span>
                      </div>
                    </div>

                    <div className={styles.serviceEditorContent}>
                      <div className={styles.serviceEditorFields}>
                        <label className={styles.serviceField}>
                          <span>Pontos</span>
                          <input
                            className={styles.serviceFieldInput}
                            value={reward.points}
                            onChange={(event) =>
                              updateLoyaltyReward(index, "points", event.target.value)
                            }
                          />
                        </label>
                        <label className={styles.serviceField}>
                          <span>Título da recompensa</span>
                          <input
                            className={styles.serviceFieldInput}
                            value={reward.title}
                            onChange={(event) =>
                              updateLoyaltyReward(index, "title", event.target.value)
                            }
                          />
                        </label>
                        <label className={`${styles.serviceField} ${styles.serviceFieldDescription}`}>
                          <span>Descrição</span>
                          <textarea
                            className={styles.serviceFieldInput}
                            value={reward.description}
                            onChange={(event) =>
                              updateLoyaltyReward(index, "description", event.target.value)
                            }
                          />
                        </label>
                      </div>

                      <AdminButton
                        variant="danger"
                        type="button"
                        onClick={() => removeLoyaltyReward(index)}
                      >
                        Remover recompensa
                      </AdminButton>
                    </div>
                  </div>
                ))}
              </div>

              <AdminButton variant="primary" type="button" onClick={addLoyaltyReward}>
                Adicionar recompensa
              </AdminButton>
            </section>
              </>
            ) : null}

            {showCatalogSections ? (
              <>
            <section className={styles.contentCard} id="servicos">
              <div className={styles.contentCardHeader}>
                <p className={styles.sectionEyebrow}>Catálogo</p>
                <h2>Serviços e valores</h2>
                <p>Atualize preço, descrição, duração e remova serviços que não estiverem ativos.</p>
              </div>

              <AdminButton variant="primary" type="button" onClick={openCreateServiceModal}>
                Adicionar serviço
              </AdminButton>

              <div className={styles.servicesEditorList}>
                {config.services.map((service, index) => (
                  <div className={styles.serviceEditorCard} key={`${service.name}-${index}`}>
                    <div className={styles.galleryCard}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        className={styles.galleryPreview}
                        src={service.image}
                        alt={`Preview do serviço ${service.name}`}
                      />
                      <div className={styles.galleryCardBody}>
                        <strong>Imagem do serviço</strong>
                        <span>{service.name}</span>
                        <input
                          ref={(element) => {
                            serviceImageInputRefs.current[index] = element;
                          }}
                          className={styles.visuallyHiddenInput}
                          type="file"
                          accept="image/*"
                          onChange={(event) => updateServiceImage(index, event.target.files?.[0] ?? null)}
                        />
                        <AdminButton
                          variant="secondary"
                          type="button"
                          onClick={() => openServiceImagePicker(index)}
                        >
                          Trocar imagem
                        </AdminButton>
                      </div>
                    </div>
                    <div className={styles.serviceEditorContent}>
                      <div className={styles.serviceEditorFields}>
                        <label className={styles.serviceField}>
                          <span>Nome do serviço</span>
                          <input
                            className={styles.serviceFieldInput}
                            value={service.name}
                            onChange={(event) => updateService(index, "name", event.target.value)}
                          />
                        </label>
                        <label className={styles.serviceField}>
                          <span>Valor</span>
                          <input
                            className={styles.serviceFieldInput}
                            value={service.price}
                            onChange={(event) => updateService(index, "price", event.target.value)}
                          />
                        </label>
                        <label className={styles.serviceField}>
                          <span>Duração</span>
                          <input
                            className={styles.serviceFieldInput}
                            value={service.duration}
                            onChange={(event) => updateService(index, "duration", event.target.value)}
                          />
                        </label>
                        <label className={styles.serviceField}>
                          <span>Clube / assinatura</span>
                          <input
                            className={styles.serviceFieldInput}
                            value={service.membership}
                            onChange={(event) => updateService(index, "membership", event.target.value)}
                          />
                        </label>
                        <label className={`${styles.serviceField} ${styles.serviceFieldDescription}`}>
                          <span>Descrição</span>
                          <textarea
                            className={styles.serviceFieldInput}
                            value={service.description}
                            onChange={(event) => updateService(index, "description", event.target.value)}
                          />
                        </label>
                      </div>
                      <AdminButton
                        variant="danger"
                        type="button"
                        onClick={() =>
                          setRemovalTarget({
                            type: "service",
                            index,
                            label: service.name,
                          })
                        }
                      >
                        Remover serviço
                      </AdminButton>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className={styles.contentCard} id="imagens">
              <div className={styles.contentCardHeader}>
                <p className={styles.sectionEyebrow}>Galeria</p>
                <h2>Imagens do site</h2>
                <p>Troque os destaques visuais da home. O preview também atualiza no site ao salvar.</p>
              </div>

              <div className={styles.galleryGrid}>
                {config.showcaseImages.map((image, index) => (
                  <article className={styles.galleryCard} key={`${image.label}-${index}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className={styles.galleryPreview} src={image.src} alt={image.alt} />
                    <div className={styles.galleryCardBody}>
                      <strong>{image.label}</strong>
                      <span>{image.title}</span>
                      <input
                        ref={(element) => {
                          showcaseImageInputRefs.current[index] = element;
                        }}
                        className={styles.visuallyHiddenInput}
                        type="file"
                        accept="image/*"
                        onChange={(event) => updateShowcaseImage(index, event.target.files?.[0] ?? null)}
                      />
                      <AdminButton
                        variant="secondary"
                        type="button"
                        onClick={() => openShowcaseImagePicker(index)}
                      >
                        Trocar imagem
                      </AdminButton>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className={styles.sectionSplitLayout} id="barbeiros">
              <article className={styles.contentCard}>
                <div className={styles.contentCardHeader}>
                  <p className={styles.sectionEyebrow}>Equipe</p>
                  <h2>Barbeiros</h2>
                  <p>Cadastre novos profissionais e ajuste a apresentação da equipe.</p>
                </div>

                <div className={styles.formFieldsGrid}>
                  <div className={styles.formField}>
                    <label htmlFor="barber-name">Nome</label>
                    <input
                      id="barber-name"
                      value={barberName}
                      onChange={(event) => setBarberName(event.target.value)}
                      placeholder="Ex.: Gabriel Rocha"
                    />
                  </div>
                  <div className={styles.formField}>
                    <label htmlFor="barber-role">Especialidade</label>
                    <input
                      id="barber-role"
                      value={barberRole}
                      onChange={(event) => setBarberRole(event.target.value)}
                      placeholder="Ex.: Corte social e barba"
                    />
                  </div>
                </div>

                <AdminButton
                  variant="primary"
                  type="button"
                  onClick={addBarber}
                >
                  Adicionar barbeiro
                </AdminButton>
              </article>

              <aside className={styles.sideListCard}>
                <div className={styles.contentCardHeader}>
                  <p className={styles.sectionEyebrow}>Equipe cadastrada</p>
                  <h2 className={styles.listCardTitle}>
                    {config.barbers.length} {config.barbers.length === 1 ? "profissional" : "profissionais"}
                  </h2>
                </div>
                <div className={styles.stackedList}>
                  {config.barbers.map((barber) => (
                    <div className={styles.stackedListItem} key={barber.name}>
                      <div className={styles.stackedListText}>
                        <strong>{barber.name}</strong>
                        <span>{barber.role}</span>
                      </div>
                      <AdminButton
                        variant="danger"
                        type="button"
                        onClick={() =>
                          setRemovalTarget({
                            type: "barber",
                            name: barber.name,
                            label: barber.name,
                          })
                        }
                      >
                        Remover
                      </AdminButton>
                    </div>
                  ))}
                </div>
              </aside>
            </section>
              </>
            ) : null}

            {showScheduleSections ? (
              <>
            <section className={styles.sectionSplitLayout} id="agenda">
              <article className={styles.contentCard}>
                <div className={styles.contentCardHeader}>
                  <p className={styles.sectionEyebrow}>Agenda</p>
                  <h2>Datas que a barbearia vai fechar (feriados)</h2>
                  <p>Marque feriados, fechamentos pontuais ou períodos de treinamento.</p>
                </div>

                <div className={styles.inlineFormRow}>
                  <div className={styles.formField}>
                    <label htmlFor="closing-date">Data</label>
                    <DatePickerField
                      value={closingDate}
                      onChange={setClosingDate}
                    />
                  </div>
                  <div className={styles.formField}>
                    <label htmlFor="closing-reason">Motivo</label>
                    <input
                      id="closing-reason"
                      value={closingReason}
                      onChange={(event) => setClosingReason(event.target.value)}
                    />
                  </div>
                  <AdminButton
                    className={styles.inlineRowAction}
                    variant="primary"
                    type="button"
                    onClick={addClosedDate}
                  >
                    Bloquear data
                  </AdminButton>
                </div>
                <p className={styles.formFieldHint}>
                  {holidayLookupLoading ? "Consultando feriados do mes..." : holidayLookupMessage}
                </p>
              </article>

              <aside className={styles.sideListCard}>
                <div className={styles.contentCardHeader}>
                  <p className={styles.sectionEyebrow}>Agenda bloqueada</p>
                  <h2 className={styles.listCardTitle}>
                    {displayedClosedDates.length} datas cadastradas
                  </h2>
                </div>
                <div className={styles.stackedList}>
                  {displayedClosedDates.map((item) => (
                    <div className={styles.blockedDateItem} key={item.date}>
                      <div className={styles.blockedDateBadge}>
                        <strong>{getDateParts(item.date).day}</strong>
                        <span>{getDateParts(item.date).month}</span>
                      </div>
                      <div className={styles.stackedListText}>
                        <strong>{getDateParts(item.date).full}</strong>
                        <span>
                          {item.reason}
                          {item.source === "holiday" ? " • feriado automatico" : ""}
                        </span>
                      </div>
                      <AdminButton
                        variant="danger"
                        type="button"
                        onClick={() =>
                          setRemovalTarget({
                            type: "closedDate",
                            date: item.date,
                            label: `${getDateParts(item.date).full} - ${item.reason}`,
                          })
                        }
                      >
                        Remover
                      </AdminButton>
                    </div>
                  ))}
                </div>
              </aside>
            </section>

            <section className={styles.sectionSplitLayout} id="folgas">
              <article className={styles.contentCard}>
                <div className={styles.contentCardHeader}>
                  <p className={styles.sectionEyebrow}>Agenda</p>
                  <h2>Folgas por profissional</h2>
                  <p>Bloqueie datas específicas para um barbeiro sem fechar a barbearia inteira.</p>
                </div>

                <div className={styles.inlineFormRow}>
                  <div className={styles.formField}>
                    <label htmlFor="time-off-barber">Profissional</label>
                    <select
                      id="time-off-barber"
                      value={timeOffBarberName}
                      onChange={(event) => setTimeOffBarberName(event.target.value)}
                    >
                      {config.barbers.map((barber) => (
                        <option key={barber.name} value={barber.name}>
                          {barber.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.formField}>
                    <label htmlFor="time-off-date">Data</label>
                    <DatePickerField value={timeOffDate} onChange={setTimeOffDate} />
                  </div>
                  <div className={styles.formField}>
                    <label htmlFor="time-off-reason">Motivo</label>
                    <input
                      id="time-off-reason"
                      value={timeOffReason}
                      onChange={(event) => setTimeOffReason(event.target.value)}
                    />
                  </div>
                  <AdminButton
                    className={styles.inlineRowAction}
                    variant="primary"
                    type="button"
                    onClick={addBarberTimeOff}
                    disabled={config.barbers.length === 0}
                  >
                    Adicionar folga
                  </AdminButton>
                </div>
              </article>

              <aside className={styles.sideListCard}>
                <div className={styles.contentCardHeader}>
                  <p className={styles.sectionEyebrow}>Folgas cadastradas</p>
                  <h2 className={styles.listCardTitle}>
                    {config.barberTimeOff.length} folgas cadastradas
                  </h2>
                </div>
                <div className={styles.stackedList}>
                  {config.barberTimeOff
                    .slice()
                    .sort((left, right) => left.date.localeCompare(right.date))
                    .map((item) => (
                      <div className={styles.blockedDateItem} key={`${item.barberName}-${item.date}`}>
                        <div className={styles.blockedDateBadge}>
                          <strong>{getDateParts(item.date).day}</strong>
                          <span>{getDateParts(item.date).month}</span>
                        </div>
                        <div className={styles.stackedListText}>
                          <strong>{item.barberName}</strong>
                          <span>
                            {getDateParts(item.date).full} • {item.reason}
                          </span>
                        </div>
                        <AdminButton
                          variant="danger"
                          type="button"
                          onClick={() =>
                            setRemovalTarget({
                              type: "barberTimeOff",
                              barberName: item.barberName,
                              date: item.date,
                              label: `${item.barberName} em ${getDateParts(item.date).full}`,
                            })
                          }
                        >
                          Remover
                        </AdminButton>
                      </div>
                    ))}
                </div>
              </aside>
            </section>

            <section className={styles.sectionSplitLayout} id="operacao-agenda">
              <article className={styles.contentCard}>
                <div className={styles.contentCardHeader}>
                  <p className={styles.sectionEyebrow}>Agendamento manual</p>
                  <h2>Criar horário pelo backoffice</h2>
                  <p>Use este card para encaixes, reservas por telefone ou marcações feitas no balcão.</p>
                </div>

                <div className={styles.formFieldsGrid}>
                  <div className={styles.formField}>
                    <label>Serviço</label>
                    <select value={manualService} onChange={(event) => setManualService(event.target.value)}>
                      {config.services.map((service) => (
                        <option key={service.name} value={service.name}>
                          {service.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.formField}>
                    <label>Barbeiro</label>
                    <select value={manualBarber} onChange={(event) => setManualBarber(event.target.value)}>
                      {config.barbers.map((barber) => (
                        <option key={barber.name} value={barber.name}>
                          {barber.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.formField}>
                    <label>Data</label>
                    <DatePickerField value={manualDate} onChange={setManualDate} />
                  </div>
                  <div className={styles.formField}>
                    <label>Horário</label>
                    <select value={manualTime} onChange={(event) => setManualTime(event.target.value)}>
                      <option value="">Selecione</option>
                      {manualSlots.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.formField}>
                    <label>Cliente</label>
                    <input
                      value={manualCustomerName}
                      onChange={(event) => setManualCustomerName(event.target.value)}
                      placeholder="Nome do cliente"
                    />
                  </div>
                  <div className={styles.formField}>
                    <label>WhatsApp</label>
                    <input
                      value={manualCustomerPhone}
                      onChange={(event) => setManualCustomerPhone(event.target.value)}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <div className={`${styles.formField} ${styles.formFieldFull}`}>
                    <label>Observações</label>
                    <textarea
                      value={manualNotes}
                      onChange={(event) => setManualNotes(event.target.value)}
                      placeholder="Ex.: cliente pediu acabamento na navalha"
                    />
                  </div>
                </div>

                {manualLoadingSlots ? (
                  <p className={styles.inlineStatusMessage}>Carregando horários...</p>
                ) : manualDateClosedReason ? (
                  <p className={styles.inlineStatusMessage}>
                    Agenda bloqueada nesta data: {manualDateClosedReason}.
                  </p>
                ) : manualMessage ? (
                  <p className={styles.inlineStatusMessage}>{manualMessage}</p>
                ) : null}

                <AdminButton
                  variant="primary"
                  type="button"
                  disabled={manualSubmitting || manualLoadingSlots || !manualTime}
                  onClick={() => void createManualAppointment()}
                >
                  {manualSubmitting ? "Agendando..." : "Criar agendamento"}
                </AdminButton>
              </article>

              <aside className={styles.contentCard}>
                <div className={styles.contentCardHeader}>
                  <p className={styles.sectionEyebrow}>Calendário da agenda</p>
                  <h2>Visão diária por barbeiro</h2>
                  <p>Clique no dia para ver os horários disponíveis e os atendimentos já ocupados.</p>
                </div>

                <InlineCalendar
                  key={appointmentsDate}
                  value={appointmentsDate}
                  onChange={setAppointmentsDate}
                />

                {selectedDateClosedReason ? (
                  <p className={styles.inlineStatusMessage}>
                    Data marcada como fechada: {selectedDateClosedReason}.
                  </p>
                ) : null}

                {barberAppointments.length > 0 ? (
                  <div className={styles.barberAgendaGrid}>
                    {barberAppointments.map(({ barber, appointments: barberAppointmentItems }) => (
                      <article className={styles.barberAgendaColumn} key={barber.name}>
                        <div className={styles.barberAgendaHeader}>
                          <strong>{barber.name}</strong>
                          <span>{formatDateToPtBr(appointmentsDate)}</span>
                        </div>

                        <div className={styles.barberAppointmentList}>
                          {barberAppointmentItems.map((appointment) => {
                            const durationMinutes =
                              serviceDurationMap.get(appointment.serviceName) ?? 30;

                            return (
                              <div className={`${styles.barberAppointmentItem} ${styles.barberAppointmentBusy}`} key={appointment.id}>
                                <strong className={styles.barberAppointmentTime}>
                                  {formatAppointmentTime(appointment.startsAt)}
                                </strong>
                                <div className={styles.barberAppointmentContent}>
                                  <strong className={styles.barberAppointmentCustomer}>
                                    {appointment.customerName}
                                  </strong>
                                  <div className={styles.barberAppointmentMeta}>
                                    <span>{appointment.serviceName}</span>
                                    <span>{appointment.barberName}</span>
                                    <span>{durationMinutes} min</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className={styles.emptyPanel}>Nenhum agendamento encontrado para esta data.</p>
                )}
              </aside>
            </section>

            <section className={styles.contentCard} id="agendamentos">
              <article className={styles.contentCardBody}>
                <div className={styles.contentCardHeader}>
                  <p className={styles.sectionEyebrow}>Agenda real</p>
                  <h2>Agendamentos do dia</h2>
                  <p>
                    Visualize os horários já confirmados pelo formulário público.
                  </p>
                </div>

                <div className={styles.inlineFormRow}>
                  <div className={styles.formField}>
                    <label htmlFor="appointments-date">Data</label>
                    <DatePickerField
                      value={appointmentsDate}
                      onChange={setAppointmentsDate}
                    />
                  </div>
                  <div className={styles.inlineMetricCard}>
                    <span className={styles.sidebarMetaLabel}>Agendados / remarcados</span>
                    <strong>{appointmentStatusCounts.scheduled}</strong>
                  </div>
                  <div className={styles.inlineMetricCard}>
                    <span className={styles.sidebarMetaLabel}>Confirmados</span>
                    <strong>{appointmentStatusCounts.confirmed}</strong>
                  </div>
                  <div className={styles.inlineMetricCard}>
                    <span className={styles.sidebarMetaLabel}>Cancelados</span>
                    <strong>{appointmentStatusCounts.cancelled}</strong>
                  </div>
                </div>

                <div className={styles.appointmentsFeed}>
                  {appointmentsLoading ? (
                    <p className={styles.emptyPanel}>Carregando agendamentos...</p>
                  ) : appointments.length > 0 ? (
                    appointments.map((appointment) => (
                      <article className={styles.appointmentCard} key={appointment.id}>
                        <div className={styles.appointmentTimeBlock}>
                          <strong>{formatAppointmentTime(appointment.startsAt)}</strong>
                          <span>{getAppointmentStatusLabel(appointment.status)}</span>
                        </div>
                        <div className={styles.appointmentDetails}>
                          <strong>{appointment.customerName}</strong>
                          <span>
                            {appointment.serviceName} com {appointment.barberName}
                          </span>
                          <span>{appointment.customerPhone}</span>
                          {appointment.notes ? <p>{appointment.notes}</p> : null}
                        </div>
                        <div className={styles.appointmentActionGroup}>
                          <AdminButton
                            variant="warning"
                            type="button"
                            disabled={updatingAppointmentId === appointment.id}
                            onClick={() => startReschedule(appointment)}
                          >
                            Remarcar
                          </AdminButton>
                          <AdminButton
                            variant="success"
                            type="button"
                            disabled={updatingAppointmentId === appointment.id || appointment.status === "CONFIRMED"}
                            onClick={() => void confirmAndOpenWhatsapp(appointment)}
                          >
                            Confirmar + WhatsApp
                          </AdminButton>
                          <AdminButton
                            variant="danger"
                            type="button"
                            disabled={updatingAppointmentId === appointment.id || appointment.status === "CANCELLED"}
                            onClick={() => setCancelingAppointment(appointment)}
                          >
                            Cancelar
                          </AdminButton>
                        </div>
                        {editingAppointmentId === appointment.id ? (
                          <div className={styles.rescheduleCard}>
                            <div className={styles.rescheduleFields}>
                              <div className={styles.formField}>
                                <label>Nova data</label>
                                <DatePickerField
                                  value={rescheduleDate}
                                  onChange={setRescheduleDate}
                                />
                              </div>
                              <div className={styles.formField}>
                                <label>Novo horário</label>
                                <select
                                  value={rescheduleTime}
                                  onChange={(event) => setRescheduleTime(event.target.value)}
                                >
                                  <option value="">Selecione</option>
                                  {rescheduleSlots.map((slot) => (
                                    <option key={slot} value={slot}>
                                      {slot}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {loadingRescheduleSlots ? (
                              <p className={styles.rescheduleStatusMessage}>Carregando horarios...</p>
                            ) : rescheduleMessage ? (
                              <p className={styles.rescheduleStatusMessage}>{rescheduleMessage}</p>
                            ) : null}

                            <div className={styles.rescheduleActionRow}>
                              <AdminButton
                                variant="secondary"
                                type="button"
                                onClick={cancelReschedule}
                              >
                                Fechar
                              </AdminButton>
                              <AdminButton
                                variant="primary"
                                type="button"
                                disabled={
                                  updatingAppointmentId === appointment.id ||
                                  loadingRescheduleSlots ||
                                  !rescheduleTime
                                }
                                onClick={() => void saveReschedule()}
                              >
                                Salvar nova data
                              </AdminButton>
                            </div>
                          </div>
                        ) : null}
                      </article>
                    ))
                  ) : (
                    <p className={styles.emptyPanel}>{appointmentsMessage}</p>
                  )}
                </div>
              </article>
            </section>
              </>
            ) : null}
          </div>

          <footer className={styles.adminFooter}>
            <DaBiTechSignature
              containerClassName={styles.adminFooterInner}
              labelClassName={styles.adminFooterLabel}
              logoClassName={styles.adminFooterLogo}
              linkClassName={styles.adminFooterLink}
            />
          </footer>
        </main>
      </div>

      {cancelingAppointment ? (
        <div className={styles.dialogOverlay}>
          <div className={styles.dialogCard}>
            <div className={styles.contentCardHeader}>
              <p className={styles.sectionEyebrow}>Confirmar cancelamento</p>
              <h2>Cancelar este horário?</h2>
              <p>
                {cancelingAppointment.customerName} está marcado para{" "}
                {cancelingAppointment.serviceName} com {cancelingAppointment.barberName} em{" "}
                {formatDateToPtBr(cancelingAppointment.startsAt.slice(0, 10))} às{" "}
                {formatAppointmentTime(cancelingAppointment.startsAt)}.
              </p>
            </div>

            <p className={styles.dialogText}>
              Ao confirmar, o sistema cancela o agendamento e abre o WhatsApp com a mensagem pronta para o cliente.
            </p>

            <div className={styles.dialogActions}>
              <AdminButton
                variant="secondary"
                type="button"
                onClick={() => setCancelingAppointment(null)}
              >
                Voltar
              </AdminButton>
              <AdminButton
                variant="danger"
                type="button"
                disabled={updatingAppointmentId === cancelingAppointment.id}
                onClick={() => void cancelAndOpenWhatsapp(cancelingAppointment)}
              >
                Confirmar cancelamento
              </AdminButton>
            </div>
          </div>
        </div>
      ) : null}

      {newAppointmentAlerts.length > 0 ? (
        <div className={styles.notificationStack}>
          {newAppointmentAlerts.map((appointment) => (
            <article className={styles.notificationCard} key={appointment.id}>
              <div className={styles.notificationCardHeader}>
                <span className={styles.sectionEyebrow}>Novo agendamento</span>
                <button
                  className={styles.notificationCloseButton}
                  onClick={() => dismissAppointmentAlert(appointment.id)}
                  type="button"
                  aria-label="Dispensar notificação"
                >
                  ×
                </button>
              </div>
              <strong>{appointment.customerName}</strong>
              <p>
                {appointment.serviceName} com {appointment.barberName}
              </p>
              <p>
                {formatDateToPtBr(appointment.startsAt.slice(0, 10))} às{" "}
                {formatAppointmentTime(appointment.startsAt)}
              </p>
              <div className={styles.notificationActions}>
                <AdminButton
                  variant="success"
                  type="button"
                  disabled={updatingAppointmentId === appointment.id}
                  onClick={() => void confirmAndOpenWhatsapp(appointment)}
                >
                  Confirmar
                </AdminButton>
                <AdminButton
                  variant="secondary"
                  type="button"
                  onClick={() => {
                    setAppointmentsDate(appointment.startsAt.slice(0, 10));
                    setAppointmentsRefreshToken((current) => current + 1);
                    dismissAppointmentAlert(appointment.id);
                  }}
                >
                  Ver agenda
                </AdminButton>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {removalTarget ? (
        <div className={styles.dialogOverlay}>
          <div className={styles.dialogCard}>
            <div className={styles.contentCardHeader}>
              <p className={styles.sectionEyebrow}>Confirmar remoção</p>
              <h2>{removalModalCopy?.title}</h2>
              <p>{removalTarget.label}</p>
            </div>

            <p className={styles.dialogText}>
              {removalModalCopy?.description} Depois disso, você ainda precisa salvar as alterações para refletir no site e na agenda.
            </p>

            <div className={styles.dialogActions}>
              <AdminButton
                variant="secondary"
                type="button"
                onClick={() => setRemovalTarget(null)}
              >
                Voltar
              </AdminButton>
              <AdminButton
                variant="danger"
                type="button"
                onClick={confirmRemoval}
              >
                Confirmar remoção
              </AdminButton>
            </div>
          </div>
        </div>
      ) : null}

      {isCreateServiceModalOpen ? (
        <div className={styles.dialogOverlay}>
          <div className={styles.dialogCard}>
            <div className={styles.contentCardHeader}>
              <p className={styles.sectionEyebrow}>Novo serviço</p>
              <h2>Criar serviço no catálogo</h2>
              <p>Preencha os dados principais para adicionar um novo serviço ao site.</p>
            </div>

            <div className={styles.galleryCard}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className={styles.galleryPreview}
                src={newService.image || config.services[0]?.image || ""}
                alt="Preview do novo serviço"
              />
              <div className={styles.galleryCardBody}>
                <strong>Imagem do serviço</strong>
                <span>{newService.name || "Novo serviço"}</span>
                <input
                  ref={newServiceImageInputRef}
                  className={styles.visuallyHiddenInput}
                  type="file"
                  accept="image/*"
                  onChange={(event) => updateNewServiceImage(event.target.files?.[0] ?? null)}
                />
                <AdminButton
                  variant="secondary"
                  type="button"
                  onClick={openNewServiceImagePicker}
                >
                  Trocar imagem
                </AdminButton>
              </div>
            </div>

            <div className={styles.formFieldsGrid}>
              <div className={styles.formField}>
                <label htmlFor="new-service-name">Nome</label>
                <input
                  id="new-service-name"
                  value={newService.name}
                  onChange={(event) => updateNewServiceField("name", event.target.value)}
                />
              </div>
              <div className={styles.formField}>
                <label htmlFor="new-service-price">Preço</label>
                <input
                  id="new-service-price"
                  value={newService.price}
                  onChange={(event) => updateNewServiceField("price", event.target.value)}
                  placeholder="60"
                />
              </div>
              <div className={styles.formField}>
                <label htmlFor="new-service-duration">Duração</label>
                <input
                  id="new-service-duration"
                  value={newService.duration}
                  onChange={(event) => updateNewServiceField("duration", event.target.value)}
                  placeholder="40"
                />
              </div>
              <div className={styles.formField}>
                <label htmlFor="new-service-membership">Clube / assinatura</label>
                <input
                  id="new-service-membership"
                  value={newService.membership}
                  onChange={(event) => updateNewServiceField("membership", event.target.value)}
                  placeholder="R$ 149,90 no clube"
                />
              </div>
              <div className={`${styles.formField} ${styles.formFieldFull}`}>
                <label htmlFor="new-service-description">Descrição</label>
                <textarea
                  id="new-service-description"
                  ref={newServiceDescriptionInputRef}
                  className={newServiceDescriptionInvalid ? styles.formFieldInvalid : ""}
                  value={newService.description}
                  onChange={(event) => updateNewServiceField("description", event.target.value)}
                />
              </div>
            </div>

            <div className={styles.dialogActions}>
              <AdminButton variant="secondary" type="button" onClick={closeCreateServiceModal}>
                Fechar
              </AdminButton>
              <AdminButton variant="primary" type="button" onClick={createService}>
                Criar serviço
              </AdminButton>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
