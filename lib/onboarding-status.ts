// Онбординг проходят один раз (см. PRD 01-PRD.md, раздел «Онбординг»).
const KEY = "echo:onboarded";

export function hasOnboarded(): boolean {
  if (typeof window === "undefined") return true; // на сервере не редиректим — решает клиент
  return localStorage.getItem(KEY) === "1";
}

export function markOnboarded() {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, "1");
}
