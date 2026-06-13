/**
 * Shell HTML reutilizavel para e-mails transacionais da plataforma.
 * Estilos inline (exigencia dos clientes de e-mail). Visual da marca Mindzinho.
 */

const BRAND = {
  primary: "#6a3093",
  primaryDark: "#4c1d74",
  text: "#1f2937",
  muted: "#6b7280",
  bg: "#f4f1f8",
  card: "#ffffff",
};

type WrapInput = {
  /** Titulo grande no topo do corpo (opcional). */
  heading?: string;
  /** HTML do corpo (ja escapado/seguro). */
  bodyHtml: string;
  /** URL base da aplicacao (rodape). */
  baseUrl: string;
};

export function wrapEmail({ heading, bodyHtml, baseUrl }: WrapInput): string {
  return `
  <div style="margin:0;padding:0;background:${BRAND.bg};font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${BRAND.text}">
    <div style="max-width:520px;margin:0 auto;padding:24px 16px">
      <!-- Cabecalho -->
      <div style="text-align:center;padding:8px 0 20px">
        <div style="display:inline-block;background:${BRAND.primary};color:#fff;font-weight:700;font-size:18px;letter-spacing:0.3px;padding:10px 18px;border-radius:30px">
          Mindzinho
        </div>
      </div>

      <!-- Cartao -->
      <div style="background:${BRAND.card};border-radius:16px;padding:32px 28px;box-shadow:0 6px 24px rgba(76,29,116,0.08)">
        ${heading ? `<h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:${BRAND.primaryDark}">${heading}</h1>` : ""}
        ${bodyHtml}
      </div>

      <!-- Rodape -->
      <div style="text-align:center;padding:20px 8px;color:${BRAND.muted};font-size:12px;line-height:1.6">
        <p style="margin:0 0 4px">Voce recebeu este e-mail porque ha uma conta associada a este endereco na plataforma Mindzinho.</p>
        <p style="margin:0"><a href="${baseUrl}" style="color:${BRAND.primary};text-decoration:none">${baseUrl.replace(/^https?:\/\//, "")}</a></p>
      </div>
    </div>
  </div>`;
}

export const EMAIL_BRAND = BRAND;
