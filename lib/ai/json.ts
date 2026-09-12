// Модели не всегда возвращают чистый JSON (иногда оборачивают в ```json ... ```
// или добавляют пояснение вокруг). Достаём первый валидный JSON-объект из текста.
export function extractJson<T>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("Ответ модели не содержит JSON-объект");
  }
  return JSON.parse(candidate.slice(start, end + 1)) as T;
}
