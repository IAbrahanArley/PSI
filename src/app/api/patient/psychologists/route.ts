import { eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRoleFromUser } from "@/lib/auth/roles";
import { db } from "@/lib/db";
import {
  patients,
  patientAnamnesis,
  psychologists,
  psychologistSpecialties,
} from "@/lib/db/schema";

// ─── Tipos públicos ───────────────────────────────────────────────────────────

export type PsychologistCard = {
  id:                  string;
  slug:                string;
  fullName:            string;
  professionalName:    string | null;
  bio:                 string | null;
  approach:            string | null;
  gender:              string | null;
  profileImageUrl:     string | null;
  offersOnline:        boolean;
  offersPresential:    boolean;
  sessionPrice:        string | null;
  whatsapp:            string | null;
  specialties:         string[];
  advertisingHighlight: boolean;
  /** 0–100 */
  matchScore:          number;
  matchReasons:        string[];
};

// ─── Algoritmo de match ───────────────────────────────────────────────────────
//
//  Dimensão              Peso  Critério
//  ─────────────────────────────────────────────────
//  Modalidade             35   patient.preferredModality vs offersOnline/offersPresential
//  Gênero                 25   patient.genderPreference  vs psychologist.gender
//  Faixa de preço         30   patient.investmentRange   vs sessionPrice
//  Plano Destaque (bonus) 10   advertisingHighlight
//  ─────────────────────────────────────────────────
//  Total máximo          100

type Anamnesis = Awaited<ReturnType<typeof loadAnamnesis>>;

function scoreModality(
  preferred: string | null,
  offersOnline: boolean,
  offersPresential: boolean,
): { pts: number; reason: string | null } {
  if (!preferred || preferred === "NO_PREFERENCE")
    return { pts: 35, reason: null };
  if (preferred === "ONLINE" && offersOnline)
    return { pts: 35, reason: "Atende online" };
  if (preferred === "PRESENTIAL" && offersPresential)
    return { pts: 35, reason: "Atende presencialmente" };
  // Sem match perfeito: verifica se pelo menos oferece alguma coisa
  if (offersOnline || offersPresential)
    return { pts: 15, reason: null };
  return { pts: 0, reason: null };
}

function scoreGender(
  preference: string | null,
  psychGender: string | null,
): { pts: number; reason: string | null } {
  if (!preference || preference === "NO_PREFERENCE")
    return { pts: 25, reason: null };
  if (preference === "MALE" && psychGender === "MALE")
    return { pts: 25, reason: "Gênero preferido" };
  if (preference === "FEMALE" && psychGender === "FEMALE")
    return { pts: 25, reason: "Gênero preferido" };
  return { pts: 0, reason: null };
}

function scorePrice(
  range: string | null,
  priceStr: string | null,
): { pts: number; reason: string | null } {
  if (!range || range === "flexible")
    return { pts: 30, reason: null };
  if (!priceStr) return { pts: 15, reason: null }; // preço não informado → neutro

  const price = parseFloat(priceStr);
  if (isNaN(price)) return { pts: 15, reason: null };

  const fits = (
    (range === "up100"    && price <= 100)   ||
    (range === "100to150" && price > 100 && price <= 150) ||
    (range === "150to200" && price > 150 && price <= 200) ||
    (range === "200plus"  && price > 200)
  );

  if (fits) return { pts: 30, reason: `Dentro da sua faixa de R$ ${price.toFixed(0)}` };

  // Margem de tolerância de 20%
  const ranges: Record<string, [number, number]> = {
    up100:    [0,    100],
    "100to150": [100, 150],
    "150to200": [150, 200],
    "200plus":  [200, 9999],
  };
  const [lo, hi] = ranges[range] ?? [0, 9999];
  const center = (lo + hi) / 2;
  const margin = Math.abs(price - center) / (center || 1);
  if (margin <= 0.25) return { pts: 15, reason: null };

  return { pts: 0, reason: null };
}

