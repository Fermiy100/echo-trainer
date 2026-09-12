import { NextRequest, NextResponse } from "next/server";
import { createHash, randomUUID } from "node:crypto";
import { getExplanation } from "@/lib/ai/fallback";
import { getCached, setCached, checkRateLimit } from "@/lib/cache";

// ~10MB в base64 — с запасом покрывает фото с телефона, но не пускает
// произвольно огромные пейлоады тратить бесплатный лимит NIM.
const MAX_IMAGE_DATA_URL_LENGTH = 14_000_000;

export async function POST(req: NextRequest) {
  const { imageDataUrl, interest } = await req.json();
  if (typeof imageDataUrl !== "string" || !imageDataUrl.startsWith("data:image/")) {
    return NextResponse.json({ error: "Ожидается imageDataUrl (data:image/...)" }, { status: 400 });
  }
  if (imageDataUrl.length > MAX_IMAGE_DATA_URL_LENGTH) {
    return NextResponse.json({ error: "Фото слишком большое, попробуй переснять" }, { status: 413 });
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
  const cacheKey = `explain:${createHash("sha256")
    .update(imageDataUrl)
    .update(String(interest ?? ""))
    .digest("hex")}`;
  const cached = await getCached<Record<string, unknown>>(cacheKey);
  if (cached) {
    return NextResponse.json({ id: randomUUID(), ...cached, cached: true });
  }

  const result = await getExplanation(imageDataUrl, interest);
  await setCached(cacheKey, result);

  return NextResponse.json({ id: randomUUID(), ...result, cached: false });
}
