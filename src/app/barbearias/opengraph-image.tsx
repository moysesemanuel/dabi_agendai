import { ImageResponse } from "next/og";

export const alt = "DaBi Agendaí — agenda online para barbearias";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background: "#0b2a57",
          color: "#eef3fa",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              background: "#2B5CE6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "34px",
              fontWeight: 700,
              color: "#ffffff",
            }}
          >
            d
          </div>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
            <span style={{ fontSize: "28px", fontWeight: 700 }}>DaBi Tech</span>
            <span style={{ fontSize: "16px", letterSpacing: "3px", color: "#00b6e6" }}>
              DIGITAL SOLUTIONS
            </span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <span style={{ fontSize: "60px", fontWeight: 700, lineHeight: 1.15, maxWidth: "980px" }}>
            Sua barbearia para de correr atrás de horário no WhatsApp.
          </span>
          <span style={{ fontSize: "28px", color: "#a9b8d1" }}>
            Agenda online 24h, painel de administração e clube de fidelidade automático.
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            fontSize: "24px",
            color: "#00b6e6",
            fontWeight: 600,
          }}
        >
          dabiagendai.vercel.app/barbearias
        </div>
      </div>
    ),
    { ...size },
  );
}
