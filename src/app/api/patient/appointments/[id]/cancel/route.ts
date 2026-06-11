import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getRoleFromUser } from "@/lib/auth/roles";
import { db } from "@/lib/db";
import { patients, psychologistAppointments } from "@/lib/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  dbInsertAppointmentStatusEvent,
} from "@/lib/db/queries/agenda/appointments.queries";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(_req: Request, { params }: Params) {
  try {
    const { id } = await params;

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const role = getRoleFromUser(user);
    if (role !== "PATIENT" && role !== "ADMIN") {
      return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
    }

    // Resolve patientId
    const [pat] = await db
      .select({ id: patients.id })
      .from(patients)
      .where(eq(patients.userId, user.id))
      .limit(1);
    if (!pat) return NextResponse.json({ error: "Paciente não encontrado." }, { status: 404 });

    // Verify ownership
    const [appt] = await db
      .select({
        id: psychologistAppointments.id,
        status: psychologistAppointments.status,
      })
      .from(psychologistAppointments)
      .where(
        and(
          eq(psychologistAppointments.id, id),
          eq(psychologistAppointments.patientId, pat.id),
        ),
      )
      .limit(1);

    if (!appt) {
      return NextResponse.json({ error: "Consulta não encontrada." }, { status: 404 });
    }

    if (appt.status === "CANCELLED") {
      return NextResponse.json({ error: "Esta consulta já foi cancelada." }, { status: 409 });
    }

    if (appt.status === "COMPLETED" || appt.status === "NO_SHOW") {
      return NextResponse.json({ error: "Não é possível cancelar uma consulta já encerrada." }, { status: 409 });
    }

    const prevStatus = appt.status;

    const [updated] = await db
      .update(psychologistAppointments)
      .set({
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancellationReason: "Cancelado pelo paciente",
        updatedAt: new Date(),
      })
      .where(eq(psychologistAppointments.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Não foi possível cancelar." }, { status: 500 });
    }

    await dbInsertAppointmentStatusEvent({
      appointmentId: id,
      fromStatus: prevStatus,
      toStatus: "CANCELLED",
      changedByUserId: user.id,
      note: "Cancelado pelo paciente",
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[patient/appointments/[id]/cancel PATCH]", err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
