import { NextResponse } from "next/server";
import { getPilotStats } from "@/lib/db";

export async function GET() {
  const stats = await getPilotStats();
  return NextResponse.json(
    stats ?? { uniqueStudents: 0, totalParagraphs: 0, averageStreakDays: 0 },
  );
}
