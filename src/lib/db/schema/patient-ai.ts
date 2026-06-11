import { index, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { patients } from "./patients";

/**
 * Papel da mensagem na conversa com a IA.
 */
export const aiMessageRoleEnum = pgEnum("ai_message_role", ["user", "assistant"]);

/**
 * Conversas do paciente com o Assistente Mindzinho.
 *
 * LGPD — Art. 11 (dado sensível de saúde):
 *  - Dados usados exclusivamente para gerar respostas de bem-estar
 *  - Nunca compartilhados com terceiros
 *  - O paciente pode excluir qualquer conversa a qualquer momento
 *  - Retenção sugerida: 6 meses após última mensagem (definir na política de privacidade)
 */
export const patientAiConversations = pgTable(
  "patient_ai_conversations",
  {
    id:        uuid("id").primaryKey().defaultRandom(),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),

    /** Gerado a partir das primeiras palavras da primeira mensagem do usuário. */
    title:     text("title").notNull().default("Nova conversa"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    patientIdx:  index("patient_ai_conversations_patient_idx").on(t.patientId),
    updatedIdx:  index("patient_ai_conversations_updated_idx").on(t.patientId, t.updatedAt),
  }),
);

/**
 * Mensagens individuais de cada conversa.
 * Mantém as últimas N mensagens para reconstruir o contexto ao reabrir.
 */
export const patientAiMessages = pgTable(
  "patient_ai_messages",
  {
    id:             uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => patientAiConversations.id, { onDelete: "cascade" }),
    role:    aiMessageRoleEnum("role").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    convIdx:     index("patient_ai_messages_conversation_idx").on(t.conversationId),
    convTimeIdx: index("patient_ai_messages_conv_time_idx").on(t.conversationId, t.createdAt),
  }),
);
