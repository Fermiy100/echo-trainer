"use client";

// Браузерные голоса сильно различаются по качеству: встроенный компактный голос ОС
// часто звучит монотонно и хуже расставляет ударения, чем сетевые голоса (Google/Microsoft).
// Пытаемся выбрать лучший доступный русский голос вместо того, что браузер поставит по умолчанию.
function pickBestRussianVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const ru = voices.filter((v) => v.lang.toLowerCase().startsWith("ru"));
  if (ru.length === 0) return null;
  const remote = ru.find((v) => !v.localService);
  return remote ?? ru[0];
}

export function getRussianVoice(): Promise<SpeechSynthesisVoice | null> {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return Promise.resolve(null);
  const existing = window.speechSynthesis.getVoices();
  if (existing.length > 0) return Promise.resolve(pickBestRussianVoice(existing));

  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      window.speechSynthesis.removeEventListener("voiceschanged", onChange);
      resolve(pickBestRussianVoice(window.speechSynthesis.getVoices()));
    };
    const onChange = () => finish();
    window.speechSynthesis.addEventListener("voiceschanged", onChange);
    // Часть браузеров не присылает voiceschanged, если список уже готов — подстрахуемся.
    setTimeout(finish, 1000);
  });
}
