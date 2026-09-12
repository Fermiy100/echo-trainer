import { NextRequest, NextResponse } from "next/server";
import { getAnswer } from "@/lib/ai/fallback";
import { checkRateLimit } from "@/lib/cache";

const MAX_QUESTION_LENGTH = 500;
const MAX_CONTEXT_LENGTH = 6000;

export async function POST(req: NextRequest) {
  const { explanationText, question } = await req.json();

  if (typeof explanationText !== "string" || typeof question !== "string" || !question.trim()) {
    return NextResponse.json({ error: "Ожидаются explanationText и question" }, { status: 400 });
  }
  if (question.length > MAX_QUESTION_LENGTH) {
    return NextResponse.json({ error: "Вопрос слишком длинный" }, { status: 413 });
  }
  if (explanationText.length > MAX_CONTEXT_LENGTH) {
    return NextResponse.json({ error: "Слишком много контекста" }, { status: 413 });
  }

  const ip = req.headers.get("x-forwarded-for") ?? "local";
  const allowed = await checkRateLimit(`ask:${ip}`);
  if (!allowed) {
    return NextResponse.json({ error: "Сейчас многолюдно, попробуй через минуту" }, { status: 429 });
  }

  try {
    const answer = await getAnswer(explanationText, question.trim());
    return NextResponse.json({ answer });
  } catch (err) {
    console.error("ask: не удалось получить ответ", err);
    return NextResponse.json(
      { error: "Не получилось ответить — попробуй спросить ещё раз" },
      { status: 503 },
    );
  }
}
