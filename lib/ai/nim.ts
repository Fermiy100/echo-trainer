// Клиент NVIDIA NIM (build.nvidia.com) — OpenAI-совместимый API, бесплатный
// тариф ~40 запросов/мин. Модель задаётся переменной окружения, потому что
// каталог моделей NIM меняется — сверься с актуальным списком на build.nvidia.com
// перед первым запуском (нужна vision-модель для explain, текстовая подойдёт для verify).
import {
  buildExplainSystemPrompt,
  buildExplainFromTextPrompt,
  TRANSCRIBE_PAGE_PROMPT,
  VERIFY_SYSTEM_PROMPT,
  buildVerifyUserPrompt,
} from "@/lib/prompts";
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
      // 2048 — с запасом на дословную транскрипцию плотной страницы (математика
      // с дробями, теоремами и т.д. занимает заметно больше токенов, чем связный текст).
      body: JSON.stringify({ model, messages, temperature: 0.15, max_tokens: 2048 }),
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

async function chatCompletionWithRetry(model: string, messages: unknown, apiKey: string, attempts = 3): Promise<string> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await chatCompletion(model, messages, apiKey);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}

// Проверено напрямую: модель на бесплатном тарифе NIM принимает НЕ БОЛЬШЕ ОДНОЙ
// картинки в запросе — с несколькими сразу возвращает HTTP 400 "At most 1 image(s)
// may be provided". Поэтому при нескольких фото параграфа читаем текст с каждого
// по отдельности (обычный OCR-промпт, не JSON), затем собираем в один текст и
// разбираем его уже одним финальным текстовым запросом.
async function transcribePage(imageDataUrl: string, apiKey: string): Promise<string> {
  try {
    const content = await chatCompletionWithRetry(VISION_MODEL, [
      { role: "system", content: TRANSCRIBE_PAGE_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: "Текст с этой страницы:" },
          { type: "image_url", image_url: { url: imageDataUrl } },
        ],
      },
    ], apiKey);
    const trimmed = content.trim();
    return trimmed.toUpperCase() === "ПУСТО" ? "" : trimmed;
  } catch (err) {
    console.error("nim: не удалось прочитать одну из страниц, пропускаю", err);
    return "";
  }
}

export async function explainFromImage(imageDataUrls: string[], interest?: string | null): Promise<ExplainResult> {
  const apiKey = requireApiKey();

  if (imageDataUrls.length === 1) {
    const single = await chatCompletionAsJson<ExplainResult>(
      VISION_MODEL,
      [
        { role: "system", content: buildExplainSystemPrompt(interest) },
        {
          role: "user",
          content: [
            { type: "text", text: "Вот фото страницы учебника:" },
            { type: "image_url", image_url: { url: imageDataUrls[0] } },
          ],
        },
      ],
      apiKey,
    );
    if (single.unreadable) throw new ProviderError("nim", "Модель пометила фото как нечитаемое");
    return single;
  }

  // Последовательно, не параллельно: пять одновременных запросов к бесплатному
  // тарифу NIM конкурируют за один и тот же лимит и почти все таймаутятся —
  // проверено напрямую (4 из 5 падали по AbortError при Promise.all).
  const pageTexts: string[] = [];
  let pagesRead = 0;
  for (const url of imageDataUrls) {
    const text = await transcribePage(url, apiKey);
    if (text) pagesRead++;
    pageTexts.push(text);
  }
  const combinedText = pageTexts.filter(Boolean).join("\n\n");
  if (!combinedText) {
    throw new ProviderError("nim", "Не удалось прочитать текст ни с одного из фото");
  }

  const result = await chatCompletionAsJson<ExplainResult>(
    TEXT_MODEL,
    [
      { role: "system", content: buildExplainFromTextPrompt(interest, imageDataUrls.length) },
      { role: "user", content: `Текст параграфа:\n\n${combinedText}` },
    ],
    apiKey,
  );
  if (result.unreadable) throw new ProviderError("nim", "Модель пометила текст как нечитаемый");
  return { ...result, pagesRead, pagesTotal: imageDataUrls.length };
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
