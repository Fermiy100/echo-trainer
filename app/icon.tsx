import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
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
          border: "1px solid rgba(36,31,25,0.08)",
          borderRadius: 16,
        }}
      >
        {/* Три расходящихся кольца звука от точки — фирменный знак "эхо",
            выбранный из пяти черновиков (см. чат). Фон — цвет фона сайта,
            кольца — фирменный оранжевый, как и в шапке (см. LogoMark). */}
        <svg width="40" height="40" viewBox="0 0 100 100" fill="none">
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
    { ...size },
  );
}
