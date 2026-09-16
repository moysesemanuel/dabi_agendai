import type { Metadata } from "next";
import { SalesLandingPage } from "@/components/projects/dabi-tech/sales-landing-page";

export const metadata: Metadata = {
  title: "DaBi Agendaí — agenda online para barbearias",
  description:
    "O DaBi Agendaí tira sua barbearia do WhatsApp: agenda online 24h, painel de administração e clube de fidelidade automático.",
};

export default function Page() {
  return <SalesLandingPage />;
}
