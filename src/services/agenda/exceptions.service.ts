import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { psychologistAddresses } from "@/lib/db/schema";
import {
  dbInsertAgendaException,
  dbListExceptionsBetween,
} from "@/lib/db/queries/agenda/exceptions.queries";
import type {
  CreateAgendaExceptionInput,
  ListExceptionsByPeriodInput,
} from "@/lib/validation/agenda/exceptions.schema";
import type { PsychologistSessionContext } from "@/server/auth/require-psychologist";

function normalizeTimeForPg(t: string): string {
  return t.length === 5 ? `${t}:00` : t;
}

async function assertAddressBelongsToPsychologist(addressId: string, psychologistId: string) {
  const [row] = await db
    .select({ id: psychologistAddresses.id })
    .from(psychologistAddresses)
    .where(
      and(
        eq(psychologistAddresses.id, addressId),
        eq(psychologistAddresses.psychologistId, psychologistId),
      ),
    )
    .limit(1);
  if (!row) {
    throw new Error("Endereço não encontrado ou não pertence a este psicólogo.");
  }
}

export async function listExceptionsByPeriodService(
  ctx: PsychologistSessionContext,
  input: ListExceptionsByPeriodInput,
) {
  if (input.fromDate > input.toDate) {
    throw new Error("fromDate não pode ser maior que toDate.");
  }
  return dbListExceptionsBetween(ctx.psychologistId, input.fromDate, input.toDate);
}

export async function createAgendaExceptionService(
  ctx: PsychologistSessionContext,
  input: CreateAgendaExceptionInput,
) {
  if (input.addressId) {
    await assertAddressBelongsToPsychologist(input.addressId, ctx.psychologistId);
  }

  return dbInsertAgendaException({
    psychologistId: ctx.psychologistId,
    exceptionDate: input.exceptionDate,
    kind: input.kind,
    startTime:
      input.kind === "INACTIVE_DAY"
        ? null
        : normalizeTimeForPg(input.startTime!),
    endTime:
      input.kind === "INACTIVE_DAY"
        ? null
        : normalizeTimeForPg(input.endTime!),
    addressId: input.addressId ?? null,
    note: input.note ?? null,
    isActive: input.isActive ?? true,
  });
}
