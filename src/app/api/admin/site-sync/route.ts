import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { syncOperationalData } from "@/lib/admin-sync";
import { ensureBookingSeedData } from "@/lib/booking";
import { resolveErrorResponse } from "@/lib/errors";

const planSchema = z.object({
  name: z.string().trim().min(1),
  summary: z.string(),
  price: z.string(),
});

const serviceSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string(),
  price: z.string(),
  membership: z.string(),
  duration: z.string(),
  image: z.string(),
});

const showcaseImageSchema = z.object({
  src: z.string(),
  alt: z.string(),
  title: z.string(),
  label: z.string(),
  variant: z.enum(["tall", "wide", "square"]),
});

const barberSchema = z.object({
  name: z.string().trim().min(1),
  role: z.string(),
});

const closedDateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data invalida."),
  reason: z.string(),
});

const barberTimeOffSchema = z.object({
  barberName: z.string().trim().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data invalida."),
  reason: z.string(),
});

const loyaltyTierSchema = z.object({
  name: z.string().trim().min(1),
  minPoints: z.number(),
  maxPoints: z.number().nullable(),
  accent: z.string(),
});

const loyaltyRewardSchema = z.object({
  points: z.number(),
  title: z.string(),
  description: z.string(),
});

const siteConfigSchema = z.object({
  businessName: z.string().trim().min(1),
  businessTag: z.string(),
  headline: z.string(),
  heroDescription: z.string(),
  whatsapp: z.string(),
  address: z.string(),
  addressNumber: z.string(),
  city: z.string(),
  neighborhood: z.string(),
  zipCode: z.string(),
  plans: z.array(planSchema),
  services: z.array(serviceSchema),
  showcaseImages: z.array(showcaseImageSchema),
  barbers: z.array(barberSchema),
  stats: z.array(z.object({ value: z.string(), label: z.string() })),
  testimonials: z.array(z.object({ name: z.string(), quote: z.string() })),
  loyaltyTiers: z.array(loyaltyTierSchema),
  loyaltyRewards: z.array(loyaltyRewardSchema),
  availableTimes: z.array(z.string()),
  closedDates: z.array(closedDateSchema),
  barberTimeOff: z.array(barberTimeOffSchema),
  ignoredHolidayDates: z.array(z.string()),
});

export async function POST(request: NextRequest) {
  try {
    await ensureBookingSeedData();

    const parsedBody = z.object({ config: siteConfigSchema }).safeParse(await request.json());

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: "Configuracao do site invalida." },
        { status: 400 },
      );
    }

    await syncOperationalData(parsedBody.data.config);

    return NextResponse.json({
      message: "Dados operacionais sincronizados com a agenda.",
    });
  } catch (error) {
    const { message, status } = resolveErrorResponse(
      error,
      "Nao foi possivel sincronizar os dados operacionais.",
    );
    return NextResponse.json({ error: message }, { status });
  }
}
