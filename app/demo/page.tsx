import { redirect } from "next/navigation";

// Демо-режим для жюри: тот же сценарий, но без реального похода в сеть —
// параграф резолвится из lib/mock-data.ts независимо от id (см. 02-ARCHITECTURE.md,
// офлайн-фоллбэк из public/demo-data подключается на Фазе 3).
export default function DemoPage() {
  redirect("/explain/demo-1");
}
