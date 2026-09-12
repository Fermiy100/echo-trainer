// Передаёт результат /api/verify из /retell в /review — тот же паттерн,
// что и paragraph-store.ts, и по той же причине: это один экранный переход,
// не постоянные данные.
function key(id: string) {
  return `echo:review:${id}`;
}

export type StoredReview = {
  coveredIndices: number[];
  source?: "openai" | "nim" | "deepseek" | "heuristic";
};

export function storeReview(id: string, coveredIndices: number[], source?: StoredReview["source"]) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(key(id), JSON.stringify({ coveredIndices, source }));
  } catch (err) {
    console.error("review-store: не удалось сохранить", err);
  }
}

export function readReview(id: string): StoredReview | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(key(id));
    return raw ? (JSON.parse(raw) as StoredReview) : null;
  } catch (err) {
    console.error("review-store: не удалось прочитать", err);
    return null;
  }
}
