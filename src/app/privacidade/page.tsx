import { PrivacyPage } from "@/components/projects/barbershop/privacy-page";
import { loadSiteConfigForCurrentTenant } from "@/lib/site-config-server";

export default async function Page() {
  const { config } = await loadSiteConfigForCurrentTenant();
  return <PrivacyPage initialConfig={config} />;
}
