import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { emailVerificationCodes } from "@/lib/db/schema";
import { supabaseAdmin } from "@/lib/db/supabase/admin";
import { sendResendEmail } from "@/lib/email/resend";
import { activationCodeEmail } from "@/lib/email/templates/activation-code";
import {
  CODE_TTL_MINUTES,
  MAX_CODE_ATTEMPTS,
  RESEND_COOLDOWN_SECONDS,
  codeMatches,
  generateSixDigitCode,
  hashCode,
  normalizeEmail,
} from "./verification-code";

const PURPOSE = "ACCOUNT_ACTIVATION" as const;

export type IssueResult =
  | { ok: true }
  | { ok: false; reason: "cooldown"; retryAfterSeconds: number }
  | { ok: false; reason: "email_failed" };

export type VerifyResult =
  | { ok: true; userId: string }
  | { ok: false; reason: "no_code" | "expired" | "too_many_attempts" | "invalid" };

/**
 * Emite (ou reemite) um código de ativação:
 *  1. invalida códigos anteriores não consumidos do mesmo e-mail;
 *  2. grava o novo código (apenas o hash);
 *  3. envia o e-mail via Resend.
 *
 * `enforceCooldown` evita reenvios em rajada (usar no endpoint de reenvio).
 */
export async function issueActivationCode(params: {
  userId: string;
  email: string;
  name?: string | null;
  baseUrl: string;
  enforceCooldown?: boolean;
}): Promise<IssueResult> {
  const email = normalizeEmail(params.email);

  if (params.enforceCooldown) {
    const [last] = await db
      .select({ createdAt: emailVerificationCodes.createdAt })
      .from(emailVerificationCodes)
      .where(
        and(
          eq(emailVerificationCodes.email, email),
          eq(emailVerificationCodes.purpose, PURPOSE),
          isNull(emailVerificationCodes.consumedAt),
        ),
      )
      .orderBy(desc(emailVerificationCodes.createdAt))
      .limit(1);

    if (last) {
      const elapsed = (Date.now() - last.createdAt.getTime()) / 1000;
      if (elapsed < RESEND_COOLDOWN_SECONDS) {
        return {
          ok: false,
          reason: "cooldown",
          retryAfterSeconds: Math.ceil(RESEND_COOLDOWN_SECONDS - elapsed),
        };
      }
    }
  }

  // Invalida códigos pendentes anteriores
  await db
    .update(emailVerificationCodes)
    .set({ consumedAt: new Date() })
    .where(
      and(
        eq(emailVerificationCodes.email, email),
        eq(emailVerificationCodes.purpose, PURPOSE),
        isNull(emailVerificationCodes.consumedAt),
      ),
    );

  const code = generateSixDigitCode();
  const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000);

  await db.insert(emailVerificationCodes).values({
    userId: params.userId,
    email,
    codeHash: hashCode(code),
    purpose: PURPOSE,
    expiresAt,
  });

  try {
    const { subject, html, text } = activationCodeEmail({
      name: params.name,
      code,
      expiresMinutes: CODE_TTL_MINUTES,
      baseUrl: params.baseUrl,
    });
    await sendResendEmail({ to: email, subject, html, text });
  } catch {
    return { ok: false, reason: "email_failed" };
  }

  return { ok: true };
}

/**
 * Valida um código informado pelo usuário. Em caso de sucesso, confirma o
 * e-mail no Supabase Auth (libera o login) e marca o código como consumido.
 */
export async function verifyActivationCode(params: {
  email: string;
  code: string;
}): Promise<VerifyResult> {
  const email = normalizeEmail(params.email);
  const code = params.code.trim();

  const [row] = await db
    .select()
    .from(emailVerificationCodes)
    .where(
      and(
        eq(emailVerificationCodes.email, email),
        eq(emailVerificationCodes.purpose, PURPOSE),
        isNull(emailVerificationCodes.consumedAt),
      ),
    )
    .orderBy(desc(emailVerificationCodes.createdAt))
    .limit(1);

  if (!row) return { ok: false, reason: "no_code" };

  if (row.attempts >= MAX_CODE_ATTEMPTS) {
    return { ok: false, reason: "too_many_attempts" };
  }

  if (row.expiresAt.getTime() < Date.now()) {
    return { ok: false, reason: "expired" };
  }

  if (!codeMatches(code, row.codeHash)) {
    await db
      .update(emailVerificationCodes)
      .set({ attempts: row.attempts + 1 })
      .where(eq(emailVerificationCodes.id, row.id));
    return { ok: false, reason: "invalid" };
  }

  // Sucesso: confirma o e-mail no Supabase e consome o código.
  const { error } = await supabaseAdmin.auth.admin.updateUserById(row.userId, {
    email_confirm: true,
  });
  if (error) {
    // Não consome o código se a confirmação falhou — permite retry.
    return { ok: false, reason: "invalid" };
  }

  await db
    .update(emailVerificationCodes)
    .set({ consumedAt: new Date() })
    .where(eq(emailVerificationCodes.id, row.id));

  return { ok: true, userId: row.userId };
}
