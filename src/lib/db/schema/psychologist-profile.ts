import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { psychologists } from "./psychologists";

/** Várias especialidades por psicólogo */
export const psychologistSpecialties = pgTable("psychologist_specialties", {
  id: uuid("id").primaryKey().defaultRandom(),
  psychologistId: uuid("psychologist_id")
    .notNull()
    .references(() => psychologists.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

/** Skills / competências */
export const psychologistSkills = pgTable("psychologist_skills", {
  id: uuid("id").primaryKey().defaultRandom(),
  psychologistId: uuid("psychologist_id")
    .notNull()
    .references(() => psychologists.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

/** Prêmios com imagem (URL do bucket), título e link opcional */
export const psychologistAwards = pgTable("psychologist_awards", {
  id: uuid("id").primaryKey().defaultRandom(),
  psychologistId: uuid("psychologist_id")
    .notNull()
    .references(() => psychologists.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  link: text("link"),
  imageUrl: text("image_url"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Currículo estruturado (seções e itens) */
export const psychologistCurriculum = pgTable("psychologist_curriculum", {
  psychologistId: uuid("psychologist_id")
    .primaryKey()
    .references(() => psychologists.id, { onDelete: "cascade" }),
  content: jsonb("content").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Endereços de atendimento (um psicólogo pode ter vários) */
export const psychologistAddresses = pgTable("psychologist_addresses", {
  id: uuid("id").primaryKey().defaultRandom(),
  psychologistId: uuid("psychologist_id")
    .notNull()
    .references(() => psychologists.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  street: text("street"),
  number: text("number"),
  neighborhood: text("neighborhood"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  complement: text("complement"),
  reference: text("reference"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
