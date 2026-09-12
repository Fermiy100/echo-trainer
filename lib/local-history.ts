// История без настоящей базы данных: Neon (DATABASE_URL) не подключён, поэтому
// /api/history всегда честно возвращал пустоту — не баг, а отсутствие бэкенда.
// Пока БД не настроена, храним попытки в localStorage на этом устройстве —
// не синхронизируется между устройствами, но реально работает прямо сейчас.
export type LocalAttempt = {
  id: string;
  subject: string;
  covered_count: number;
  total_count: number;
  created_at: string;
};

const KEY = "echo:local-history";
const MAX_ENTRIES = 200;

function readAll(): LocalAttempt[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as LocalAttempt[]) : [];
  } catch (err) {
    console.error("local-history: не удалось прочитать", err);
    return [];
  }
}

export function recordLocalAttempt(entry: { subject: string; covered_count: number; total_count: number }) {
  if (typeof window === "undefined") return;
  try {
    const all = readAll();
    all.unshift({
      ...entry,
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      created_at: new Date().toISOString(),
    });
    localStorage.setItem(KEY, JSON.stringify(all.slice(0, MAX_ENTRIES)));
  } catch (err) {
    console.error("local-history: не удалось сохранить", err);
  }
}

export function getLocalHistory(limit = 20): LocalAttempt[] {
  return readAll().slice(0, limit);
}

export function getLocalTotalParagraphs(): number {
  return readAll().length;
}

// Та же логика подсчёта стрика, что и в lib/db.ts computeStreakDays — считает
// дни подряд назад от сегодня (или вчера, если сегодня ещё не занимался).
export function computeLocalStreakDays(): number {
  const dates = readAll().map((a) => a.created_at);
  const days = new Set(dates.map((d) => new Date(d).toISOString().slice(0, 10)));
  const cursor = new Date();
  cursor.setUTCHours(0, 0, 0, 0);

  if (!days.has(cursor.toISOString().slice(0, 10))) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  let streak = 0;
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}
