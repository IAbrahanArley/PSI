import {
    date,
    pgTable,
    text,
    timestamp,
    uuid,
  } from "drizzle-orm/pg-core";
  import { users } from "./users";
  import { genderEnum } from "./enums";
  
  export const patients = pgTable("patients", {
    id: uuid("id").primaryKey().defaultRandom(),
  
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .unique(),
  
    fullName: text("full_name").notNull(),
  
    phone: text("phone"),
    whatsapp: text("whatsapp"),
  
    birthDate: date("birth_date"),
    gender: genderEnum("gender"),
  
    state: text("state"),
    city: text("city"),
  
    avatarUrl: text("avatar_url"),
  
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  });