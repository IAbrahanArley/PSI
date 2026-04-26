import { and, asc, desc, eq, gt, lt, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  psychologistAddresses,
  psychologistAppointmentStatusHistory,
  psychologistAppointments,
  patients,
} from "@/lib/db/schema";

export async function dbListAppointmentsOverlappingRange(
  psychologistId: string,
  startsAt: Date,
  endsAt: Date,
  excludeAppointmentId?: string,
) {
  const conditions = [
    eq(psychologistAppointments.psychologistId, psychologistId),
    ne(psychologistAppointments.status, "CANCELLED"),
    lt(psychologistAppointments.startsAt, endsAt),
    gt(psychologistAppointments.endsAt, startsAt),
  ];
  return db
    .select({ id: psychologistAppointments.id })
    .from(psychologistAppointments)
    .where(
      excludeAppointmentId
        ? and(
            ...conditions,
            ne(psychologistAppointments.id, excludeAppointmentId),
          )
        : and(...conditions),
    );
}

export async function dbGetAppointmentForPsychologist(appointmentId: string, psychologistId: string) {
  const [row] = await db
    .select()
    .from(psychologistAppointments)
    .where(
      and(
        eq(psychologistAppointments.id, appointmentId),
        eq(psychologistAppointments.psychologistId, psychologistId),
      ),
    )
    .limit(1);
  return row ?? null;
}

/** Últimas consultas do paciente com este psicólogo (vínculo opcional em anotações). */
export async function dbListRecentAppointmentsForPatient(
  psychologistId: string,
  patientId: string,
  limit: number,
) {
  return db
    .select({
      id: psychologistAppointments.id,
      startsAt: psychologistAppointments.startsAt,
      endsAt: psychologistAppointments.endsAt,
      status: psychologistAppointments.status,
      modality: psychologistAppointments.modality,
    })
    .from(psychologistAppointments)
    .where(
      and(
        eq(psychologistAppointments.psychologistId, psychologistId),
        eq(psychologistAppointments.patientId, patientId),
      ),
    )
    .orderBy(desc(psychologistAppointments.startsAt))
    .limit(limit);
}

export async function dbListAppointmentsInUtcRange(
  psychologistId: string,
  rangeStartUtc: Date,
  rangeEndUtc: Date,
) {
  return db
    .select()
    .from(psychologistAppointments)
    .where(
      and(
        eq(psychologistAppointments.psychologistId, psychologistId),
        lt(psychologistAppointments.startsAt, rangeEndUtc),
        gt(psychologistAppointments.endsAt, rangeStartUtc),
      ),
    )
    .orderBy(asc(psychologistAppointments.startsAt));
}

export async function dbListAppointmentsInUtcRangeWithDetails(
  psychologistId: string,
  rangeStartUtc: Date,
  rangeEndUtc: Date,
) {
  return db
    .select({
      id: psychologistAppointments.id,
      patientId: psychologistAppointments.patientId,
      patientFullName: patients.fullName,
      modality: psychologistAppointments.modality,
      addressId: psychologistAppointments.addressId,
      addressLabel: psychologistAddresses.label,
      addressStreet: psychologistAddresses.street,
      addressCity: psychologistAddresses.city,
      startsAt: psychologistAppointments.startsAt,
      endsAt: psychologistAppointments.endsAt,
      status: psychologistAppointments.status,
      title: psychologistAppointments.title,
    })
    .from(psychologistAppointments)
    .innerJoin(patients, eq(psychologistAppointments.patientId, patients.id))
    .leftJoin(
      psychologistAddresses,
      eq(psychologistAppointments.addressId, psychologistAddresses.id),
    )
    .where(
      and(
        eq(psychologistAppointments.psychologistId, psychologistId),
        lt(psychologistAppointments.startsAt, rangeEndUtc),
        gt(psychologistAppointments.endsAt, rangeStartUtc),
      ),
    )
    .orderBy(asc(psychologistAppointments.startsAt));
}

export async function dbInsertAppointment(values: typeof psychologistAppointments.$inferInsert) {
  const [row] = await db.insert(psychologistAppointments).values(values).returning();
  return row;
}

export async function dbUpdateAppointment(
  appointmentId: string,
  psychologistId: string,
  patch: Partial<typeof psychologistAppointments.$inferInsert>,
) {
  const [row] = await db
    .update(psychologistAppointments)
    .set({ ...patch, updatedAt: new Date() })
    .where(
      and(
        eq(psychologistAppointments.id, appointmentId),
        eq(psychologistAppointments.psychologistId, psychologistId),
      ),
    )
    .returning();
  return row ?? null;
}

export async function dbInsertAppointmentStatusEvent(values: typeof psychologistAppointmentStatusHistory.$inferInsert) {
  const [row] = await db.insert(psychologistAppointmentStatusHistory).values(values).returning();
  return row;
}