function computeScore(
  psy: {
    gender: string | null;
    offersOnline: boolean;
    offersPresential: boolean;
    sessionPrice: string | null;
    advertisingHighlight: boolean;
  },
  anamnesis: Anamnesis | null,
): { score: number; reasons: string[] } {
  // Sem anamnese → score base para todos
  if (!anamnesis) {
    const base = psy.advertisingHighlight ? 60 : 50;
    return { score: base, reasons: [] };
  }

  const modality = scoreModality(
    anamnesis.preferredModality,
    psy.offersOnline,
    psy.offersPresential,
  );
  const gender  = scoreGender(anamnesis.genderPreference, psy.gender);
  const price   = scorePrice(anamnesis.investmentRange, psy.sessionPrice);
  const bonus   = psy.advertisingHighlight ? 10 : 0;

  const total   = modality.pts + gender.pts + price.pts + bonus;
  const reasons = [modality.reason, gender.reason, price.reason].filter(Boolean) as string[];

  return { score: Math.min(100, total), reasons };
}

// ─── Carrega anamnese do paciente ─────────────────────────────────────────────

async function loadAnamnesis(patientId: string) {
  const [row] = await db
    .select({
      preferredModality: patientAnamnesis.preferredModality,
      genderPreference:  patientAnamnesis.genderPreference,
      investmentRange:   patientAnamnesis.investmentRange,
    })
    .from(patientAnamnesis)
    .where(eq(patientAnamnesis.patientId, patientId))
    .limit(1);
  return row ?? null;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const role = getRoleFromUser(user);
    if (role !== "PATIENT" && role !== "ADMIN") {
      return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
    }

    // Resolve anamnese (se existir)
    let anamnesis: Anamnesis | null = null;
    if (role === "PATIENT") {
      const [pat] = await db
        .select({ id: patients.id })
        .from(patients)
        .where(eq(patients.userId, user.id))
        .limit(1);
      if (pat?.id) anamnesis = await loadAnamnesis(pat.id);
    }

    // Busca psicólogos ativos
    const rows = await db
      .select({
        id:                  psychologists.id,
        slug:                psychologists.slug,
        fullName:            psychologists.fullName,
        professionalName:    psychologists.professionalName,
        bio:                 psychologists.bio,
        approach:            psychologists.approach,
        gender:              psychologists.gender,
        profileImageUrl:     psychologists.profileImageUrl,
        offersOnline:        psychologists.offersOnline,
        offersPresential:    psychologists.offersPresential,
        sessionPrice:        psychologists.sessionPrice,
        whatsapp:            psychologists.whatsapp,
        advertisingHighlight: psychologists.advertisingHighlight,
      })
      .from(psychologists)
      .where(eq(psychologists.status, "ACTIVE"));

    if (rows.length === 0) {
      return NextResponse.json({ psychologists: [], hasAnamnesis: !!anamnesis });
    }

    // Busca especialidades de todos os psicólogos de uma vez
    const ids = rows.map((r) => r.id);
    const specRows = await db
      .select({
        psychologistId: psychologistSpecialties.psychologistId,
        label:          psychologistSpecialties.label,
        sortOrder:      psychologistSpecialties.sortOrder,
      })
      .from(psychologistSpecialties)
      .where(inArray(psychologistSpecialties.psychologistId, ids))
      .orderBy(psychologistSpecialties.sortOrder);

    const specMap = new Map<string, string[]>();
    for (const s of specRows) {
      const arr = specMap.get(s.psychologistId) ?? [];
      arr.push(s.label);
      specMap.set(s.psychologistId, arr);
    }

    // Calcula score e monta cards
    const cards: PsychologistCard[] = rows.map((psy) => {
      const { score, reasons } = computeScore(psy, anamnesis);
      return {
        id:                  psy.id,
        slug:                psy.slug,
        fullName:            psy.fullName,
        professionalName:    psy.professionalName,
        bio:                 psy.bio,
        approach:            psy.approach,
        gender:              psy.gender,
        profileImageUrl:     psy.profileImageUrl,
        offersOnline:        psy.offersOnline,
        offersPresential:    psy.offersPresential,
        sessionPrice:        psy.sessionPrice,
        whatsapp:            psy.whatsapp,
        specialties:         specMap.get(psy.id) ?? [],
        advertisingHighlight: psy.advertisingHighlight,
        matchScore:          score,
        matchReasons:        reasons,
      };
    });

    // Ordena: score DESC, highlight primeiro em caso de empate
    cards.sort((a, b) => {
      if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
      if (b.advertisingHighlight !== a.advertisingHighlight)
        return b.advertisingHighlight ? 1 : -1;
      return 0;
    });

    return NextResponse.json({ psychologists: cards, hasAnamnesis: !!anamnesis });
  } catch (err) {
    console.error("[patient/psychologists GET]", err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
