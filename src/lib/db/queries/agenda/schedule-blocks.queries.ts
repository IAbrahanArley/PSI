import { and, eq, gt, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { psychologistScheduleBlocks } from "@/lib/db/schema";

/** Bloqueios ativos que intersectam o intervalo UTC [rangeStartUtc, rangeEndUtc). */
export async function dbListActiveScheduleBlocksOverlappingUtcRange(
  psychologistId: string,
  rangeStartUtc: Date,
  rangeEndUtc: Date,
) {
  return db
    .select({
      startsAt: psychologistScheduleBlocks.startsAt,
      endsAt: psychologistScheduleBlocks.endsAt,
    })
    .from(psychologistScheduleBlocks)
    .where(
      and(
        eq(psychologistScheduleBlocks.psychologistId, psychologistId),
        eq(psychologistScheduleBlocks.isActive, true),
        lt(psychologistScheduleBlocks.startsAt, rangeEndUtc),
        gt(psychologistScheduleBlocks.endsAt, rangeStartUtc),
      ),
    );
}
