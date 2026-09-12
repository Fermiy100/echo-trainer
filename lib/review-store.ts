// Передаёт результат /api/verify из /retell в /review — тот же паттерн,
// что и paragraph-store.ts, и по той же причине: это один экранный переход,
// не постоянные данные.
function key(id: string) {
  return `echo:review:${id}`;
}

export function storeReview(id: string, coveredIndices: number[]) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(key(id), JSON.stringify(coveredIndices));
  } catch (err) {
    console.error("review-store: не удалось сохранить", err);
  }
}

export function readReview(id: string): number[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(key(id));
    return raw ? (JSON.parse(raw) as number[]) : null;
  } catch (err) {
    console.error("review-store: не удалось прочитать", err);
    return null;
  }
}
