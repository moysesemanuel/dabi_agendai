import { AdminSupportPage } from "@/components/projects/barbershop/admin/admin-support-page";
import { loadSiteConfigForCurrentTenant } from "@/lib/site-config-server";

export default async function Page() {
  const { config } = await loadSiteConfigForCurrentTenant();
  return <AdminSupportPage initialConfig={config} />;
}
