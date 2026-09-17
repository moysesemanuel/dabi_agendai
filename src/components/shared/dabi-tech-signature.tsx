import Link from "next/link";
import { DaBiTechLogo } from "@/components/shared/dabi-tech-logo";

type DaBiTechSignatureProps = {
  containerClassName?: string;
  labelClassName?: string;
  logoClassName?: string;
  linkClassName?: string;
};

export function DaBiTechSignature({
  containerClassName,
  labelClassName,
  logoClassName,
  linkClassName,
}: DaBiTechSignatureProps) {
  const year = new Date().getFullYear();

  return (
    <div className={containerClassName}>
      <Link
        className={linkClassName}
        href="/barbearias"
        aria-label="Conhecer o DaBi Agendaí para a sua barbearia"
      >
        <p className={labelClassName}>
          Desenvolvido por DaBi Tech - Digital Solutions © {year}
        </p>
        <DaBiTechLogo className={logoClassName} />
      </Link>
    </div>
  );
}
