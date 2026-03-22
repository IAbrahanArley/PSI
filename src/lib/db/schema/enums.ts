import { pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
  "ADMIN",
  "PATIENT",
  "PSYCHOLOGIST",
]);

export const psychologistStatusEnum = pgEnum("psychologist_status", [
  "PENDING",
  "ACTIVE",
  "INACTIVE",
  "REJECTED",
]);

export const genderEnum = pgEnum("gender", [
  "MALE",
  "FEMALE",
  "OTHER",
  "PREFER_NOT_TO_SAY",
]);