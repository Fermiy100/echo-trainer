// Groq Whisper — только для демо-режима на защите, где точность важнее
// бюджета (см. 02-ARCHITECTURE.md: сознательно не тратим на весь пилот).
import { ProviderError } from "./types";

const TIMEOUT_MS = 15_000;

export async function transcribeAudio(audio: Blob, filename = "retell.webm"): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new ProviderError("groq", "GROQ_API_KEY не задан");

  const form = new FormData();
  form.append("file", audio, filename);
  form.append("model", "whisper-large-v3");
  form.append("language", "ru");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
      signal: controller.signal,
    });
    if (!res.ok) throw new ProviderError("groq", `HTTP ${res.status}: ${await res.text()}`);
    const data = await res.json();
    if (!data?.text) throw new ProviderError("groq", "Пустая расшифровка");
    return data.text as string;
  } finally {
    clearTimeout(timeout);
  }
}
