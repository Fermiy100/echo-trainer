# Как получить ключ NVIDIA NIM

NVIDIA NIM — основной провайдер в проекте (см. [02-ARCHITECTURE.md](02-ARCHITECTURE.md)):
бесплатно, 40 запросов/мин, этого хватает на целый класс. Ключ нужен один, использует
его код в [lib/ai/nim.ts](lib/ai/nim.ts).

## 1. Регистрация

1. Открой **build.nvidia.com**.
2. Зарегистрируйся — можно через Google/GitHub-аккаунт, без банковской карты.
3. После входа попадёшь в каталог моделей (NGC Catalog / API Catalog).

## 2. Выпустить API-ключ

1. В правом верхнем углу — иконка профиля → **API Keys** (или **Get API Key** прямо на
   карточке любой модели).
2. **Generate API Key** (или **Generate New Key**).
3. Ключ показывается **один раз** — сразу скопируй, начинается с `nvapi-...`.
4. Если потерял — просто сгенерируй новый, старый можно отозвать там же.

## 3. Куда вставить ключ

В файле `.env.local` в корне проекта (скопируй из [.env.local.example](.env.local.example),
если ещё не создан):

```
NVIDIA_NIM_API_KEY=nvapi-твой-ключ-сюда
```

На Vercel — то же самое через **Settings → Environment Variables** после первого деплоя.

## 4. Выбрать модели

В `.env.local` уже стоят проверенные рабочие значения:

```
NVIDIA_NIM_VISION_MODEL=meta/llama-3.2-11b-vision-instruct
NVIDIA_NIM_TEXT_MODEL=meta/llama-3.2-11b-vision-instruct
```

**Важно:** каталог моделей на сайте build.nvidia.com показывает намного больше моделей,
чем реально доступно бесплатному аккаунту — большинство отдельных текстовых моделей
(deepseek-v3.x/v4, llama-3.1/3.3-instruct, mistral, gemma) на практике отвечают
`404 Not Found for account`. Vision-модель отвечает и на чисто текстовые запросы (без
картинки), поэтому она используется для обеих задач — это подтверждено прямыми
запросами к API с реальным ключом.

Если хочешь свериться сам:

1. Спроси список доступных именно твоему аккаунту моделей:
   ```bash
   curl -s https://integrate.api.nvidia.com/v1/models \
     -H "Authorization: Bearer $NVIDIA_NIM_API_KEY" | less
   ```
2. Каталог на сайте (карточка модели → вкладка **API**) показывает *существующие* модели,
   но не гарантирует доступ твоему конкретному ключу — проверяй curl'ом, а не только сайтом.

## 5. Проверить, что ключ работает

Локально, при запущенном `npm run dev`:

```bash
curl -s -X POST http://localhost:3000/api/explain \
  -H "Content-Type: application/json" \
  -d '{"imageDataUrl":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="}'
```

Смотри на поле `"source"` в ответе:

- `"source": "nim"` — ключ работает, спросил настоящую модель.
- `"source": "offline-example"` — ключ не подключился (не задан, неверный, лимит,
  модель не найдена) — код упал в офлайн-фоллбэк, как и задумано, но живой NIM не отвечает.
  Проверь `.env.local` и логи `npm run dev` в терминале — там будет причина
  (`console.error("explain: NIM недоступен...")`).

## Бесплатный лимит

40 запросов в минуту на аккаунт — за счёт `lib/cache.ts` (Upstash) одинаковый параграф
не спрашивается у NIM повторно, так что для пилота на 15–20 человек лимита с запасом
хватит. Если во время пилота лимит всё же упрётся — второй уровень (DeepSeek, платный)
подключается тем же способом через `DEEPSEEK_API_KEY`, см. [.env.local.example](.env.local.example).
