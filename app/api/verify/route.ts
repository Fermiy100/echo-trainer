import { NextRequest, NextResponse } from "next/server";
import { getVerification } from "@/lib/ai/fallback";
import { checkRateLimit } from "@/lib/cache";
import { saveAttempt } from "@/lib/db";

// Разумные потолки на пересказ (90с речи — это в разы меньше) и число ключевых
// пунктов, чтобы кто-нибудь не закинул мегабайты текста в один запрос.
const MAX_TRANSCRIPT_LENGTH = 10_000;
const MAX_KEY_POINTS = 50;

export async function POST(req: NextRequest) {
  const { keyPoints, transcript, subject, studentId } = await req.json();

  if (
    !Array.isArray(keyPoints) ||
    keyPoints.length > MAX_KEY_POINTS ||
    !keyPoints.every((p) => typeof p === "string") ||
    typeof transcript !== "string"
  ) {
    return NextResponse.json({ error: "Ожидаются keyPoints[] и transcript" }, { status: 400 });
  }
  if (transcript.trim().length === 0) {
    return NextResponse.json({ error: "Пересказ пустой — попробуй ещё раз" }, { status: 400 });
  }
  if (transcript.length > MAX_TRANSCRIPT_LENGTH) {
    return NextResponse.json({ error: "Пересказ слишком длинный" }, { status: 413 });
  }

  const ip = req.headers.get("x-forwarded-for") ?? "local";
  const allowed = await checkRateLimit(`verify:${ip}`);
  if (!allowed) {
    return NextResponse.json(
      { error: "Сейчас многолюдно, попробуй через минуту" },
      { status: 429 },
    );
  }

  const result = await getVerification(keyPoints, transcript);

  if (typeof studentId === "string") {
    // Если модель не распознала тему — не теряем попытку молча, пишем с
    // заглушкой, чтобы прогресс ученика не пропадал из истории без следа.
    const safeSubject = typeof subject === "string" && subject.trim() ? subject : "Без темы";
    // Сохраняем не только счётчик, но и САМИ пропущенные идеи текстом — это и
    // есть карта слабых мест для "Эхо Про" (см. lib/db.ts getWeakSpots).
    const missedPoints = keyPoints.filter((_, i) => !result.coveredIndices.includes(i));
    try {
      await saveAttempt(studentId, safeSubject, result.coveredIndices.length, keyPoints.length, missedPoints);
    } catch (err) {
      // История — не критично для ответа пользователю, не роняем запрос из-за неё
      console.error("verify: не удалось сохранить попытку в историю", err);
    }
  }

  return NextResponse.json(result);
}
