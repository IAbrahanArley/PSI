import { and, asc, desc, eq, gt, lt } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getRoleFromUser } from "@/lib/auth/roles";
import { db } from "@/lib/db";
import {
  patients,
  psychologistAddresses,
  psychologistAppointments,
  psychologists,
} from "@/lib/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { bookAuthenticatedPatientAppointmentService } from "@/services/public/public-psychologist-booking.service";

// ─── helpers ─────────────────────────────────────────────────────────────────

async function resolvePatientId(userId: string): Promise<string | null> {
  const [row] = await db
    .select({ id: patients.id })
    .from(patients)
    .where(eq(patients.userId, userId))
    .limit(1);
  return row?.id ?? null;
}

async function resolvePatient(userId: string) {
  const [row] = await db
    .select({ id: patients.id, fullName: patients.fullName })
    .from(patients)
    .where(eq(patients.userId, userId))
    .limit(1);
  return row ?? null;
}

// ─── GET — lista consultas do paciente ───────────────────────────────────────

export async function GET(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const role = getRoleFromUser(user);
    if (role !== "PATIENT" && role !== "ADMIN") {
      return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
    }

    const patientId = await resolvePatientId(user.id);
    if (!patientId) return NextResponse.json({ error: "Paciente não encontrado." }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") ?? "upcoming"; // upcoming | past | all

    const now = new Date();
    const conditions = [eq(psychologistAppointments.patientId, patientId)];
    if (filter === "upcoming") conditions.push(gt(psychologistAppointments.startsAt, now));
    if (filter === "past") conditions.push(lt(psychologistAppointments.startsAt, now));

    const rows = await db
      .select({
        id: psychologistAppointments.id,
        startsAt: psychologistAppointments.startsAt,
        endsAt: psychologistAppointments.endsAt,
        status: psychologistAppointments.status,
        modality: psychologistAppointments.modality,
        title: psychologistAppointments.title,
        notes: psychologistAppointments.notes,
        addressLabel: psychologistAddresses.label,
        addressStreet: psychologistAddresses.street,
        addressCity: psychologistAddresses.city,
        psychologistId: psychologists.id,
        psychologistFullName: psychologists.fullName,
        psychologistProfessionalName: psychologists.professionalName,
        psychologistProfileImageUrl: psychologists.profileImageUrl,
        psychologistSlug: psychologists.slug,
      })
      .from(psychologistAppointments)
      .innerJoin(psychologists, eq(psychologistAppointments.psychologistId, psychologists.id))
      .leftJoin(
        psychologistAddresses,
        eq(psychologistAppointments.addressId, psychologistAddresses.id),
      )
      .where(and(...conditions))
      .orderBy(
        filter === "past"
          ? desc(psychologistAppointments.startsAt)
          : asc(psychologistAppointments.startsAt),
      )
      .limit(100);

    const appointments = rows.map((r) => ({
      id: r.id,
      startsAt: r.startsAt.toISOString(),
      endsAt: r.endsAt.toISOString(),
      status: r.status,
      modality: r.modality,
      title: r.title,
      notes: r.notes,
      address: r.addressLabel
        ? {
            label: r.addressLabel,
            street: r.addressStreet ?? null,
            city: r.addressCity ?? null,
          }
        : null,
      psychologist: {
        id: r.psychologistId,
        displayName: r.psychologistProfessionalName || r.psychologistFullName,
        profileImageUrl: r.psychologistProfileImageUrl ?? null,
        slug: r.psychologistSlug,
      },
    }));

    return NextResponse.json({ appointments });
  } catch (err) {
    console.error("[patient/appointments GET]", err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

// ─── POST — reservar consulta ─────────────────────────────────────────────────

const bookBodySchema = z
  .object({
    slug: z.string().min(1),
    startsAtIso: z.string().min(1),
    endsAtIso: z.string().min(1),
    modality: z.enum(["ONLINE", "PRESENTIAL"]),
    addressId: z.string().uuid().nullable().optional(),
    message: z.string().max(2000).nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.modality === "PRESENTIAL" && !data.addressId) {
      ctx.addIssue({
        code: "custom",
        message: "Endereço obrigatório para atendimento presencial.",
        path: ["addressId"],
      });
    }
    if (data.modality === "ONLINE" && data.addressId) {
      ctx.addIssue({
        code: "custom",
        message: "Consulta online não deve informar endereço.",
        path: ["addressId"],
      });
    }
  });

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const role = getRoleFromUser(user);
    if (role !== "PATIENT" && role !== "ADMIN") {
      return NextResponse.json({ error: "Apenas pacientes podem agendar por esta rota." }, { status: 403 });
    }

    const pat = await resolvePatient(user.id);
    if (!pat) return NextResponse.json({ error: "Paciente não encontrado." }, { status: 404 });

    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
    }

    const parsed = bookBodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos.", details: parsed.error.flatten() },
        { status: 422 },
      );
    }

    const b = parsed.data;
    const result = await bookAuthenticatedPatientAppointmentService(
      b.slug,
      pat.id,
      {
        startsAtIso: b.startsAtIso,
        endsAtIso: b.endsAtIso,
        modality: b.modality,
        addressId: b.addressId ?? null,
        message: b.message ?? null,
        patientFullName: pat.fullName,
      },
      user.id,
    );

    if (result === "not_found") {
      return NextResponse.json({ error: "Profissional não encontrado." }, { status: 404 });
    }
    if (result === "invalid_slot") {
      return NextResponse.json({ error: "Horário inválido ou indisponível." }, { status: 400 });
    }
    if (result === "slot_taken") {
      return NextResponse.json({ error: "Este horário acabou de ser reservado. Escolha outro." }, { status: 409 });
    }
    if (result === "conflict") {
      return NextResponse.json({ error: "Não foi possível concluir o agendamento." }, { status: 409 });
    }

    return NextResponse.json({ ok: true, appointmentId: result.appointmentId });
  } catch (err) {
    console.error("[patient/appointments POST]", err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
