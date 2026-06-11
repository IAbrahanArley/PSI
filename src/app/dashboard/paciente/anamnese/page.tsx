import { eq } from "drizzle-orm";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { patients, patientAnamnesis } from "@/lib/db/schema";
import { AnamneseFlow } from "./_components/AnamneseFlow";
import type { ExistingAnamnesis } from "./_components/AnamneseFlow";

export default async function AnamnesesPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let existing: ExistingAnamnesis | null = null;

  if (user?.id && process.env.DATABASE_URL) {
    try {
      // Resolve o patient_id
      const [patient] = await db
        .select({ id: patients.id })
        .from(patients)
        .where(eq(patients.userId, user.id))
        .limit(1);

      if (patient?.id) {
        const [row] = await db
          .select()
          .from(patientAnamnesis)
          .where(eq(patientAnamnesis.patientId, patient.id))
          .limit(1);

        if (row) {
          existing = {
            mainReasons:        row.mainReasons        as ExistingAnamnesis["mainReasons"],
            symptomDuration:    row.symptomDuration    as ExistingAnamnesis["symptomDuration"],
            hadPreviousTherapy: row.hadPreviousTherapy,
            previousApproach:   row.previousApproach   as ExistingAnamnesis["previousApproach"],
            preferredModality:  row.preferredModality  as ExistingAnamnesis["preferredModality"],
            genderPreference:   row.genderPreference   as ExistingAnamnesis["genderPreference"],
            availableDays:      row.availableDays      as ExistingAnamnesis["availableDays"],
            availablePeriods:   row.availablePeriods   as ExistingAnamnesis["availablePeriods"],
            investmentRange:    row.investmentRange    as ExistingAnamnesis["investmentRange"],
            urgencyLevel:       row.urgencyLevel       ?? undefined,
            completedAt:        row.completedAt?.toISOString() ?? null,
          };
        }
      }
    } catch {
      /* banco indisponível — segue sem dados anteriores */
    }
  }

  return <AnamneseFlow existing={existing} />;
}
