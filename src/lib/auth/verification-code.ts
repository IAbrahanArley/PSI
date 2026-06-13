import { createHash, randomInt } from "node:crypto";

/** Tempo de vida do código de ativação, em minutos. */
export const CODE_TTL_MINUTES = 15;

/** Máximo de tentativas de validação por código antes de exigir reenvio. */
export const MAX_CODE_ATTEMPTS = 5;

/** Intervalo mínimo entre reenvios de código (segundos). */
export const RESEND_COOLDOWN_SECONDS = 60;

/**
 * Pepper opcional do servidor para reforçar o hash do código.
 * Defina EMAIL_CODE_PEPPER no ambiente para produção.
 */
const PEPPER = process.env.EMAIL_CODE_PEPPER ?? "mindzinho-default-pepper";

/** Gera um código numérico de 6 dígitos (com zeros à esquerda). */
export function generateSixDigitCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

/** Hash determinístico (SHA-256) do código + pepper. Nunca guardamos o código puro. */
export function hashCode(code: string): string {
  return createHash("sha256").update(`${code}:${PEPPER}`).digest("hex");
}

/** Comparação em tempo (quase) constante via hash. */
export function codeMatches(plain: string, hash: string): boolean {
  return hashCode(plain) === hash;
}

/** Normaliza e-mail para lookup (minúsculas + trim). */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
