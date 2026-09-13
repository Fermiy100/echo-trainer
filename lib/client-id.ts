// Анонимный id ученика для группировки истории — без логина/аккаунта,
// просто стабильный идентификатор в этом браузере. После входа через Яндекс
// (см. app/api/auth/yandex) тот же id становится "yx:<id из Яндекса>" —
// стабильным между устройствами, а не только в этом браузере.
const KEY = "echo:student-id";
const NAME_KEY = "echo:display-name";

export function getStudentId(): string {
  if (typeof window === "undefined") return "server";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}

export function setStudentId(id: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, id);
}

export function isYandexLinked(): boolean {
  return getStudentId().startsWith("yx:");
}

export function getDisplayName(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(NAME_KEY);
}

export function setDisplayName(name: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(NAME_KEY, name);
}

// Выход — не удаляет данные из базы (они остаются на аккаунте в Яндексе),
// просто отвязывает ЭТО устройство: дальше оно снова анонимное, со своим
// новым локальным id, как до входа.
export function logout() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(NAME_KEY);
  localStorage.setItem(KEY, crypto.randomUUID());
}
