import { eq } from "drizzle-orm";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { patients, patientAnamnesis } from "@/lib/db/schema";
import { PsychologistsList } from "./_components/PsychologistsList";

export default async function PsicologosPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let hasAnamnesis = false;

  if (user?.id && process.env.DATABASE_URL) {
    try {
      const [pat] = await db
        .select({ id: patients.id })
        .from(patients)
        .where(eq(patients.userId, user.id))
        .limit(1);

      if (pat?.id) {
        const [anamnesis] = await db
          .select({ completedAt: patientAnamnesis.completedAt })
          .from(patientAnamnesis)
          .where(eq(patientAnamnesis.patientId, pat.id))
          .limit(1);

        hasAnamnesis = !!anamnesis?.completedAt;
      }
    } catch {
      /* banco indisponível — sem anamnese */
    }
  }

  return <PsychologistsList hasAnamnesis={hasAnamnesis} />;
}
