import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { psychologistWeeklyAvailability } from "@/lib/db/schema";

export async function dbListWeeklyRulesByPsychologist(psychologistId: string) {
  return db
    .select()
    .from(psychologistWeeklyAvailability)
    .where(eq(psychologistWeeklyAvailability.psychologistId, psychologistId))
    .orderBy(asc(psychologistWeeklyAvailability.weekday), asc(psychologistWeeklyAvailability.sortOrder));
}

export async function dbGetWeeklyRuleById(id: string, psychologistId: string) {
  const [row] = await db
    .select()
    .from(psychologistWeeklyAvailability)
    .where(
      and(
        eq(psychologistWeeklyAvailability.id, id),
        eq(psychologistWeeklyAvailability.psychologistId, psychologistId),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function dbInsertWeeklyRule(values: typeof psychologistWeeklyAvailability.$inferInsert) {
  const [row] = await db.insert(psychologistWeeklyAvailability).values(values).returning();
  return row;
}

export async function dbUpdateWeeklyRule(
  id: string,
  psychologistId: string,
  patch: Partial<typeof psychologistWeeklyAvailability.$inferInsert>,
) {
  const [row] = await db
    .update(psychologistWeeklyAvailability)
    .set({ ...patch, updatedAt: new Date() })
    .where(
      and(
        eq(psychologistWeeklyAvailability.id, id),
        eq(psychologistWeeklyAvailability.psychologistId, psychologistId),
      ),
    )
    .returning();
  return row ?? null;
}

export async function dbDeleteWeeklyRule(id: string, psychologistId: string) {
  const [row] = await db
    .delete(psychologistWeeklyAvailability)
    .where(
      and(
        eq(psychologistWeeklyAvailability.id, id),
        eq(psychologistWeeklyAvailability.psychologistId, psychologistId),
      ),
    )
    .returning();
  return row ?? null;
}
