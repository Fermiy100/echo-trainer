// OpenAI (gpt-4o-mini) — платный быстрый провайдер, ~$9 бюджета хватает на
// весь класс на семестр много раз. В отличие от бесплатного NIM: принимает
// несколько фото в ОДНОМ запросе и гарантирует валидный JSON через response_format,
// поэтому не нужен ни двухфазный OCR-обход, ни ретраи на случай сломанного JSON.
import { buildExplainSystemPrompt, buildExplainFromTextPrompt, VERIFY_SYSTEM_PROMPT, buildVerifyUserPrompt } from "@/lib/prompts";
import { ProviderError, type ExplainResult, type VerifyResult } from "./types";

const OPENAI_BASE_URL = "https://api.openai.com/v1";
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const TIMEOUT_MS = 30_000;

function requireApiKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new ProviderError("openai", "OPENAI_API_KEY не задан");
  return key;
}

async function chatCompletionAsJson<T>(messages: unknown, apiKey: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: 0.3,
        max_tokens: 2048,
        // Гарантирует, что content — валидный JSON-текст, без ретраев на сломанный формат.
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new ProviderError("openai", `HTTP ${res.status}: ${await res.text()}`);
    }
    const data = await res.json();
    const content: string | undefined = data?.choices?.[0]?.message?.content;
    if (!content) throw new ProviderError("openai", "Пустой ответ модели");
    return JSON.parse(content) as T;
  } finally {
    clearTimeout(timeout);
  }
}

export async function explainFromImage(imageDataUrls: string[], interest?: string | null): Promise<ExplainResult> {
  const apiKey = requireApiKey();
  const isMulti = imageDataUrls.length > 1;
  const systemPrompt = isMulti ? buildExplainFromTextPrompt(interest, imageDataUrls.length) : buildExplainSystemPrompt(interest);
  const label = isMulti
    ? `Вот ${imageDataUrls.length} фото одного параграфа учебника подряд (по порядку):`
    : "Вот фото страницы учебника:";

  const result = await chatCompletionAsJson<ExplainResult>(
    [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [
          { type: "text", text: label },
          ...imageDataUrls.map((url) => ({ type: "image_url", image_url: { url } })),
        ],
      },
    ],
    apiKey,
  );
  return isMulti ? { ...result, pagesRead: imageDataUrls.length, pagesTotal: imageDataUrls.length } : result;
}

export async function verifyRetell(keyPoints: string[], transcript: string): Promise<VerifyResult> {
  const apiKey = requireApiKey();
  return chatCompletionAsJson<VerifyResult>(
    [
      { role: "system", content: VERIFY_SYSTEM_PROMPT },
      { role: "user", content: buildVerifyUserPrompt(keyPoints, transcript) },
    ],
    apiKey,
  );
}
