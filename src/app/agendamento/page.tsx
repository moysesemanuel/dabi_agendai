import { BookingPage } from "@/components/projects/barbershop/booking-page";
import { loadSiteConfigForCurrentTenant } from "@/lib/site-config-server";

export default async function Page() {
  const { config } = await loadSiteConfigForCurrentTenant();
  return <BookingPage initialConfig={config} />;
}
