// Статус "Эхо Про" — пока без настоящей оплаты (нет юрлица/эквайринга у
// школьного проекта на этом этапе), поэтому активация честно демонстрационная:
// один и тот же код на всех, чётко подписанный как демо в интерфейсе. Логика
// квот и разблокировки функций — настоящая, реальный платёжный шлюз можно
// подключить позже, просто заменив activatePro на вызов оплаты.
const PRO_KEY = "echo:pro";
export const DEMO_PRO_CODE = "ЭХОПРО";

export function isPro(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(PRO_KEY) === "1";
}

export function activatePro(code: string): boolean {
  if (typeof window === "undefined") return false;
  if (code.trim().toUpperCase() !== DEMO_PRO_CODE) return false;
  localStorage.setItem(PRO_KEY, "1");
  return true;
}

export function deactivatePro() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PRO_KEY);
}

// Бесплатные лимиты на день (сбрасываются в полночь по местному времени
// устройства — точность до часа здесь не важна, это мягкий, не карательный
// лимит). Про снимает лимит полностью, но не бесконечно — см. FREE_ASK_LIMIT
// комментарий на слайде экономики: даже у "безлимита" есть разумный потолок,
// чтобы 1% сверхактивных не съел маржу с остальных.
const FREE_ASK_LIMIT_PER_PARAGRAPH = 3;
const FREE_REWORD_LIMIT_PER_PARAGRAPH = 1;
const PRO_ASK_DAILY_CAP = 40;

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function readCounter(key: string): number {
  if (typeof window === "undefined") return 0;
  try {
    return Number(localStorage.getItem(key) ?? "0") || 0;
  } catch {
    return 0;
  }
}

function bumpCounter(key: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, String(readCounter(key) + 1));
  } catch {
    // localStorage недоступен (приватный режим и т.п.) — тихо не считаем,
    // не блокируем функцию из-за невозможности вести счётчик.
  }
}

export type QuotaCheck = { allowed: boolean; remaining: number | "∞" };

export function checkAskQuota(paragraphId: string): QuotaCheck {
  if (isPro()) {
    const used = readCounter(`echo:ask-count:${todayKey()}`);
    return { allowed: used < PRO_ASK_DAILY_CAP, remaining: Math.max(0, PRO_ASK_DAILY_CAP - used) };
  }
  const used = readCounter(`echo:ask-count:${paragraphId}`);
  return { allowed: used < FREE_ASK_LIMIT_PER_PARAGRAPH, remaining: Math.max(0, FREE_ASK_LIMIT_PER_PARAGRAPH - used) };
}

export function recordAsk(paragraphId: string) {
  bumpCounter(`echo:ask-count:${paragraphId}`);
  bumpCounter(`echo:ask-count:${todayKey()}`);
}

export function checkRewordQuota(paragraphId: string): QuotaCheck {
  if (isPro()) return { allowed: true, remaining: "∞" };
  const used = readCounter(`echo:reword-count:${paragraphId}`);
  return {
    allowed: used < FREE_REWORD_LIMIT_PER_PARAGRAPH,
    remaining: Math.max(0, FREE_REWORD_LIMIT_PER_PARAGRAPH - used),
  };
}

export function recordReword(paragraphId: string) {
  bumpCounter(`echo:reword-count:${paragraphId}`);
}
