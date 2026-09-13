import { NextRequest, NextResponse } from "next/server";
import { getOrCreateParentCode, getStudentIdByParentCode, getStudentSummary } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { studentId } = await req.json();
  if (typeof studentId !== "string" || !studentId) {
    return NextResponse.json({ error: "Ожидается studentId" }, { status: 400 });
  }
  const code = await getOrCreateParentCode(studentId);
  if (!code) {
    return NextResponse.json({ error: "База данных недоступна" }, { status: 503 });
  }
  return NextResponse.json({ code });
}

// Публичный просмотр по коду — без studentId в URL, чтобы код можно было
// спокойно показать родителю скриншотом, не раскрывая внутренний id ученика.
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.json({ error: "Ожидается code" }, { status: 400 });
  }
  const studentId = await getStudentIdByParentCode(code);
  if (!studentId) {
    return NextResponse.json({ found: false });
  }
  const summary = await getStudentSummary(studentId);
  return NextResponse.json({
    found: true,
    entries: summary?.entries ?? [],
    totalParagraphs: summary?.totalParagraphs ?? 0,
    streakDays: summary?.streakDays ?? 0,
  });
}
