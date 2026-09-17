import Link from "next/link";
import { DaBiTechLogo } from "@/components/shared/dabi-tech-logo";

type DaBiTechSignatureProps = {
  containerClassName?: string;
  labelClassName?: string;
  labelLinkClassName?: string;
  logoClassName?: string;
  linkClassName?: string;
};

export function DaBiTechSignature({
  containerClassName,
  labelClassName,
  labelLinkClassName,
  logoClassName,
  linkClassName,
}: DaBiTechSignatureProps) {
  const year = new Date().getFullYear();

  return (
    <div className={containerClassName}>
      <p className={labelClassName}>
        Desenvolvido por{" "}
        <Link className={labelLinkClassName} href="/barbearias">
          DaBi Tech - Digital Solutions
        </Link>{" "}
        © {year}
      </p>
      <Link
        className={linkClassName}
        href="/barbearias"
        aria-label="Conhecer o DaBi Agendaí para a sua barbearia"
      >
        <DaBiTechLogo className={logoClassName} />
      </Link>
    </div>
  );
}
