// Платный резерв (DeepSeek API напрямую) — только для текстовых задач,
// картинки читать не умеет. Используется как fallback для verify, если у NIM
// исчерпан лимит 40 запросов/мин во время пилота (см. 02-ARCHITECTURE.md).
import { VERIFY_SYSTEM_PROMPT, buildVerifyUserPrompt } from "@/lib/prompts";
import { extractJson } from "./json";
import { ProviderError, type VerifyResult } from "./types";

const TIMEOUT_MS = 12_000;

export async function verifyRetellFallback(keyPoints: string[], transcript: string): Promise<VerifyResult> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new ProviderError("deepseek", "DEEPSEEK_API_KEY не задан");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        temperature: 0.3,
        max_tokens: 512,
        messages: [
          { role: "system", content: VERIFY_SYSTEM_PROMPT },
          { role: "user", content: buildVerifyUserPrompt(keyPoints, transcript) },
        ],
      }),
      signal: controller.signal,
    });
    if (!res.ok) throw new ProviderError("deepseek", `HTTP ${res.status}: ${await res.text()}`);
    const data = await res.json();
    const content: string | undefined = data?.choices?.[0]?.message?.content;
    if (!content) throw new ProviderError("deepseek", "Пустой ответ модели");
    return extractJson<VerifyResult>(content);
  } finally {
    clearTimeout(timeout);
  }
}
