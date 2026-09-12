// Neon Postgres — история параграфов и агрегированная статистика пилота
// (см. 02-ARCHITECTURE.md). Без DATABASE_URL все функции возвращают null,
// и вызывающий код показывает моковые данные вместо падения страницы.
import { neon } from "@neondatabase/serverless";

const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;

let schemaReady = false;

async function ensureSchema() {
  if (!sql || schemaReady) return;
  await sql`
    CREATE TABLE IF NOT EXISTS attempts (
      id SERIAL PRIMARY KEY,
      student_id TEXT NOT NULL DEFAULT 'anon',
      subject TEXT NOT NULL,
      covered_count INT NOT NULL,
      total_count INT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  schemaReady = true;
}

export type AttemptRow = {
  id: number;
  subject: string;
  covered_count: number;
  total_count: number;
  created_at: string;
};

export async function saveAttempt(studentId: string, subject: string, coveredCount: number, totalCount: number) {
  if (!sql) return null;
  await ensureSchema();
  const [row] = await sql`
    INSERT INTO attempts (student_id, subject, covered_count, total_count)
    VALUES (${studentId}, ${subject}, ${coveredCount}, ${totalCount})
    RETURNING id, subject, covered_count, total_count, created_at
  `;
  return row as AttemptRow;
}

export async function getHistory(studentId: string, limit = 20): Promise<AttemptRow[] | null> {
  if (!sql) return null;
  await ensureSchema();
  const rows = await sql`
    SELECT id, subject, covered_count, total_count, created_at
    FROM attempts
    WHERE student_id = ${studentId}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
  return rows as AttemptRow[];
}

/** Считает дни подряд с хотя бы одной попыткой, назад от сегодня (или вчера,
 *  если сегодня ещё не занимался — стрик не должен обнуляться раньше полуночи). */
function computeStreakDays(dates: string[]): number {
  const days = new Set(dates.map((d) => new Date(d).toISOString().slice(0, 10)));
  const cursor = new Date();
  cursor.setUTCHours(0, 0, 0, 0);

  if (!days.has(cursor.toISOString().slice(0, 10))) {
    cursor.setUTCDate(cursor.getUTCDate() - 1); // ещё не заходил сегодня — начинаем считать со вчера
  }

  let streak = 0;
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

export type StudentSummary = {
  entries: AttemptRow[];
  totalParagraphs: number;
  streakDays: number;
};

export async function getStudentSummary(studentId: string): Promise<StudentSummary | null> {
  if (!sql) return null;
  await ensureSchema();
  const entries = (await getHistory(studentId, 20)) ?? [];
  const allDates = await sql`
    SELECT created_at FROM attempts WHERE student_id = ${studentId}
  `;
  return {
    entries,
    totalParagraphs: allDates.length,
    streakDays: computeStreakDays(allDates.map((r) => r.created_at as string)),
  };
}

export type PilotStats = {
  uniqueStudents: number;
  totalParagraphs: number;
  averageStreakDays: number;
};

export async function getPilotStats(): Promise<PilotStats | null> {
  if (!sql) return null;
  await ensureSchema();
  const [row] = await sql`
    SELECT
      COUNT(DISTINCT student_id)::int AS unique_students,
      COUNT(*)::int AS total_paragraphs
    FROM attempts
  `;
  return {
    uniqueStudents: row?.unique_students ?? 0,
    totalParagraphs: row?.total_paragraphs ?? 0,
    averageStreakDays: 0,
  };
}
