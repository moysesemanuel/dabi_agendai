"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { readCustomerReviews } from "@/components/projects/barbershop/reviews-storage";
import { useSiteConfig } from "@/components/projects/barbershop/use-site-config";
import {
  getDisplayStats,
  LEGACY_BUSINESS_TAG_PREFIX,
  type PlanItem,
  type LoyaltyRewardItem,
  type LoyaltyTierItem,
  type BusinessHoursItem,
  SITE_CONFIG_UPDATED_EVENT,
} from "@/components/shared/site-config";
import { useToast } from "@/components/shared/toast-provider";
import { buildWhatsappUrl } from "@/components/shared/whatsapp";
import {
  buildAppointmentCancellationWhatsappMessage,
  buildAppointmentWhatsappMessage,
  formatDateToPtBr,
  formatServiceDuration,
  formatServicePrice,
  getRemovalModalCopy,
  getTodayDateKey,
  parseDurationToMinutes,
} from "./admin-formatters";
import {
  ADMIN_NOTIFICATIONS_STORAGE_KEY,
  ADMIN_SOUND_ALERTS_STORAGE_KEY,
  type AddressLookupPayload,
  type AdminAppointment,
  type AdminSectionView,
  type AvailabilityPayload,
  type CurrentMonthHoliday,
  type DisplayClosedDate,
  type HolidayLookupPayload,
  type RemovalTarget,
  type ServiceDraft,
} from "./admin-types";

export function useAdminPageState(section: AdminSectionView) {
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

  function updateBusinessHoursDay(weekday: number, patch: Partial<BusinessHoursItem>) {
    setConfig((current) => ({
      ...current,
      businessHours: current.businessHours.map((day) =>
        day.weekday === weekday ? { ...day, ...patch } : day,
      ),
    }));
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
    window.open("/", "_blank", "noopener,noreferrer");
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


  return {
    pathname,
    config,
    setConfig,
    closingDate,
    setClosingDate,
    closingReason,
    setClosingReason,
    timeOffBarberName,
    setTimeOffBarberName,
    timeOffDate,
    setTimeOffDate,
    timeOffReason,
    setTimeOffReason,
    addressLookupMessage,
    addressLookupLoading,
    holidayLookupMessage,
    holidayLookupLoading,
    currentMonthHolidays,
    appointmentsDate,
    setAppointmentsDate,
    appointments,
    appointmentsMessage,
    appointmentsLoading,
    setAppointmentsRefreshToken,
    averageRatingValue,
    savingSync,
    updatingAppointmentId,
    editingAppointmentId,
    setEditingAppointmentId,
    cancelingAppointment,
    setCancelingAppointment,
    removalTarget,
    setRemovalTarget,
    rescheduleDate,
    setRescheduleDate,
    rescheduleTime,
    setRescheduleTime,
    rescheduleSlots,
    rescheduleMessage,
    loadingRescheduleSlots,
    manualService,
    setManualService,
    manualBarber,
    setManualBarber,
    manualDate,
    setManualDate,
    manualTime,
    setManualTime,
    manualCustomerName,
    setManualCustomerName,
    manualCustomerPhone,
    setManualCustomerPhone,
    manualNotes,
    setManualNotes,
    manualSlots,
    manualMessage,
    manualLoadingSlots,
    manualSubmitting,
    barberName,
    setBarberName,
    barberRole,
    setBarberRole,
    statusMessage,
    notificationsEnabled,
    soundAlertsEnabled,
    notificationFeedback,
    newAppointmentAlerts,
    showcaseImageInputRefs,
    serviceImageInputRefs,
    newServiceImageInputRef,
    newServiceDescriptionInputRef,
    knownAppointmentIdsRef,
    isCreateServiceModalOpen,
    newServiceDescriptionInvalid,
    newService,
    enableBrowserNotifications,
    toggleSoundAlerts,
    dismissAppointmentAlert,
    setBusinessField,
    updateStat,
    updatePlan,
    addPlan,
    removePlan,
    updateLoyaltyReward,
    addLoyaltyReward,
    removeLoyaltyReward,
    updateLoyaltyTier,
    addLoyaltyTier,
    removeLoyaltyTier,
    updateService,
    removeService,
    openCreateServiceModal,
    closeCreateServiceModal,
    updateNewServiceField,
    openNewServiceImagePicker,
    updateNewServiceImage,
    createService,
    addBarber,
    removeBarber,
    addClosedDate,
    removeClosedDate,
    updateBusinessHoursDay,
    addBarberTimeOff,
    removeBarberTimeOff,
    confirmRemoval,
    removalModalCopy,
    saveChanges,
    openPublicSite,
    openShowcaseImagePicker,
    updateShowcaseImage,
    openServiceImagePicker,
    updateServiceImage,
    openAppointmentWhatsapp,
    openAppointmentCancellationWhatsapp,
    confirmAndOpenWhatsapp,
    cancelAndOpenWhatsapp,
    startReschedule,
    cancelReschedule,
    saveReschedule,
    createManualAppointment,
    displayStats,
    serviceDurationMap,
    currentMonthKey,
    displayedClosedDates,
    selectedDateClosedReason,
    manualDateClosedReason,
    editingAppointment,
    barberAppointments,
    appointmentStatusCounts,
    currentPage,
    showSiteSections,
    showCatalogSections,
    showScheduleSections,
    showOverview,
    showSaveAction,
  };
}
