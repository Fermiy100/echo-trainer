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
  // Раньше писали только счётчик (сколько идей из скольких) — этого хватало
  // для "3 из 4" на экране результата, но не хватает для карты слабых мест:
  // нужно знать, КАКИЕ именно идеи не назвали, а не только сколько.
  await sql`ALTER TABLE attempts ADD COLUMN IF NOT EXISTS missed_points JSONB NOT NULL DEFAULT '[]'::jsonb`;
  // Код для родителя — без аккаунтов и паролей: короткий случайный код на
  // ученика, по которому открывается тот же прогресс в read-only виде.
  await sql`
    CREATE TABLE IF NOT EXISTS parent_codes (
      student_id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
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
  missed_points?: string[];
};

export async function saveAttempt(
  studentId: string,
  subject: string,
  coveredCount: number,
  totalCount: number,
  missedPoints: string[] = [],
) {
  if (!sql) return null;
  await ensureSchema();
  const [row] = await sql`
    INSERT INTO attempts (student_id, subject, covered_count, total_count, missed_points)
    VALUES (${studentId}, ${subject}, ${coveredCount}, ${totalCount}, ${JSON.stringify(missedPoints)}::jsonb)
    RETURNING id, subject, covered_count, total_count, created_at, missed_points
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

export type WeakSpot = {
  point: string;
  subject: string;
  missedCount: number;
  lastMissedAt: string;
};

// Карта слабых мест (питч про "Эхо Про" и экзаменационный режим): не новая
// система, а агрегат того же missed_points, который уже пишет saveAttempt —
// сколько раз каждая конкретная мысль оставалась непересказанной, по всем
// предметам сразу, а не только по последнему параграфу.
export async function getWeakSpots(studentId: string, limit = 20): Promise<WeakSpot[] | null> {
  if (!sql) return null;
  await ensureSchema();
  const rows = await sql`
    SELECT point, subject, COUNT(*)::int AS missed_count, MAX(created_at) AS last_missed_at
    FROM attempts, jsonb_array_elements_text(missed_points) AS point
    WHERE student_id = ${studentId}
    GROUP BY point, subject
    ORDER BY missed_count DESC, last_missed_at DESC
    LIMIT ${limit}
  `;
  return rows.map((r) => ({
    point: r.point as string,
    subject: r.subject as string,
    missedCount: r.missed_count as number,
    lastMissedAt: r.last_missed_at as string,
  }));
}

function generateCode(): string {
  // Без похожих на вид символов (0/O, 1/I) — код диктуют родителю вслух или
  // присылают скриншотом, ошибка при вводе не должна быть о буковку "О".
  const alphabet = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < 6; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)];
  return code;
}

export async function getOrCreateParentCode(studentId: string): Promise<string | null> {
  if (!sql) return null;
  await ensureSchema();
  const [existing] = await sql`SELECT code FROM parent_codes WHERE student_id = ${studentId}`;
  if (existing) return existing.code as string;

  // ON CONFLICT DO NOTHING вместо "проверил, потом вставил": между SELECT
  // выше и INSERT здесь тот же studentId мог прилететь вторым параллельным
  // запросом (например, React StrictMode в деве честно дважды вызывает
  // эффект) — без атомарного upsert второй запрос падал с ошибкой уникальности
  // student_id и никогда не мог "попробовать другой код", потому что дело не
  // в code, а в том, что строка для этого studentId уже есть.
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode();
    const [inserted] = await sql`
      INSERT INTO parent_codes (student_id, code) VALUES (${studentId}, ${code})
      ON CONFLICT (student_id) DO NOTHING
      RETURNING code
    `;
    if (inserted) return inserted.code as string;

    // Конфликт — либо по student_id (кто-то уже создал код параллельно,
    // читаем его), либо по code (совпадение, пробуем сгенерировать другой).
    const [row] = await sql`SELECT code FROM parent_codes WHERE student_id = ${studentId}`;
    if (row) return row.code as string;
  }
  return null;
}

export async function getStudentIdByParentCode(code: string): Promise<string | null> {
  if (!sql) return null;
  await ensureSchema();
  const [row] = await sql`SELECT student_id FROM parent_codes WHERE code = ${code.toUpperCase()}`;
  return (row?.student_id as string) ?? null;
}
