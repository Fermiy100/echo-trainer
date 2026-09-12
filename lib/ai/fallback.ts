// Общая цепочка «основной провайдер → платный резерв → офлайн-пример»
// (см. 02-ARCHITECTURE.md). Пользователь никогда не должен увидеть голую
// техническую ошибку — на каждом уровне есть заранее продуманный запасной путь.
import { MOCK_PARAGRAPH } from "@/lib/mock-data";
import * as nim from "./nim";
import * as deepseek from "./deepseek";
import type { ExplainResult, VerifyResult } from "./types";

export type ExplainOutcome = ExplainResult & { source: "nim" | "offline-example" };
export type VerifyOutcome = VerifyResult & { source: "nim" | "deepseek" | "heuristic" };

export async function getExplanation(imageDataUrls: string[], interest?: string | null): Promise<ExplainOutcome> {
  try {
    const result = await nim.explainFromImage(imageDataUrls, interest);
    return { ...result, source: "nim" };
  } catch (err) {
    console.error("explain: NIM недоступен, отдаю офлайн-пример", err);
    // DeepSeek не читает картинки — второго уровня для фото нет, честно уходим
    // на гарантированно рабочий пример вместо голой ошибки.
    const { subject, simplifiedText, keyTerms, keyPoints, analogies } = MOCK_PARAGRAPH;
    return { subject, simplifiedText, keyTerms, keyPoints, analogies, source: "offline-example" };
  }
}

function heuristicVerify(keyPoints: string[], transcript: string): number[] {
  const stopwords = new Set([
    "и", "в", "на", "с", "по", "для", "из", "к", "а", "но", "что", "это", "как",
    "не", "он", "она", "они", "его", "её", "их", "то", "же", "за", "от", "до",
  ]);
  const transcriptWords = new Set(
    transcript
      .toLowerCase()
      .replace(/[^\wа-яё\s]/gi, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3 && !stopwords.has(w)),
  );

  return keyPoints
    .map((point, i) => {
      const pointWords = point
        .toLowerCase()
        .replace(/[^\wа-яё\s]/gi, " ")
        .split(/\s+/)
        .filter((w) => w.length > 3 && !stopwords.has(w));
      if (pointWords.length === 0) return { i, hit: false };
      const matched = pointWords.filter((w) => transcriptWords.has(w)).length;
      return { i, hit: matched / pointWords.length >= 0.4 };
    })
    .filter((r) => r.hit)
    .map((r) => r.i);
}

export async function getVerification(keyPoints: string[], transcript: string): Promise<VerifyOutcome> {
  try {
    const result = await nim.verifyRetell(keyPoints, transcript);
    return { ...result, source: "nim" };
  } catch (err) {
    console.error("verify: NIM недоступен, пробую DeepSeek", err);
  }
  try {
    const result = await deepseek.verifyRetellFallback(keyPoints, transcript);
    return { ...result, source: "deepseek" };
  } catch (err) {
    console.error("verify: DeepSeek тоже недоступен, считаю по ключевым словам локально", err);
  }
  return { coveredIndices: heuristicVerify(keyPoints, transcript), source: "heuristic" };
}
