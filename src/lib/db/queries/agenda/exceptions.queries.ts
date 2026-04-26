import { and, asc, between, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { psychologistAgendaExceptions } from "@/lib/db/schema";

export async function dbListExceptionsBetween(
  psychologistId: string,
  fromDate: string,
  toDate: string,
) {
  return db
    .select()
    .from(psychologistAgendaExceptions)
    .where(
      and(
        eq(psychologistAgendaExceptions.psychologistId, psychologistId),
        between(psychologistAgendaExceptions.exceptionDate, fromDate, toDate),
      ),
    )
    .orderBy(asc(psychologistAgendaExceptions.exceptionDate));
}

export async function dbInsertAgendaException(values: typeof psychologistAgendaExceptions.$inferInsert) {
  const [row] = await db.insert(psychologistAgendaExceptions).values(values).returning();
  return row;
}
