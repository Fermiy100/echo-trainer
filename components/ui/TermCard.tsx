"use client";

import { useState } from "react";
import styles from "./TermCard.module.css";

export function TermCard({ term, definition, example }: { term: string; definition: string; example?: string }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const backLabel = example ? `${definition} Например: ${example}` : definition;

  return (
    <button
      type="button"
      className={styles.card}
      onClick={() => setIsFlipped((v) => !v)}
      aria-pressed={isFlipped}
      aria-label={isFlipped ? `${term}: ${backLabel}. Нажми, чтобы скрыть` : `${term}. Нажми, чтобы увидеть определение`}
    >
      <div className={styles.inner} data-flipped={isFlipped}>
        <div className={styles.face}>
          <span className={styles.term}>{term}</span>
          <span className={styles.hint}>Нажми, чтобы узнать</span>
        </div>
        <div className={styles.faceBack}>
          <span className={styles.definition}>{definition}</span>
          {example && <span className={styles.example}>Например: {example}</span>}
        </div>
      </div>
    </button>
  );
}
