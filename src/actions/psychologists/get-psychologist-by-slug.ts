"use server";

import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  psychologistAwards,
  psychologistCurriculum,
  psychologistSkills,
  psychologistSpecialties,
  psychologistAddresses,
  psychologistWeeklyAvailability,
  psychologists,
} from "@/lib/db/schema";
import { users } from "@/lib/db/schema/users";
import { emptyCurriculum } from "@/lib/types/psychologist-curriculum";
import { buildWeeklyScheduleRows, formatAddressForPublic } from "./format-public-contact";
import type { PsychologistDetail } from "./types";

export async function getPsychologistBySlug(slug?: string): Promise<PsychologistDetail | null> {
  if (!process.env.DATABASE_URL?.trim() || !slug?.trim()) return null;

  const [psy] = await db.select().from(psychologists).where(eq(psychologists.slug, slug)).limit(1);
  if (!psy) return null;

  const [userRow, specialties, skills, awards, cvRow, addresses, weeklyRules] = await Promise.all([
    db.select({ email: users.email }).from(users).where(eq(users.id, psy.userId)).limit(1),
    db
      .select()
      .from(psychologistSpecialties)
      .where(eq(psychologistSpecialties.psychologistId, psy.id))
      .orderBy(asc(psychologistSpecialties.sortOrder)),
    db
      .select()
      .from(psychologistSkills)
      .where(eq(psychologistSkills.psychologistId, psy.id))
      .orderBy(asc(psychologistSkills.sortOrder)),
    db
      .select()
      .from(psychologistAwards)
      .where(eq(psychologistAwards.psychologistId, psy.id))
      .orderBy(asc(psychologistAwards.sortOrder)),
    db
      .select()
      .from(psychologistCurriculum)
      .where(eq(psychologistCurriculum.psychologistId, psy.id))
      .limit(1),
    db
      .select()
      .from(psychologistAddresses)
      .where(eq(psychologistAddresses.psychologistId, psy.id))
      .orderBy(asc(psychologistAddresses.sortOrder)),
    db
      .select({
        weekday: psychologistWeeklyAvailability.weekday,
        startTime: psychologistWeeklyAvailability.startTime,
        endTime: psychologistWeeklyAvailability.endTime,
      })
      .from(psychologistWeeklyAvailability)
      .where(
        and(
          eq(psychologistWeeklyAvailability.psychologistId, psy.id),
          eq(psychologistWeeklyAvailability.ruleType, "AVAILABLE"),
          eq(psychologistWeeklyAvailability.isActive, true),
        ),
      )
      .orderBy(
        asc(psychologistWeeklyAvailability.weekday),
        asc(psychologistWeeklyAvailability.sortOrder),
      ),
  ]);

  const specialtyList = specialties.length > 0 ? specialties.map((s) => s.label) : psy.specialty ? [psy.specialty] : [];
  const curriculum = cvRow[0]?.content ?? emptyCurriculum();

  const publicAddresses = addresses.map((a) => ({
    id: a.id,
    label: a.label,
    formatted: formatAddressForPublic(a),
  }));

  const weeklySchedule = buildWeeklyScheduleRows(weeklyRules);

  return {
    id: psy.id,
    slug: psy.slug,
    displayName: (psy.professionalName?.trim() || psy.fullName).trim(),
    fullName: psy.fullName,
    professionalName: psy.professionalName,
    crp: psy.crp,
    bio: psy.bio,
    profileImageUrl: psy.profileImageUrl,
    specialties: specialtyList,
    skills: skills.map((s) => s.label),
    awards: awards.map((a) => ({ id: a.id, title: a.title, link: a.link, imageUrl: a.imageUrl })),
    curriculum: curriculum as PsychologistDetail["curriculum"],
    contactEmail: userRow[0]?.email ?? null,
    phone: psy.phone,
    whatsapp: psy.whatsapp,
    addresses: publicAddresses,
    weeklySchedule,
    city: psy.city,
    state: psy.state,
  };
}
