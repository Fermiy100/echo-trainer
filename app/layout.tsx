import type { Metadata, Viewport } from "next";
import { Theme } from "@astryxdesign/core";
import { echoTheme } from "../echo";
import "@astryxdesign/core/reset.css";
import "@astryxdesign/core/astryx.css";
import "../echo.css";

export const metadata: Metadata = {
  title: "Эхо — тренажёр пересказа",
  description:
    "Фотографируешь параграф, слышишь простое объяснение, пересказываешь вслух — и получаешь честный ответ, готов ли ты отвечать у доски.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#fff9f5",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Nunito:wght@700;800&family=PT+Sans:wght@400;700&display=swap"
        />
      </head>
      <body
        style={{
          background: "var(--color-background-body)",
          color: "var(--color-text-primary)",
          minHeight: "100dvh",
        }}
      >
        <Theme theme={echoTheme} mode="light">
          {children}
        </Theme>
      </body>
    </html>
  );
}
