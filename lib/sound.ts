"use client";

// Короткие "дофаминовые" сигналы через Web Audio API — без аудиофайлов,
// работает везде, где есть браузер.
function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  return new Ctor();
}

function playTone(frequency: number, durationMs: number, delayMs = 0) {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const start = ctx.currentTime + delayMs / 1000;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.001, start);
    gain.gain.exponentialRampToValueAtTime(0.2, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, start + durationMs / 1000);
    osc.start(start);
    osc.stop(start + durationMs / 1000 + 0.02);
    osc.onended = () => ctx.close();
  } catch (err) {
    console.error("sound: не удалось воспроизвести", err);
  }
}

export function playCorrectSound() {
  // Короткий восходящий "дзинь" — два тона подряд.
  playTone(660, 100);
  playTone(880, 140, 90);
}

export function playIncorrectSound() {
  playTone(180, 220);
}
