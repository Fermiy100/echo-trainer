// Рисованные иллюстрации в духе unDraw: органичные, слегка неровные формы,
// перекрашиваются в --accent, а не готовые иконки из библиотеки.

export function CaptureIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 168"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <ellipse cx="100" cy="150" rx="68" ry="9" fill="var(--color-border)" />

      {/* открытая книга */}
      <path
        d="M100 118 C86 104 58 100 34 108 C31 109 29 107 29 104 L30 58 C30 55 32 53 34 52 C58 44 86 48 100 62 Z"
        fill="var(--color-background-surface)"
        stroke="var(--color-border)"
        strokeWidth="2"
      />
      <path
        d="M100 118 C114 104 142 100 166 108 C169 109 171 107 171 104 L170 58 C170 55 168 53 166 52 C142 44 114 48 100 62 Z"
        fill="var(--color-background-surface)"
        stroke="var(--color-border)"
        strokeWidth="2"
      />
      <path d="M100 62 L100 118" stroke="var(--color-border)" strokeWidth="2" />
      <path
        d="M40 66 C54 61 70 63 82 72"
        stroke="var(--color-text-secondary)"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.5"
      />
      <path
        d="M40 80 C54 75 68 77 78 84"
        stroke="var(--color-text-secondary)"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.5"
      />
      <path
        d="M40 94 C52 90 62 91 70 96"
        stroke="var(--color-text-secondary)"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.5"
      />

      {/* телефон, наведённый на книгу */}
      <g transform="rotate(-9 140 60)">
        <rect
          x="118"
          y="16"
          width="46"
          height="70"
          rx="12"
          fill="var(--color-accent)"
        />
        <rect
          x="124"
          y="24"
          width="34"
          height="46"
          rx="4"
          fill="var(--color-on-accent)"
          opacity="0.16"
        />
        <circle cx="141" cy="78" r="4.5" fill="var(--color-on-accent)" opacity="0.5" />
      </g>

      {/* волны съёмки */}
      <path
        d="M108 30 C111 24 116 20 122 18"
        stroke="var(--color-accent)"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.55"
      />
      <path
        d="M100 22 C103 14 110 8 119 5"
        stroke="var(--color-accent)"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.35"
      />
    </svg>
  );
}

export function WelcomeIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 168"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <ellipse cx="82" cy="150" rx="60" ry="9" fill="var(--color-border)" />

      {/* открытая книга, из которой расходится эхо */}
      <path
        d="M82 118 C68 104 40 100 16 108 C13 109 11 107 11 104 L12 58 C12 55 14 53 16 52 C40 44 68 48 82 62 Z"
        fill="var(--color-background-surface)"
        stroke="var(--color-border)"
        strokeWidth="2"
      />
      <path
        d="M82 118 C96 104 124 100 148 108 C151 109 153 107 153 104 L152 58 C152 55 150 53 148 52 C124 44 96 48 82 62 Z"
        fill="var(--color-background-surface)"
        stroke="var(--color-border)"
        strokeWidth="2"
      />
      <path d="M82 62 L82 118" stroke="var(--color-border)" strokeWidth="2" />
      <path
        d="M22 66 C36 61 52 63 64 72"
        stroke="var(--color-text-secondary)"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.5"
      />
      <path
        d="M22 80 C36 75 50 77 60 84"
        stroke="var(--color-text-secondary)"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.5"
      />

      {/* эхо-кольца, расходящиеся от книги */}
      <path
        d="M120 76 C132 76 141 67 141 55"
        stroke="var(--color-accent)"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.75"
      />
      <path
        d="M126 88 C148 88 165 71 165 49"
        stroke="var(--color-accent)"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.5"
      />
      <path
        d="M132 100 C164 100 189 75 189 43"
        stroke="var(--color-accent)"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.3"
      />
    </svg>
  );
}

export function StreakFlame({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M16 2 C18 8 24 10 24 18 C24 24.6 20 29 15.5 29 C9.5 29 6 24.8 6 19.5 C6 15.8 8 13.6 9.2 11.8 C9.6 14 11 15 12.3 14.6 C11.3 10.6 12.6 6 16 2 Z"
        fill="var(--color-accent)"
      />
      <path
        d="M15.7 15.5 C17 18 19 18.6 19 21.8 C19 24.7 17.2 26.5 15.2 26.5 C12.8 26.5 11.2 24.6 11.2 22.3 C11.2 20.6 12.1 19.6 12.7 18.7 C13 20 13.8 20.3 14.3 19.9 C13.6 18 14.2 16.8 15.7 15.5 Z"
        fill="var(--color-on-accent)"
        opacity="0.35"
      />
    </svg>
  );
}

export function PagesStack({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="7" y="10" width="18" height="15" rx="3" fill="var(--color-border)" />
      <rect x="5" y="7" width="18" height="15" rx="3" fill="var(--color-background-surface)" stroke="var(--color-text-secondary)" strokeOpacity="0.25" strokeWidth="1.5" />
      <path d="M9 12 h10 M9 16 h10 M9 20 h6" stroke="var(--color-text-secondary)" strokeWidth="1.6" strokeLinecap="round" opacity="0.6" />
      <path d="M18.5 7 L23 11.5 L18.5 11.5 Z" fill="var(--color-accent)" opacity="0.85" />
    </svg>
  );
}

