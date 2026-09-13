import { NextRequest, NextResponse } from "next/server";
import { getReword } from "@/lib/ai/fallback";
import { checkRateLimit } from "@/lib/cache";

const MAX_CONTEXT_LENGTH = 6000;

export async function POST(req: NextRequest) {
  const { explanationText } = await req.json();

  if (typeof explanationText !== "string" || !explanationText.trim()) {
    return NextResponse.json({ error: "Ожидается explanationText" }, { status: 400 });
  }
  if (explanationText.length > MAX_CONTEXT_LENGTH) {
    return NextResponse.json({ error: "Слишком много контекста" }, { status: 413 });
  }

  const ip = req.headers.get("x-forwarded-for") ?? "local";
  const allowed = await checkRateLimit(`reword:${ip}`);
  if (!allowed) {
    return NextResponse.json({ error: "Сейчас многолюдно, попробуй через минуту" }, { status: 429 });
  }

  try {
    const explanationBlocks = await getReword(explanationText);
    return NextResponse.json({ explanationBlocks });
  } catch (err) {
    console.error("reword: не удалось получить альтернативное объяснение", err);
    return NextResponse.json(
      { error: "Не получилось объяснить иначе — попробуй ещё раз" },
      { status: 503 },
    );
  }
}
