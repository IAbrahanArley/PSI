type SendResendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export async function sendResendEmail({ to, subject, html, text }: SendResendEmailInput) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();

  if (!apiKey || !from) {
    throw new Error("RESEND_API_KEY/RESEND_FROM_EMAIL nao configurados.");
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "amayre-startupkit",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
      text,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Falha ao enviar e-mail via Resend (${res.status}). ${body}`);
  }
}
