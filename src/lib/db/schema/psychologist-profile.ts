import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { catalogSpecialties } from "./catalog-specialties";
import { psychologistSocialNetworkEnum } from "./enums";
import { psychologists } from "./psychologists";

/** Várias especialidades por psicólogo */
export const psychologistSpecialties = pgTable("psychologist_specialties", {
  id: uuid("id").primaryKey().defaultRandom(),
  psychologistId: uuid("psychologist_id")
    .notNull()
    .references(() => psychologists.id, { onDelete: "cascade" }),
  catalogSpecialtyId: uuid("catalog_specialty_id").references(() => catalogSpecialties.id, {
    onDelete: "set null",
  }),
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

export const psychologistSocialLinks = pgTable(
  "psychologist_social_links",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    psychologistId: uuid("psychologist_id")
      .notNull()
      .references(() => psychologists.id, { onDelete: "cascade" }),
    network: psychologistSocialNetworkEnum("network").notNull(),
    url: text("url").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uniquePsychNetwork: uniqueIndex("psychologist_social_links_psych_network_uidx").on(
      t.psychologistId,
      t.network,
    ),
  }),
);
