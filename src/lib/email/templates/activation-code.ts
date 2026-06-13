import { EMAIL_BRAND, wrapEmail } from "../layout";

type ActivationCodeInput = {
  name?: string | null;
  code: string;
  expiresMinutes: number;
  baseUrl: string;
};

/** E-mail de ativacao de conta com codigo de 6 digitos. */
export function activationCodeEmail({ name, code, expiresMinutes, baseUrl }: ActivationCodeInput): {
  subject: string;
  html: string;
  text: string;
} {
  const greeting = name?.trim() ? `Olá, ${name.trim().split(" ")[0]}!` : "Olá!";

  const bodyHtml = `
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6">${greeting}</p>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.6">
      Falta pouco para ativar sua conta. Use o código abaixo para confirmar seu e-mail:
    </p>

    <div style="text-align:center;margin:0 0 20px">
      <div style="display:inline-block;background:${EMAIL_BRAND.bg};border:1px dashed ${EMAIL_BRAND.primary};border-radius:12px;padding:16px 28px">
        <span style="font-size:34px;font-weight:800;letter-spacing:10px;color:${EMAIL_BRAND.primaryDark};font-family:'Courier New',monospace">${code}</span>
      </div>
    </div>

    <p style="margin:0 0 8px;font-size:13px;color:${EMAIL_BRAND.muted};line-height:1.6">
      O código expira em <strong>${expiresMinutes} minutos</strong>. Não compartilhe com ninguém.
    </p>
    <p style="margin:0;font-size:13px;color:${EMAIL_BRAND.muted};line-height:1.6">
      Se você não criou esta conta, pode ignorar este e-mail com segurança.
    </p>
  `;

  const html = wrapEmail({ heading: "Ative sua conta", bodyHtml, baseUrl });

  const text = [
    greeting,
    "",
    "Use o código abaixo para ativar sua conta:",
    "",
    `    ${code}`,
    "",
    `O código expira em ${expiresMinutes} minutos. Não compartilhe com ninguém.`,
    "Se você não criou esta conta, pode ignorar este e-mail.",
    "",
    `Mindzinho • ${baseUrl}`,
  ].join("\n");

  return {
    subject: `${code} é o seu código de ativação • Mindzinho`,
    html,
    text,
  };
}
