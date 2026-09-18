import type { AdminAppointment, RemovalTarget } from "./admin-types";

export function formatDateToPtBr(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00`));
}

export function getDateParts(date: string) {
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

export function formatMonthYear(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function getTodayDateKey() {
  const now = new Date();
  return `${now.getFullYear()}-${`${now.getMonth() + 1}`.padStart(2, "0")}-${`${now.getDate()}`.padStart(2, "0")}`;
}

export function formatAppointmentTime(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(date));
}

export function parseDurationToMinutes(duration: string) {
  const minutes = Number(duration.replace(/[^\d]/g, ""));
  return Number.isFinite(minutes) ? minutes : 30;
}

export function formatServicePrice(value: string) {
  const normalized = value.replace(/[^\d,.\s]/g, "").trim();

  if (!normalized) {
    return "";
  }

  const compact = normalized.replace(/\s/g, "");
  return compact.toLowerCase().startsWith("r$")
    ? compact.replace(/^r\$/i, "R$ ")
    : `R$ ${compact}`;
}

export function formatServiceDuration(value: string) {
  const minutes = value.replace(/[^\d]/g, "");

  if (!minutes) {
    return "";
  }

  return `${minutes} min`;
}

export function buildAppointmentWhatsappMessage(appointment: AdminAppointment, businessName: string) {
  return [
    `Olá, ${appointment.customerName}.`,
    "",
    `Seu horário na ${businessName} está confirmado:`,
    `${appointment.serviceName} com ${appointment.barberName}`,
    `${formatDateToPtBr(appointment.startsAt.slice(0, 10))} às ${formatAppointmentTime(appointment.startsAt)}`,
    "",
    "Se precisar remarcar, responda esta mensagem.",
  ].join("\n");
}

export function buildAppointmentCancellationWhatsappMessage(
  appointment: AdminAppointment,
  businessName: string,
) {
  return [
    `Olá, ${appointment.customerName}.`,
    "",
    `Precisamos informar que seu horário na ${businessName} foi cancelado.`,
    `${appointment.serviceName} com ${appointment.barberName}`,
    `${formatDateToPtBr(appointment.startsAt.slice(0, 10))} às ${formatAppointmentTime(appointment.startsAt)}`,
    "",
    "Se quiser, podemos remarcar um novo horário para você.",
  ].join("\n");
}

export function getRemovalModalCopy(target: RemovalTarget) {
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

export function getAppointmentStatusLabel(status: string) {
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

export function getMonthDays(currentMonth: Date) {
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
