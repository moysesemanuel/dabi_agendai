import type { Metadata } from "next";
import { TermsPage } from "@/components/projects/dabi-tech/terms-page";

export const metadata: Metadata = {
  title: "Termos de Uso — DaBi Agendaí",
  description: "Termos de uso do DaBi Agendaí para barbearias contratantes.",
  alternates: {
    canonical: "/termos-de-uso",
  },
};

export default function Page() {
  return <TermsPage />;
}
