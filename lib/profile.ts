// Профиль ученика с онбординга — используется для персонализации аналогий
// (см. 01-PRD.md: «Персонализация примеров-аналогий по интересам ученика»).
const INTEREST_KEY = "echo:interest";

export function setInterest(interest: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(INTEREST_KEY, interest);
}

export function getInterest(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(INTEREST_KEY);
}
