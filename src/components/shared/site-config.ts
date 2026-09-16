import {
  availableTimes,
  barbers,
  plans,
  services,
  showcaseImages,
  stats,
  testimonials,
} from "@/components/projects/barbershop/data";

export const SITE_CONFIG_UPDATED_EVENT = "dabi-agendai-site-config-updated";
export const LEGACY_BUSINESS_TAG_PREFIX = "Barbearia premium em ";

export type PlanItem = {
  name: string;
  summary: string;
  price: string;
};

export type ServiceItem = {
  name: string;
  description: string;
  price: string;
  membership: string;
  duration: string;
  image: string;
};

export type ShowcaseImageItem = {
  src: string;
  alt: string;
  title: string;
  label: string;
  variant: "tall" | "wide" | "square";
};

export type BarberItem = {
  name: string;
  role: string;
};

export type BusinessHoursItem = {
  weekday: number;
  closed: boolean;
  start: string;
  end: string;
};

export type ClosedDateItem = {
  date: string;
  reason: string;
};

export type BarberTimeOffItem = {
  barberName: string;
  date: string;
  reason: string;
};

export type LoyaltyRewardItem = {
  points: number;
  title: string;
  description: string;
};

export type LoyaltyTierItem = {
  name: string;
  minPoints: number;
  maxPoints: number | null;
  accent: string;
};

export type SiteConfig = {
  businessName: string;
  businessTag: string;
  headline: string;
  heroDescription: string;
  whatsapp: string;
  address: string;
  addressNumber: string;
  city: string;
  neighborhood: string;
  zipCode: string;
  plans: PlanItem[];
  services: ServiceItem[];
  showcaseImages: ShowcaseImageItem[];
  barbers: BarberItem[];
  stats: { value: string; label: string }[];
  testimonials: { name: string; quote: string }[];
  loyaltyTiers: LoyaltyTierItem[];
  loyaltyRewards: LoyaltyRewardItem[];
  availableTimes: string[];
  businessHours: BusinessHoursItem[];
  closedDates: ClosedDateItem[];
  barberTimeOff: BarberTimeOffItem[];
  ignoredHolidayDates: string[];
};

export const weekdayLabels = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

export const defaultSiteConfig: SiteConfig = {
  businessName: "Prime Cut Studio",
  businessTag: "Barbearia premium",
  headline: "Hora marcada, cadeira livre e corte no ponto.",
  heroDescription:
    "Profissionais especializados em degradê, navalha e barba clássica — sem pressa, sem imprevisto.",
  whatsapp: "(11) 99876-4521",
  address: "Rua Haddock Lobo",
  addressNumber: "412",
  city: "São Paulo",
  neighborhood: "Cerqueira César",
  zipCode: "01414-000",
  plans: plans.map((plan) => ({ ...plan })),
  services: services.map((service) => ({ ...service })),
  showcaseImages: showcaseImages.map((image) => ({ ...image })),
  barbers: barbers.map((name) => ({
    name,
    role:
      name === "Rafael Costa"
        ? "Especialista em degradê e corte social"
        : name === "Mateus Lima"
          ? "Barba e acabamento clássico"
          : "Estilos contemporâneos e atendimento premium",
  })),
  stats: stats.map((item) => ({ ...item })),
  testimonials: testimonials.map((item) => ({ ...item })),
  loyaltyTiers: [
    { name: "Bronze", minPoints: 0, maxPoints: 99, accent: "#b3835a" },
    { name: "Silver", minPoints: 100, maxPoints: 249, accent: "#b8c0cc" },
    { name: "Gold", minPoints: 250, maxPoints: 499, accent: "#d6aa4d" },
    { name: "Black", minPoints: 500, maxPoints: null, accent: "#1f1712" },
  ],
  loyaltyRewards: [
    {
      points: 50,
      title: "Finalização premium",
      description: "Troque seus pontos por uma finalização especial no atendimento.",
    },
    {
      points: 100,
      title: "Upgrade de barba",
      description: "Inclua toalha quente e acabamento reforçado sem custo extra.",
    },
    {
      points: 180,
      title: "Desconto em pacote",
      description: "Use os pontos para reduzir o valor de um pacote ou assinatura.",
    },
    {
      points: 300,
      title: "Serviço bônus",
      description: "Resgate um benefício maior para a próxima visita no studio.",
    },
  ],
  availableTimes: [...availableTimes],
  businessHours: [
    { weekday: 0, closed: true, start: "09:00", end: "18:00" },
    { weekday: 1, closed: false, start: "09:00", end: "20:00" },
    { weekday: 2, closed: false, start: "09:00", end: "20:00" },
    { weekday: 3, closed: false, start: "09:00", end: "20:00" },
    { weekday: 4, closed: false, start: "09:00", end: "20:00" },
    { weekday: 5, closed: false, start: "09:00", end: "20:00" },
    { weekday: 6, closed: false, start: "08:00", end: "18:00" },
  ],
  closedDates: [
    { date: "2026-03-30", reason: "Treinamento interno" },
    { date: "2026-04-21", reason: "Feriado" },
  ],
  barberTimeOff: [],
  ignoredHolidayDates: [],
};

