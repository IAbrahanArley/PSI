import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { patients } from "@/lib/db/schema";

export function normalizePatientEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function dbFindPatientByNormalizedEmail(normalizedEmail: string) {
  const [row] = await db
    .select()
    .from(patients)
    .where(sql`lower(trim(${patients.email})) = ${normalizedEmail}`)
    .limit(1);
  return row ?? null;
}

export async function dbInsertGuestPatient(values: { fullName: string; email: string; phone: string }) {
  const [row] = await db
    .insert(patients)
    .values({
      fullName: values.fullName.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      userId: null,
    })
    .returning();
  return row;
}

export async function dbUpdatePatientGuestContact(
  patientId: string,
  patch: { fullName: string; phone: string },
) {
  const [row] = await db
    .update(patients)
    .set({
      fullName: patch.fullName.trim(),
      phone: patch.phone.trim(),
      updatedAt: new Date(),
    })
    .where(eq(patients.id, patientId))
    .returning();
  return row ?? null;
}
