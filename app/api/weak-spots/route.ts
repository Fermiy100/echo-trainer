import { NextRequest, NextResponse } from "next/server";
import { getWeakSpots } from "@/lib/db";

export async function GET(req: NextRequest) {
  const studentId = req.nextUrl.searchParams.get("studentId");
  if (!studentId) {
    return NextResponse.json({ error: "Ожидается studentId" }, { status: 400 });
  }

  const spots = await getWeakSpots(studentId);
  return NextResponse.json({ isLive: spots !== null, spots: spots ?? [] });
}