const legacyShowcaseImageMap: Record<string, string> = {
  "/hero-ambiente.svg": "/img/espaco-masculino-interior-de-barbearia-moderna-gerado-por-ia_866663-5580.avif",
  "/hero-acabamento.svg": "/img/VISS-Babearia-Visagista.jpg",
  "/hero-experiencia.svg": "/img/Design_sem_nome_-_2022-08-03T224458.952__1_.webp",
};

const legacyServiceImageMap: Record<string, string> = {
  "/service-cabelo.svg": "/img/um-cliente-a-cortar-o-cabelo-num-barbeiro_1303-20861.avif",
  "/service-barba.svg": "/img/homem-bonito-na-barbearia-barbeando-a-barba_1303-26258.avif",
  "/service-combo.svg": "/img/a-barbearia-vip-inovou-ao-implementar-visagismo-e-ia-em-sua-franquia.webp",
  "/service-hidratacao.svg": "/img/hidratacao-no-cabelo-2.jpg",
};

function normalizeShowcaseImages(images: ShowcaseImageItem[]) {
  return images.map((image) => ({
    ...image,
    src: legacyShowcaseImageMap[image.src] ?? image.src,
  }));
}

function normalizeServiceImages(items: ServiceItem[]) {
  return items.map((item) => ({
    ...item,
    image: legacyServiceImageMap[item.image] ?? item.image,
  }));
}

export function mergeSiteConfig(parsed: Partial<SiteConfig> | null | undefined): SiteConfig {
  if (!parsed) {
    return defaultSiteConfig;
  }

  const mergedConfig = {
    ...defaultSiteConfig,
    ...parsed,
    plans: parsed.plans ?? defaultSiteConfig.plans,
    services: normalizeServiceImages(parsed.services ?? defaultSiteConfig.services),
    showcaseImages: normalizeShowcaseImages(parsed.showcaseImages ?? defaultSiteConfig.showcaseImages),
    barbers: parsed.barbers ?? defaultSiteConfig.barbers,
    stats: parsed.stats ?? defaultSiteConfig.stats,
    testimonials: parsed.testimonials ?? defaultSiteConfig.testimonials,
    loyaltyTiers: parsed.loyaltyTiers ?? defaultSiteConfig.loyaltyTiers,
    loyaltyRewards: parsed.loyaltyRewards ?? defaultSiteConfig.loyaltyRewards,
    availableTimes: parsed.availableTimes ?? defaultSiteConfig.availableTimes,
    businessHours: parsed.businessHours ?? defaultSiteConfig.businessHours,
    closedDates: parsed.closedDates ?? defaultSiteConfig.closedDates,
    barberTimeOff: parsed.barberTimeOff ?? defaultSiteConfig.barberTimeOff,
    ignoredHolidayDates: parsed.ignoredHolidayDates ?? defaultSiteConfig.ignoredHolidayDates,
  };

  if (
    mergedConfig.businessTag.startsWith(LEGACY_BUSINESS_TAG_PREFIX) &&
    mergedConfig.city
  ) {
    mergedConfig.businessTag = `${LEGACY_BUSINESS_TAG_PREFIX}${mergedConfig.city}`;
  }

  return mergedConfig;
}

export async function fetchSiteConfig(): Promise<SiteConfig> {
  try {
    const response = await fetch("/api/site-config", { cache: "no-store" });
    const payload = (await response.json()) as {
      config?: Partial<SiteConfig>;
      brandColor?: string | null;
    };

    if (payload.brandColor && typeof document !== "undefined") {
      document.documentElement.style.setProperty("--tenant-accent", payload.brandColor);
    }

    return mergeSiteConfig(payload.config);
  } catch {
    return defaultSiteConfig;
  }
}

export function getDisplayStats(config: SiteConfig, averageRatingValue?: string) {
  return config.stats.map((item, index) =>
    index === 1
      ? { ...item, value: averageRatingValue ?? item.value }
      : index === 3
        ? { ...item, value: `+${config.barbers.length}` }
        : item,
  );
}

export function getBusinessAddress(config: SiteConfig) {
  const mainParts = [config.address, config.addressNumber].filter(Boolean).join(", ");
  const secondaryParts = [config.neighborhood].filter(Boolean).join(" - ");
  return [mainParts, secondaryParts].filter(Boolean).join(" - ");
}

export function getBusinessLocationLabel(config: SiteConfig) {
  const locationParts = [config.city, config.neighborhood].filter(Boolean);
  return locationParts.length > 0 ? locationParts.join(" - ") : "Localização da barbearia";
}

