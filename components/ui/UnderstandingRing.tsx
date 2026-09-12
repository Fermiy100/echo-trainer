"use client";

import { useEffect, useState } from "react";

const SIZE = 160;
const STROKE = 12;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function UnderstandingRing({ covered, total }: { covered: number; total: number }) {
  const targetFraction = total > 0 ? covered / total : 0;
  const [fraction, setFraction] = useState(0);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setFraction(targetFraction));
    return () => cancelAnimationFrame(frame);
  }, [targetFraction]);

  const offset = CIRCUMFERENCE * (1 - fraction);

  return (
    <div style={{ position: "relative", width: SIZE, height: SIZE }}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={STROKE}
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          style={{
            transition: "stroke-dashoffset 600ms cubic-bezier(0.2, 0.8, 0.2, 1)",
          }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-family-heading)",
            fontWeight: "var(--font-weight-bold)",
            fontSize: "32px",
            color: "var(--color-text-primary)",
          }}
        >
          {covered} из {total}
        </span>
        <span
          style={{
            fontFamily: "var(--font-family-body)",
            fontSize: "13px",
            color: "var(--color-text-secondary)",
          }}
        >
          ключевых идей
        </span>
      </div>
    </div>
  );
}
