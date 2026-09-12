// Клиент NVIDIA NIM (build.nvidia.com) — OpenAI-совместимый API, бесплатный
// тариф ~40 запросов/мин. Модель задаётся переменной окружения, потому что
// каталог моделей NIM меняется — сверься с актуальным списком на build.nvidia.com
// перед первым запуском (нужна vision-модель для explain, текстовая подойдёт для verify).
import { buildExplainSystemPrompt, VERIFY_SYSTEM_PROMPT, buildVerifyUserPrompt } from "@/lib/prompts";
import { extractJson } from "./json";
import { ProviderError, type ExplainResult, type VerifyResult } from "./types";

const NIM_BASE_URL = "https://integrate.api.nvidia.com/v1";
const VISION_MODEL = process.env.NVIDIA_NIM_VISION_MODEL || "meta/llama-3.2-11b-vision-instruct";
// Каталог NIM для бесплатных аккаунтов сильно уже полного списка на сайте — большинство
// «отдельных» текстовых моделей (deepseek-v3.x, llama-3.1/3.3-instruct, mistral, gemma)
// возвращают 404 "not found for account". Vision-модель отвечает и на чисто текстовые
// запросы, поэтому по умолчанию используем её же — подтверждено рабочим curl-запросом.
const TEXT_MODEL = process.env.NVIDIA_NIM_TEXT_MODEL || VISION_MODEL;
// Структурированный JSON-ответ (explain) занимает больше токенов, чем короткий verify —
// на практике генерация занимала от 13 до 35с (свободный тариф не гарантирует задержку),
// поэтому оставляем запас побольше, чем самое медленное измеренное значение.
const TIMEOUT_MS = 50_000;

function requireApiKey(): string {
  const key = process.env.NVIDIA_NIM_API_KEY;
  if (!key) throw new ProviderError("nim", "NVIDIA_NIM_API_KEY не задан");
  return key;
}

async function chatCompletion(model: string, messages: unknown, apiKey: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${NIM_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      // Низкая температура — модель не всегда соблюдает "строго JSON" при 0.4,
      // особенно на длинных параграфах; 0.15 заметно надёжнее для структурированного вывода.
      body: JSON.stringify({ model, messages, temperature: 0.15, max_tokens: 1400 }),
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new ProviderError("nim", `HTTP ${res.status}: ${await res.text()}`);
    }
    const data = await res.json();
    const content: string | undefined = data?.choices?.[0]?.message?.content;
    if (!content) throw new ProviderError("nim", "Пустой ответ модели");
    return content;
  } finally {
    clearTimeout(timeout);
  }
}

// Модель не всегда возвращает валидный JSON с первой попытки (иногда добавляет
// пояснение вокруг или обрывает форматирование) — это подтверждено повторными
// тестами на одном и том же фото: часть попыток проходит, часть — нет. Раньше
// одна неудача парсинга сразу уводила в офлайн-пример; теперь пробуем ещё раз,
// прежде чем сдаться — это решает подавляющее большинство случаев.
async function chatCompletionAsJson<T>(model: string, messages: unknown, apiKey: string, attempts = 3): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const content = await chatCompletion(model, messages, apiKey);
      return extractJson<T>(content);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}

export async function explainFromImage(imageDataUrls: string[], interest?: string | null): Promise<ExplainResult> {
  const apiKey = requireApiKey();
  const label =
    imageDataUrls.length > 1
      ? `Вот ${imageDataUrls.length} фото одного параграфа учебника (по порядку):`
      : "Вот фото страницы учебника:";
  return chatCompletionAsJson<ExplainResult>(
    VISION_MODEL,
    [
      { role: "system", content: buildExplainSystemPrompt(interest) },
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
}

export async function verifyRetell(keyPoints: string[], transcript: string): Promise<VerifyResult> {
  const apiKey = requireApiKey();
  return chatCompletionAsJson<VerifyResult>(
    TEXT_MODEL,
    [
      { role: "system", content: VERIFY_SYSTEM_PROMPT },
      { role: "user", content: buildVerifyUserPrompt(keyPoints, transcript) },
    ],
    apiKey,
  );
}
