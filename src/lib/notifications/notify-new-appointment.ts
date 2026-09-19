import { prisma } from "@/lib/prisma";
import { sendWebPush, isWebPushGoneError } from "@/lib/notifications/web-push";
import { sendTelegramMessage } from "@/lib/notifications/telegram";

function formatAppointmentDateTime(startsAt: Date) {
  const date = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(startsAt);
  const time = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(startsAt);

  return `${date} às ${time}`;
}

export async function notifyNewAppointment(
  tenantId: string,
  appointment: { customerName: string; startsAt: Date },
  barberName: string,
  serviceName: string,
) {
  const [pushSubscriptions, telegramLinks] = await Promise.all([
    prisma.pushSubscription.findMany({ where: { tenantId } }),
    prisma.telegramLink.findMany({ where: { tenantId } }),
  ]);

  if (pushSubscriptions.length === 0 && telegramLinks.length === 0) {
    return;
  }

  const when = formatAppointmentDateTime(appointment.startsAt);
  const summary = `${appointment.customerName} · ${serviceName} com ${barberName} em ${when}`;

  await Promise.allSettled([
    ...pushSubscriptions.map(async (subscription) => {
      try {
        await sendWebPush(subscription, {
          title: "Novo agendamento",
          body: summary,
          url: "/admin/agenda",
        });
      } catch (error) {
        if (isWebPushGoneError(error)) {
          await prisma.pushSubscription.delete({ where: { id: subscription.id } }).catch(() => {});
          return;
        }

        console.error("Falha ao enviar push de novo agendamento", error);
      }
    }),
    ...telegramLinks.map(async (link) => {
      try {
        await sendTelegramMessage(link.chatId, `Novo agendamento\n${summary}`);
      } catch (error) {
        console.error("Falha ao enviar Telegram de novo agendamento", error);
      }
    }),
  ]);
}
