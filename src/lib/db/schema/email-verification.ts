import {
  index,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { emailVerificationPurposeEnum } from "./enums";
import { users } from "./users";

/**
 * Códigos de verificação enviados por e-mail (ex.: ativação de conta).
 *
 * O código de 6 dígitos NUNCA é armazenado em texto puro — guardamos apenas o hash
 * (SHA-256 + pepper). Cada código tem expiração curta e limite de tentativas.
 *
 * Ao emitir um novo código para o mesmo (email, purpose), os anteriores não
 * consumidos são invalidados (marcados como consumidos) pela camada de serviço.
 */
export const emailVerificationCodes = pgTable(
  "email_verification_codes",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    /** Usuário Supabase/PG dono do código. */
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    /** E-mail (normalizado em minúsculas) — facilita lookup/reenvio sem join. */
    email: text("email").notNull(),

    /** Hash do código (SHA-256 hex). Nunca o código em si. */
    codeHash: text("code_hash").notNull(),

    purpose: emailVerificationPurposeEnum("purpose").notNull().default("ACCOUNT_ACTIVATION"),

    /** Tentativas de validação já feitas neste código (proteção contra brute force). */
    attempts: smallint("attempts").notNull().default(0),

    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),

    /** Preenchido quando o código é usado com sucesso OU invalidado por um novo. */
    consumedAt: timestamp("consumed_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    emailPurposeIdx: index("email_verification_codes_email_purpose_idx").on(
      t.email,
      t.purpose,
    ),
    userIdx: index("email_verification_codes_user_idx").on(t.userId),
  }),
);
