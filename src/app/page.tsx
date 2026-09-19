import { HomePage } from "@/components/projects/barbershop/home-page";
import { loadSiteConfigForCurrentTenant } from "@/lib/site-config-server";

export default async function Page() {
  const { config } = await loadSiteConfigForCurrentTenant();
  return <HomePage initialConfig={config} />;
}
