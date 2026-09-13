import { NextRequest, NextResponse } from "next/server";

// Шаг 2: Яндекс вернул временный код — меняем его на токен, а токен на
// данные аккаунта (id, имя). Сам id ученика в приложении становится
// "yx:<id из Яндекса>" — стабильным между устройствами, а не только в
// localStorage одного браузера, как было раньше (см. lib/client-id.ts).
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const savedState = req.cookies.get("echo_oauth_state")?.value;
  const isSecure = process.env.NODE_ENV === "production";

  if (!code || !state || !savedState || state !== savedState) {
    return NextResponse.redirect(new URL("/auth/error?reason=state", req.url));
  }

  const clientId = process.env.YANDEX_CLIENT_ID;
  const clientSecret = process.env.YANDEX_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/auth/error?reason=config", req.url));
  }

  const redirectUri = `${req.nextUrl.origin}/api/auth/yandex/callback`;

  try {
    const tokenRes = await fetch("https://oauth.yandex.ru/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
    });
    if (!tokenRes.ok) throw new Error(`token HTTP ${tokenRes.status}: ${await tokenRes.text()}`);
    const tokenData = await tokenRes.json();

    const infoRes = await fetch("https://login.yandex.ru/info?format=json", {
      headers: { Authorization: `OAuth ${tokenData.access_token}` },
    });
    if (!infoRes.ok) throw new Error(`info HTTP ${infoRes.status}`);
    const info = await infoRes.json();

    const studentId = `yx:${info.id}`;
    const displayName: string = info.display_name || info.real_name || info.first_name || "";

    // Короткоживущие, читаемые с клиента куки — просто способ передать
    // новый id со стороны сервера в localStorage браузера (см.
    // app/auth/welcome/page.tsx), а не постоянная сессия.
    const res = NextResponse.redirect(new URL("/auth/welcome", req.url));
    res.cookies.set("echo_oauth_state", "", { maxAge: 0, path: "/" });
    res.cookies.set("echo_sid_transfer", studentId, {
      httpOnly: false,
      secure: isSecure,
      sameSite: "lax",
      maxAge: 60,
      path: "/",
    });
    if (displayName) {
      res.cookies.set("echo_name_transfer", displayName, {
        httpOnly: false,
        secure: isSecure,
        sameSite: "lax",
        maxAge: 60,
        path: "/",
      });
    }
    return res;
  } catch (err) {
    console.error("auth/yandex/callback: не удалось завершить вход", err);
    return NextResponse.redirect(new URL("/auth/error?reason=exchange", req.url));
  }
}
