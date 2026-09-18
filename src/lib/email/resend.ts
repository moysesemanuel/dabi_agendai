const RESEND_API_URL = "https://api.resend.com/emails";
const FROM_ADDRESS = "DaBi Agendaí <naoresponda@mail.dabitech.com.br>";

export async function sendEmail(input: { to: string; subject: string; html: string }) {
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("RESEND_API_KEY nao configurado.");
  }

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: input.to,
      subject: input.subject,
      html: input.html,
    }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new Error(`Falha ao enviar e-mail (${response.status}): ${await response.text().catch(() => "")}`);
  }
}
