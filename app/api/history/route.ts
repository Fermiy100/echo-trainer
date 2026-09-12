import { NextRequest, NextResponse } from "next/server";
import { getStudentSummary } from "@/lib/db";

export async function GET(req: NextRequest) {
  const studentId = req.nextUrl.searchParams.get("studentId");
  if (!studentId) {
    return NextResponse.json({ error: "Ожидается studentId" }, { status: 400 });
  }

  const summary = await getStudentSummary(studentId);
  return NextResponse.json({
    isLive: summary !== null,
    entries: summary?.entries ?? [],
    totalParagraphs: summary?.totalParagraphs ?? 0,
    streakDays: summary?.streakDays ?? 0,
  });
}
