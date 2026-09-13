type DaBiTechLogoProps = {
  className?: string;
};

export function DaBiTechLogo({ className }: DaBiTechLogoProps) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 800 320"
      role="img"
      aria-label="DaBi Tech Digital Solutions"
    >
      <g transform="translate(120,85)">
        <rect x="0" y="0" width="110" height="110" rx="24" ry="24" fill="#0B2A57" />

        <g transform="translate(5,0)">
          <path
            d="M25 10 H53 C73 10 88 22 88 35 C88 48 73 60 53 60 H25 Z"
            fill="#ffffff"
          />
          <path
            d="M25 50 H53 C73 50 88 62 88 75 C88 88 73 100 53 100 H25 Z"
            fill="#00B6E6"
            opacity="0.6"
          />
        </g>
      </g>

      <text
        x="285"
        y="145"
        fontSize="64"
        fontFamily="Inter, system-ui, Arial, sans-serif"
        fontWeight="700"
        fill="#0B2A57"
      >
        DaBi Tech
      </text>
      <text
        x="288"
        y="190"
        fontSize="24"
        fontFamily="Inter, system-ui, Arial, sans-serif"
        fontWeight="500"
        fill="#00B6E6"
        letterSpacing="1px"
      >
        DIGITAL SOLUTIONS
      </text>
    </svg>
  );
}
