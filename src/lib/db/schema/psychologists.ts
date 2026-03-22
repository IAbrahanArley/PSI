import {
    boolean,
    integer,
    numeric,
    pgTable,
    text,
    timestamp,
    uniqueIndex,
    uuid,
  } from "drizzle-orm/pg-core";
  import { users } from "./users";
  import { genderEnum, psychologistStatusEnum } from "./enums";
  
  export const psychologists = pgTable(
    "psychologists",
    {
      id: uuid("id").primaryKey().defaultRandom(),
  
      userId: uuid("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" })
        .unique(),
  
      slug: text("slug").notNull().unique(),
  
      fullName: text("full_name").notNull(),
      professionalName: text("professional_name"),

      /** Especialidade principal (cadastro / busca) */
      specialty: text("specialty").notNull(),
  
      /** CRP pode ser preenchido depois da verificação; null no primeiro cadastro */
      crp: text("crp").unique(),
  
      bio: text("bio"),
      approach: text("approach"),
  
      gender: genderEnum("gender"),
  
      phone: text("phone"),
      whatsapp: text("whatsapp"),
  
      profileImageUrl: text("profile_image_url"),
      coverImageUrl: text("cover_image_url"),
  
      offersOnline: boolean("offers_online").notNull().default(false),
      offersPresential: boolean("offers_presential").notNull().default(false),
  
      sessionPrice: numeric("session_price", {
        precision: 10,
        scale: 2,
      }),
  
      sessionDurationMinutes: integer("session_duration_minutes")
        .notNull()
        .default(50),
  
      languages: text("languages").array(),
  
      state: text("state"),
      city: text("city"),
  
      status: psychologistStatusEnum("status").notNull().default("PENDING"),
  
      publishedAt: timestamp("published_at", { withTimezone: true }),
  
      createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
  
      updatedAt: timestamp("updated_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (table) => ({
      slugIdx: uniqueIndex("psychologists_slug_idx").on(table.slug),
      crpIdx: uniqueIndex("psychologists_crp_idx").on(table.crp),
    })
  );