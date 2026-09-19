import { CustomerAppointmentsPage } from "@/components/projects/barbershop/customer-appointments-page";
import { loadSiteConfigForCurrentTenant } from "@/lib/site-config-server";

export default async function AgendamentosPage() {
  const { config } = await loadSiteConfigForCurrentTenant();
  return <CustomerAppointmentsPage initialConfig={config} />;
}
