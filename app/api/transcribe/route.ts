import { NextRequest, NextResponse } from "next/server";
import { transcribeAudio } from "@/lib/ai/groq";

// Только для демо-режима: точная расшифровка на защите важнее бюджета
// (см. 02-ARCHITECTURE.md). Обычный пилот использует бесплатный Web Speech API
// прямо в браузере, сюда не заходит.
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const audio = formData.get("audio");
  if (!(audio instanceof Blob)) {
    return NextResponse.json({ error: "Ожидается поле audio" }, { status: 400 });
  }

  try {
    const text = await transcribeAudio(audio);
    return NextResponse.json({ text });
  } catch (err) {
    console.error("transcribe: Groq недоступен", err);
    return NextResponse.json(
      { error: "Расшифровка недоступна, используй обычный пересказ" },
      { status: 503 },
    );
  }
}
