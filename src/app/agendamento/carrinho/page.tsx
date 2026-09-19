import { CartPage } from "@/components/projects/barbershop/cart-page";
import { loadSiteConfigForCurrentTenant } from "@/lib/site-config-server";

export default async function Page() {
  const { config } = await loadSiteConfigForCurrentTenant();
  return <CartPage initialConfig={config} />;
}
