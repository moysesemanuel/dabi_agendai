export type AdminAppointment = {
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

export type AvailabilityPayload = {
  slots?: string[];
  closedReason?: string | null;
  error?: string;
};

export type HolidayLookupPayload = {
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

export type AddressLookupPayload = {
  zipCode?: string;
  street?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  error?: string;
};

export type CurrentMonthHoliday = {
  date: string;
  name: string;
  type?: string;
};

export type DisplayClosedDate = {
  date: string;
  reason: string;
  source: "manual" | "holiday";
};

export type ServiceDraft = {
  name: string;
  price: string;
  duration: string;
  membership: string;
  description: string;
  image: string;
};

export type RemovalTarget =
  | { type: "service"; index: number; label: string }
  | { type: "barber"; name: string; label: string }
  | { type: "closedDate"; date: string; label: string }
  | { type: "barberTimeOff"; barberName: string; date: string; label: string };

export type AdminSectionView = "overview" | "site" | "catalog" | "schedule";

export const ADMIN_NOTIFICATIONS_STORAGE_KEY = "dabi-agendai-admin-browser-notifications";
export const ADMIN_SOUND_ALERTS_STORAGE_KEY = "dabi-agendai-admin-sound-alerts";
