// Передаём результат /api/explain между /capture и /explain/[id] без БД —
// это одноразовый экранный переход, а не то, что нужно хранить постоянно.
// Постоянная история параграфов живёт в Neon (см. lib/db.ts).
import type { Paragraph } from "./mock-data";

function key(id: string) {
  return `echo:paragraph:${id}`;
}

export function storeParagraph(id: string, paragraph: Omit<Paragraph, "id"> & { id?: string }) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(key(id), JSON.stringify({ ...paragraph, id }));
  } catch (err) {
    console.error("paragraph-store: не удалось сохранить", err);
  }
}

export function readParagraph(id: string): Paragraph | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(key(id));
    return raw ? (JSON.parse(raw) as Paragraph) : null;
  } catch (err) {
    console.error("paragraph-store: не удалось прочитать", err);
    return null;
  }
}
