import {
    boolean,
    pgTable,
    text,
    timestamp,
    uuid,
  } from "drizzle-orm/pg-core";
  import { userRoleEnum } from "./enums";
  
  export const users = pgTable("users", {
    id: uuid("id").primaryKey(),
    email: text("email").notNull().unique(),
    fullName: text("full_name"),
    avatarUrl: text("avatar_url"),
  
    role: userRoleEnum("role").notNull().default("PATIENT"),
  
    isActive: boolean("is_active").notNull().default(true),
    isOnboarded: boolean("is_onboarded").notNull().default(false),
  
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  });