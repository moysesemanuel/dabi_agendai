import { LoyaltyPage } from "@/components/projects/barbershop/loyalty-page";
import { loadSiteConfigForCurrentTenant } from "@/lib/site-config-server";

export default async function Page() {
  const { config } = await loadSiteConfigForCurrentTenant();
  return <LoyaltyPage initialConfig={config} />;
}
