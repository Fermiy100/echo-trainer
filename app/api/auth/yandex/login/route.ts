import { NextRequest, NextResponse } from "next/server";

// Шаг 1 входа через Яндекс: отправляем ученика на страницу авторизации
// Яндекса со случайным "state" — без него запрос в callback мог бы прийти
// от кого угодно (классическая CSRF-дыра в OAuth), не обязательно от того,
// кто реально запускал вход с этого браузера.
export async function GET(req: NextRequest) {
  const clientId = process.env.YANDEX_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(new URL("/auth/error?reason=config", req.url));
  }

  const redirectUri = `${req.nextUrl.origin}/api/auth/yandex/callback`;
  const state = crypto.randomUUID();

  const authorizeUrl = new URL("https://oauth.yandex.ru/authorize");
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("state", state);

  const res = NextResponse.redirect(authorizeUrl);
  res.cookies.set("echo_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return res;
}
