import type { Metadata } from "next";
import { SalesLandingPage } from "@/components/projects/dabi-tech/sales-landing-page";

const TITLE = "DaBi Agendaí — agenda online para barbearias";
const DESCRIPTION =
  "O DaBi Agendaí tira sua barbearia do WhatsApp: agenda online 24h, painel de administração e clube de fidelidade automático.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/para-barbearias",
  },
  icons: {
    icon: "/para-barbearias/icon.svg",
    shortcut: "/para-barbearias/icon.svg",
    apple: "/para-barbearias/icon.svg",
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/para-barbearias",
    siteName: "DaBi Agendaí",
    locale: "pt_BR",
    type: "website",
  },
};

export default function Page() {
  return <SalesLandingPage />;
}
