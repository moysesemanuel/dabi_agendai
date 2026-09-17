"use client";

import { track } from "@vercel/analytics";
import type { ReactNode } from "react";

type WhatsappCtaLinkProps = {
  href: string;
  className?: string;
  location: string;
  children: ReactNode;
};

export function WhatsappCtaLink({ href, className, location, children }: WhatsappCtaLinkProps) {
  return (
    <a
      className={className}
      href={href}
      target="_blank"
      rel="noreferrer"
      onClick={() => track("whatsapp_click", { location })}
    >
      {children}
    </a>
  );
}
