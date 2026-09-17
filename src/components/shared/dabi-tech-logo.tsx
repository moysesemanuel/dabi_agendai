import { Fredoka, Poppins } from "next/font/google";

const fredokaSemiBold = Fredoka({
  subsets: ["latin"],
  weight: "600",
  variable: "--font-fredoka-semibold",
});

const fredokaMedium = Fredoka({
  subsets: ["latin"],
  weight: "500",
  variable: "--font-fredoka-medium",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: "500",
  variable: "--font-poppins-logo",
});

type DaBiTechLogoProps = {
  className?: string;
  variant?: "navy" | "light";
};

export function DaBiTechLogo({ className, variant = "navy" }: DaBiTechLogoProps) {
  const isLight = variant === "light";
  const techFill = isLight ? "#eef3fa" : "#0A0B0D";

  return (
    <svg
      className={[className, fredokaSemiBold.variable, fredokaMedium.variable, poppins.variable]
        .filter(Boolean)
        .join(" ")}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 320 130"
      role="img"
      aria-label="DaBi Tech Digital Solutions"
    >
      <text x="0" y="82" fontSize="66">
        <tspan style={{ fontFamily: "var(--font-fredoka-semibold)" }} fill="#2B5CE6">
          dabi
        </tspan>
        <tspan
          style={{ fontFamily: "var(--font-fredoka-medium)" }}
          fontSize="40"
          dx="4"
          fill={techFill}
        >
          tech
        </tspan>
      </text>
      <text
        x="2"
        y="114"
        style={{ fontFamily: "var(--font-poppins-logo)" }}
        fontSize="15"
        letterSpacing="3"
        fill="#00B6E6"
      >
        DIGITAL SOLUTIONS
      </text>
    </svg>
  );
}
