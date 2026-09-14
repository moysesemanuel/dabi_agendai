import { AppointmentStatus, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type DbClient = typeof prisma | Prisma.TransactionClient;

export async function getLoyaltyBalance(
  tenantId: string,
  customerId: string,
  client: DbClient = prisma,
) {
  const [completedAppointments, redeemedAggregate] = await Promise.all([
    client.appointment.count({
      where: { tenantId, customerId, status: AppointmentStatus.COMPLETED },
    }),
    client.loyaltyRedemption.aggregate({
      where: { tenantId, customerId },
      _sum: { points: true },
    }),
  ]);

  const earnedPoints = completedAppointments * 10;
  const redeemedPoints = redeemedAggregate._sum.points ?? 0;
  const availablePoints = earnedPoints - redeemedPoints;
  const nextRewardThreshold = Math.ceil(Math.max(earnedPoints, 1) / 100) * 100;

  return {
    completedAppointments,
    earnedPoints,
    redeemedPoints,
    availablePoints,
    nextRewardIn: nextRewardThreshold - earnedPoints || 100,
  };
}
