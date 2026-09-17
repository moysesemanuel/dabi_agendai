import type { Metadata } from "next";
import "./globals.css";
import { BackToTopButton } from "@/components/shared/back-to-top-button";
import { ToastProvider } from "@/components/shared/toast-provider";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://dabiagendai.vercel.app"),
  title: "Prime Cut Studio",
  description:
    "Barbearia premium com atendimento por agendamento, serviços de corte e barba e presença digital profissional.",
  icons: {
    icon: "/logo-icon.svg",
    shortcut: "/logo-icon.svg",
    apple: "/logo-icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <ToastProvider>
          {children}
          <BackToTopButton />
        </ToastProvider>
      </body>
    </html>
  );
}
