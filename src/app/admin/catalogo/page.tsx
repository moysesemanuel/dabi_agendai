import { AdminPage } from "@/components/projects/barbershop/admin/admin-page";
import { loadSiteConfigForCurrentTenant } from "@/lib/site-config-server";

export default async function Page() {
  const { config } = await loadSiteConfigForCurrentTenant();
  return <AdminPage section="catalog" initialConfig={config} />;
}
