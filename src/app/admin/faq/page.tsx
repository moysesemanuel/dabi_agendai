import { notFound } from "next/navigation";
import { AdminFaqPage } from "@/components/projects/barbershop/admin/admin-faq-page";
import { getCurrentTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export default async function Page() {
  const tenant = await getCurrentTenant();

  if (!tenant) {
    notFound();
  }

  return <AdminFaqPage businessName={tenant.name} />;
}
