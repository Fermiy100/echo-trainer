export type ExplainResult = {
  // Предохранитель от галлюцинаций: модель сама помечает нечитаемое фото вместо
  // того, чтобы придумать правдоподобный текст — код проверяет это поле и уходит
  // в честный фоллбэк, если оно true (см. lib/prompts.ts UNREADABLE_INSTRUCTION).
  unreadable?: boolean;
  subject: string | null;
  simplifiedText: string;
  keyTerms: string[];
  keyPoints: string[];
  analogies: string[];
  // Заполняется только при нескольких фото: сколько страниц реально удалось
  // прочитать — если меньше pagesTotal, объяснение построено не по всем фото.
  pagesRead?: number;
  pagesTotal?: number;
};

export type VerifyResult = {
  coveredIndices: number[];
};

export class ProviderError extends Error {
  constructor(
    public provider: string,
    message: string,
  ) {
    super(`[${provider}] ${message}`);
  }
}
