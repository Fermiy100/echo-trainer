// Анонимный id ученика для группировки истории — без логина/аккаунта,
// просто стабильный идентификатор в этом браузере.
export function getStudentId(): string {
  if (typeof window === "undefined") return "server";
  const key = "echo:student-id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}