// Фирменный знак "Эхо" — три расходящихся кольца звука от точки. Один и тот
// же рисунок стоит в шапке (здесь, через CSS-токены темы), в фавиконе
// (app/icon.tsx) и в PWA-иконке (app/api/icon/route.tsx) — там координаты и
// цвета захардкожены как есть, потому что ImageResponse рендерится вне
// дерева темы и не видит CSS-переменные.
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="30" cy="70" r="6" fill="var(--color-accent)" />
      <path d="M 30 52 A 18 18 0 0 1 48 70" stroke="var(--color-accent)" strokeWidth="8" strokeLinecap="round" />
      <path
        d="M 30 34 A 36 36 0 0 1 66 70"
        stroke="var(--color-accent)"
        strokeWidth="8"
        strokeLinecap="round"
        opacity="0.72"
      />
      <path
        d="M 30 16 A 54 54 0 0 1 84 70"
        stroke="var(--color-accent)"
        strokeWidth="8"
        strokeLinecap="round"
        opacity="0.42"
      />
    </svg>
  );
}

// Иконки фич "Эхо Про" — тот же язык тонких линий на var(--color-accent), что
// и у остальных меток в этом файле, вместо родового набора "success"-галочек
// (см. чат про монетизацию: список должен выглядеть так, что за него хочется
// платить, а не как отчёт о статусах).
export function PhotosProMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="7" y="7" width="13" height="13" rx="2.5" fill="var(--color-background-surface)" stroke="var(--color-accent)" strokeWidth="1.8" />
      <path d="M10.5 4.5 H17.5" stroke="var(--color-accent)" strokeWidth="1.8" strokeLinecap="round" opacity="0.5" />
      <path d="M4.5 8 V15" stroke="var(--color-accent)" strokeWidth="1.8" strokeLinecap="round" opacity="0.5" />
      <path d="M10.5 16.5 L13 13.5 L15 15.5 L17 12.5" stroke="var(--color-accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function InfinityProMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M6.8 9.2 C4.4 9.6 4.6 14.6 7.1 14.8 C9.4 15 10.6 9 13 9 C15.4 9 17 9.4 17.2 12 C17 9.4 15.4 9 13 9 C10.6 9 9.4 15 7.1 14.8 C4.6 14.6 4.4 9.6 6.8 9.2 Z"
        stroke="var(--color-accent)"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function RewordProMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 8.5 C5 6.6 6.6 5 8.5 5 H14" stroke="var(--color-accent)" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 2.5 L14.5 5 L12 7.5" stroke="var(--color-accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 15.5 C19 17.4 17.4 19 15.5 19 H10" stroke="var(--color-accent)" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 21.5 L9.5 19 L12 16.5" stroke="var(--color-accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function WeakSpotProMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="8" stroke="var(--color-accent)" strokeWidth="1.8" opacity="0.35" />
      <circle cx="12" cy="12" r="4.5" stroke="var(--color-accent)" strokeWidth="1.8" opacity="0.65" />
      <circle cx="12" cy="12" r="1.6" fill="var(--color-accent)" />
    </svg>
  );
}

export function ParentProMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="9" cy="7.5" r="2.6" stroke="var(--color-accent)" strokeWidth="1.8" />
      <path d="M4 19 C4 15.5 6.2 13.5 9 13.5 C11.8 13.5 14 15.5 14 19" stroke="var(--color-accent)" strokeWidth="1.8" strokeLinecap="round" />
      <path
        d="M16.3 9.2 C16.9 8.4 18.4 8.6 18.6 9.8 C18.8 11 17.4 12.2 16.3 13 C15.2 12.2 13.8 11 14 9.8 C14.2 8.6 15.7 8.4 16.3 9.2 Z"
        fill="var(--color-accent)"
      />
    </svg>
  );
}

export function HomeMark({ className, active }: { className?: string; active?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M4 12.5 L11.3 5.7 C11.7 5.3 12.3 5.3 12.7 5.7 L20 12.5"
        stroke={active ? "var(--color-accent)" : "var(--color-text-secondary)"}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 11 V18.5 C6.5 19.3 7.2 20 8 20 H10.5 V15.5 H13.5 V20 H16 C16.8 20 17.5 19.3 17.5 18.5 V11"
        fill={active ? "var(--color-accent)" : "none"}
        fillOpacity={active ? 0.14 : 0}
        stroke={active ? "var(--color-accent)" : "var(--color-text-secondary)"}
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function HistoryMark({ className, active }: { className?: string; active?: boolean }) {
  const c = active ? "var(--color-accent)" : "var(--color-text-secondary)";
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 4.5 C16.7 4.5 20.5 8.3 20.5 13 C20.5 17.7 16.7 21.2 12 21.2 C8.4 21.2 5.3 19 4 15.9" stroke={c} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M4 18.5 L4 15 L7.5 15.4" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 9 V13.4 L15 15.2" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AboutMark({ className, active }: { className?: string; active?: boolean }) {
  const c = active ? "var(--color-accent)" : "var(--color-text-secondary)";
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 3.5 C14.8 3.8 17 4.6 18.7 6.4 C18.9 8.4 18.9 15.6 18.7 17.6 C17 19.4 14.8 20.2 12 20.5 C9.2 20.2 7 19.4 5.3 17.6 C5.1 15.6 5.1 8.4 5.3 6.4 C7 4.6 9.2 3.8 12 3.5 Z"
        stroke={c}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="9" r="1.3" fill={c} />
      <path d="M12 12 V16.3" stroke={c} strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}
