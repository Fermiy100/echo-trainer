"use client";

import { useState } from "react";
import styles from "./HintChip.module.css";

// Три уровня подсказки на один и тот же компонент:
// - "visible": весь текст сразу виден, не кликабельно (первая попытка).
// - "peekable": скрыто, тап открывает следующее слово по одному (повторная
//   попытка — "угасающая" подсказка, не отдаёт весь ответ сразу).
// - карточка вообще не рендерится в "боевом" режиме — см. retell/[id]/page.tsx.
export function HintChip({ text, peekable }: { text: string; peekable: boolean }) {
  const words = text.split(" ");
  const [revealedCount, setRevealedCount] = useState(peekable ? 0 : words.length);
  const isFullyRevealed = revealedCount >= words.length;

  if (!peekable) {
    return (
      <div className={styles.chip} data-variant="visible">
        <span className={styles.text}>{text}</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      className={styles.chip}
      data-variant="peekable"
      onClick={() => setRevealedCount((c) => Math.min(c + 1, words.length))}
      disabled={isFullyRevealed}
      aria-label={revealedCount === 0 ? "Скрытая подсказка, нажми, чтобы приоткрыть слово" : text}
    >
      {revealedCount === 0 ? (
        <span className={styles.hiddenHint}>Нажми, чтобы подсмотреть слово</span>
      ) : (
        <span className={styles.text}>
          {words.slice(0, revealedCount).join(" ")}
          {!isFullyRevealed && <span className={styles.ellipsis}> …</span>}
        </span>
      )}
    </button>
  );
}
