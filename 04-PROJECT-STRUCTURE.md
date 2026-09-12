# Структура проекта — «Эхо»

```
echo-trainer/
├── docs/                          # этот комплект документации — Claude Code читает перед стартом
│   ├── 00-README.md
│   ├── 01-PRD.md
│   ├── 02-ARCHITECTURE.md
│   ├── 03-DESIGN-SYSTEM.md
│   └── 04-PROJECT-STRUCTURE.md
│
├── app/
│   ├── layout.tsx                 # корневой layout, подключение шрифтов, manifest
│   ├── page.tsx                   # главный экран
│   ├── onboarding/page.tsx        # три шага онбординга
│   ├── capture/page.tsx           # съёмка страницы
│   ├── explain/[id]/page.tsx      # экран объяснения
│   ├── retell/[id]/page.tsx       # запись пересказа
│   ├── review/[id]/page.tsx       # экран проверки
│   ├── history/page.tsx           # история и прогресс
│   ├── about/page.tsx             # «О проекте»
│   ├── demo/page.tsx              # демо-режим для жюри — офлайн, без сети
│   │
│   └── api/
│       ├── explain/route.ts       # фото → упрощение + объяснение (NIM → DeepSeek fallback)
│       ├── verify/route.ts        # пересказ → сверка с оригиналом
│       ├── transcribe/route.ts    # аудио → текст (Groq Whisper, только для demo-режима)
│       └── stats/route.ts         # агрегированная статистика пилота для страницы «О проекте»
│
├── components/
│   ├── ui/                        # кнопки, карточки, теги — базовые примитивы дизайн-системы
│   ├── RecordButton.tsx           # кнопка микрофона + waveform-анимация
│   ├── UnderstandingRing.tsx      # кольцевой прогресс «сколько идей назвал»
│   └── IllustrationBlock.tsx      # обёртка для unDraw-иллюстраций с текущим акцентным цветом
│
├── lib/
│   ├── ai/
│   │   ├── nim.ts                 # клиент NVIDIA NIM (vision + текст)
│   │   ├── deepseek.ts            # платный fallback
│   │   ├── groq.ts                # Whisper для demo-режима
│   │   └── fallback.ts            # общая цепочка «основной → резерв → офлайн-пример»
│   ├── db.ts                      # клиент Neon Postgres
│   ├── cache.ts                   # клиент Upstash Redis + rate-limit
│   └── prompts.ts                 # все текстовые промпты к нейросети в одном месте
│
├── public/
│   ├── demo-data/                 # 2–3 готовых параграфа с предзаписанными ответами —
│   │                               # офлайн-фоллбэк и основа демо-режима
│   ├── manifest.json              # PWA-манифест
│   └── icons/                     # иконки для установки на экран телефона
│
├── styles/
│   └── tokens.css                 # переменные дизайн-системы из 03-DESIGN-SYSTEM.md
│
├── .env.local.example              # список переменных окружения без значений
├── next.config.ts
├── package.json
└── tailwind.config.ts
```

## Принципы структуры

- Каждый внешний вызов нейросети — только внутри `lib/ai/*` и только вызывается из
  `app/api/*/route.ts`. Ни один клиентский компонент не должен знать про API-ключи.
- `public/demo-data/` — не техническая мелочь, а часть продукта: без неё не работает ни
  демо-режим, ни офлайн-фоллбэк из `02-ARCHITECTURE.md`.
- `lib/prompts.ts` — все промпты собраны в одном файле, чтобы их было легко доработать и
  тестировать отдельно от интерфейса.
