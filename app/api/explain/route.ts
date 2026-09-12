import { NextRequest, NextResponse } from "next/server";
import { createHash, randomUUID } from "node:crypto";
import { getExplanation } from "@/lib/ai/fallback";
import { getCached, setCached, checkRateLimit } from "@/lib/cache";

// ~10MB в base64 на фото — с запасом покрывает даже несжатое фото с телефона.
const MAX_IMAGE_DATA_URL_LENGTH = 14_000_000;
const MAX_IMAGES = 5;
// NVIDIA NIM жёстко отклоняет запрос больше 26 214 400 байт целиком (проверено
// напрямую: 5 полноразмерных фото с айфона = HTTP 400 "payload above ... bytes").
// Клиент сжимает фото перед отправкой, но это серверная страховка на случай,
// если сжатие не сработало или кто-то бьёт в API напрямую, а не через /capture.
const MAX_TOTAL_DATA_URL_LENGTH = 20_000_000;

function isValidImage(value: unknown): value is string {
  return typeof value === "string" && value.startsWith("data:image/") && value.length <= MAX_IMAGE_DATA_URL_LENGTH;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  // imageDataUrls — новый формат (до 5 фото одного параграфа на разворот);
  // imageDataUrl — старый формат в один снимок, оставлен для совместимости.
  const imageDataUrls: unknown[] = Array.isArray(body.imageDataUrls)
    ? body.imageDataUrls
    : body.imageDataUrl
      ? [body.imageDataUrl]
      : [];
  const { interest } = body;

  if (
    imageDataUrls.length === 0 ||
    imageDataUrls.length > MAX_IMAGES ||
    !imageDataUrls.every(isValidImage)
  ) {
    return NextResponse.json(
      { error: `Ожидается от 1 до ${MAX_IMAGES} фото (data:image/...)` },
      { status: 400 },
    );
  }
  const totalLength = (imageDataUrls as string[]).reduce((sum, url) => sum + url.length, 0);
  if (totalLength > MAX_TOTAL_DATA_URL_LENGTH) {
    return NextResponse.json(
      { error: "Все фото вместе слишком большие — убери одно или переснимай при меньшем разрешении" },
      { status: 413 },
    );
  }
  if (interest !== undefined && interest !== null && typeof interest !== "string") {
    return NextResponse.json({ error: "interest должен быть строкой" }, { status: 400 });
  }

  const ip = req.headers.get("x-forwarded-for") ?? "local";
  const allowed = await checkRateLimit(`explain:${ip}`);
  if (!allowed) {
    return NextResponse.json(
      { error: "Сейчас многолюдно, попробуй через минуту" },
      { status: 429 },
    );
  }

  // Аналогии зависят от интереса ученика, поэтому он тоже часть ключа кэша —
  // иначе один и тот же параграф с другим интересом отдаст старые аналогии.
  const hash = createHash("sha256");
  for (const url of imageDataUrls as string[]) hash.update(url);
  hash.update(String(interest ?? ""));
  const cacheKey = `explain:${hash.digest("hex")}`;

  const cached = await getCached<Record<string, unknown>>(cacheKey);
  if (cached) {
    return NextResponse.json({ id: randomUUID(), ...cached, cached: true });
  }

  const result = await getExplanation(imageDataUrls as string[], interest);
  // Фоллбэк-пример не кэшируем — иначе временная ошибка модели "запомнится"
  // как кэшированный ответ для этого же фото на следующие 7 дней.
  if (result.source !== "offline-example") {
    await setCached(cacheKey, result);
  }

  return NextResponse.json({ id: randomUUID(), ...result, cached: false });
}
