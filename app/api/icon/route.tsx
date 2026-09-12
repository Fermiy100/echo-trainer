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
          background: "#FF6B4A",
        }}
      >
        <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 38 38" fill="none">
          <path d="M8 30 C8 20 8 12 18 8" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" fill="none" />
          <path
            d="M16 30 C16 23 17 18 24 15"
            stroke="#FFFFFF"
            strokeWidth="4"
            strokeLinecap="round"
            opacity="0.7"
            fill="none"
          />
          <path
            d="M24 30 C24 26 25 23 30 21"
            stroke="#FFFFFF"
            strokeWidth="4"
            strokeLinecap="round"
            opacity="0.45"
            fill="none"
          />
        </svg>
      </div>
    ),
    { width: size, height: size },
  );
}
