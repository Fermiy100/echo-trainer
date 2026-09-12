import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

// Один генератор иконки на все размеры PWA-манифеста — не плодим PNG-файлы руками.
export async function GET(req: NextRequest) {
  const size = Number(req.nextUrl.searchParams.get("size")) || 512;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FFF9F5",
        }}
      >
        {/* То же "эхо"-кольцо, что и в app/icon.tsx (фавикон) и LogoMark
            (шапка сайта) — единая иконка везде, см. чат про выбор дизайна. */}
        <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 100 100" fill="none">
          <circle cx="30" cy="70" r="6" fill="#FF6B4A" />
          <path d="M 30 52 A 18 18 0 0 1 48 70" stroke="#FF6B4A" strokeWidth="8" strokeLinecap="round" fill="none" />
          <path
            d="M 30 34 A 36 36 0 0 1 66 70"
            stroke="#FF6B4A"
            strokeWidth="8"
            strokeLinecap="round"
            opacity="0.72"
            fill="none"
          />
          <path
            d="M 30 16 A 54 54 0 0 1 84 70"
            stroke="#FF6B4A"
            strokeWidth="8"
            strokeLinecap="round"
            opacity="0.42"
            fill="none"
          />
        </svg>
      </div>
    ),
    { width: size, height: size },
  );
}
