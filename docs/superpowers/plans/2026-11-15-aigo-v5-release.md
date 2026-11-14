# AIGO v5 — план полной реализации и выпуска

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** До 12:00 15 ноября выпустить работающий по публичной ссылке AIGO Collection по утверждённому холсту v5, с публичным репозиторием и PDF-презентацией.

**Architecture:** Next.js App Router в `web/`. Вся логика — чистые функции в `src/lib/`, состояние игрока — в localStorage. Claude API вызывается только на сервере (`/api/chat`, ключ в env). Экраны собираются по доскам холста; доски и генераторы лежат в scratchpad (пути ниже). Развёртывание — Vercel, корень проекта `web`.

**Tech Stack:** Next.js 16, React 19, TypeScript strict, Vitest, `@anthropic-ai/sdk`; хостинг Vercel; GitHub.

**Spec:** `spec/06-collection-v4-design.md` (§10–§12) + холст «v4 · Collector's album» (артефакт `4e646734-6c1b-4252-b66f-0d9ec33ae83b`). Правила хакатона: `docs/hackathon-rules.md`.

**Источники дизайна (истина для UI):** папка `design/canvas/` в репозитории:
- доски: `design/canvas/boards/V4*.dc.html`;
- живые превью: `design/canvas/preview/V4*.html`;
- генераторы: `design/canvas/generators/` (`gen5_*.py`, `gen4_landing.py`; общие стили — `gen4_common.py`, иллюстрации — `gen4_art.py`).

**Исполнители:**
- `aigo-backend` — сессия `local_c128a01c-908d-438d-80b2-69c68dd70f77`: всё в `web/`.
- Основная сессия: репозиторий, README, коммиты, презентация, координация деплоя, финальная проверка.
- Капитан: решения по сортировке и «небу навыков», аккаунты (Vercel, GitHub, Anthropic), отправка формы.

## Global Constraints

- Дедлайн отправки — **15 ноября, 12:00 (UTC+5)**. Заморозка кода — 10:30, последний деплой — 11:00, отправка — до 11:30.
- Что сдаём: живая ссылка **без регистрации и логина**, **публичный** GitHub-репозиторий с полным кодом задеплоенного, **без секретов**, с README; PDF до 10 слайдов на английском.
- Интерфейс на английском. Тексты в `docs/` и `spec/` — на русском. Имена файлов — на английском.
- В продукте нигде не видно слов jury / judges / hackathon: полоса демо называется «QUICK DEMO · 3 MIN».
- Демо = урезанный Free: открыт только Set 01 (Three-Tooth Key, Proving Lock, Pocket Compass). Sets 02–07 — «Free · after the demo», 08–15 — Premium ★ Legendary. Всего 45 предметов.
- Оплата Premium ($7/мес) — только тестовый режим, без реальных денег.
- Ключ `ANTHROPIC_API_KEY` — только в env сервера (`web/.env.local`, переменные Vercel). Контент проверяем через `claude -p`; ключ тратим только на 1–2 smoke-вызова после изменений `/api/chat` и на финальную проверку продакшена.
- Строки-маркеры, которые читает захват, не меняются: `▶ ITEM ACTIVATED · …`, `✅ CHECK PASSED · ★★☆`, `✦ STAMP EARNED · …`, `TEST COMPLETE · ★★★ · 90/100`, `RESULT CODE: …`, `HELP USED`.
- Ничего случайного, никаких серий, таймеров, валюты и таблиц лидеров. Звёзды и марки — только за проверенную работу.
- Коммиты делает основная сессия, когда их одобрит Капитан. `aigo-backend` не коммитит и не деплоит.
- Доступность: `prefers-reduced-motion`, видимый фокус, aria-метки у интерактивных SVG и кнопок.

## Review Focus

1. **Общий IP у всей комнаты** (Wi-Fi площадки, NAT): несколько проверяющих одновременно не должны упираться в лимит 12 запросов в минуту на IP. Ожидаемое поведение: урок идёт у 5 человек сразу. → тест в Task 8.
2. **Ключ API недоступен или исчерпан лимит расходов** во время проверки. Ожидаемое поведение: консоль показывает понятное сообщение и путь «скопируйте предмет в свой Claude», остальной сайт работает. → тест в Task 8.
3. **Чужое имя в анкете:** пустое, 200 символов, `<script>`, эмодзи. Ожидаемое поведение: правило существующего `cleanName` — только буквы, до 24 символов. Поле показывает подсказку «Enter a name (letters only, up to 24).», последнее верное имя сохраняется, ничего не падает. → тест в Task 2.
4. **Мусорный, чужой или повторный код результата.** Ожидаемое поведение: понятная ошибка без падения; тот же код второй раз — «already counted». → тест в Task 4.
5. **Телефон шириной 375 px:** нет горизонтальной прокрутки, консоль и коллекция пригодны к работе. → проверка в Task 9.

---

## Фаза A — экраны платформы v5 (`aigo-backend`, до ~07:00)

Уже готово и проверено: логика v4/v4.1, терминальная консоль (Lesson и Work chat) с форматом рамок (живая проверка через `claude -p` пройдена), коллекция v5 (W2), лендинг. Если Work chat ещё в старом виде, его доводят в рамках Task 1. Тесты 876+, tsc, build — зелёные.

### Task 1: Страница предмета v5 (W3, в работе)

**Files:** Modify: `src/components/ItemView.tsx`, `src/components/ItemView.module.css`; Test: `src/components/itemInfo.test.ts` (если есть) или `src/lib/*.test.ts` для данных тултипа.

**Interfaces:**
- Consumes: `albumOf(state)`, `ITEMS`/`lore` из контента, `setBadgeSteps`.
- Produces: `itemStats(state, id): { lessons: string; time: string; practiceOn: string; worksIn: string; stars: Stars | null; stamps: { name: string; earned: boolean }[]; use: string; story: string }` в `src/components/itemInfo.ts`.

- [ ] **Step 1:** Тест `itemStats` для LEARN m1. Новый игрок: `stars === 0`, марки `[Brief formula ✗, Explicit format ✗, Your material ✗]`, `use` начинается с `"Paste into a new chat"`. После `learnStars.m1 = 1`: Brief formula `earned: true`.
- [ ] **Step 2:** Реализовать `itemStats`; сцена с парящим предметом, тёмный тултип (статы, «+ Stamp», «Use:», история), блок «How to use» в 3 шага, кнопки COPY ITEM / OPEN IN CONSOLE / USE IN YOUR OWN CLAUDE ↗ (ведёт на `/guide`), Quest log. Отдельной карты на странице нет.
- [ ] **Step 3:** `npm test && npx tsc --noEmit && npm run build` — всё зелёное; сверка в браузере с превью `V4Card.html`.

### Task 2: Анкета v5 и страница Guide (W4)

**Files:** Modify: `src/components/StartForm.tsx`, `StartForm.module.css`, `src/app/guide/page.tsx`, `src/components/GuideVisual.tsx`, `Guide.module.css`; шрифт Caveat — self-hosted (как остальные шрифты); Test: `src/lib/profile.test.ts`.

**Interfaces:**
- Consumes: `updateProfile(state, profile)`, `demoLock`.
- Uses the existing `cleanName(input: unknown): string` из `src/lib/sanitize.ts` (только буквы, до 24) и `validateProfile(input, { demoLock: true })`.
- Produces: `greetingName(name: string): string` в `src/lib/profile.ts` — пустое значение → `"there"`.

- [ ] **Step 1:** Тесты:
  - `validateProfile({ ...JOHN, name: "  Anna  " }, { demoLock: true })` → `name === "Anna"`;
  - имя из 200 «a» → ошибка `errors.name`, профиль в состоянии не меняется;
  - `"<script>"` → ошибка `errors.name`;
  - `greetingName("")` → `"there"`.
- [ ] **Step 2:** Тест: при заблокированном демо `updateProfile` меняет только `name` и `style`; попытка сменить `goal` игнорируется.
- [ ] **Step 3:** UI анкеты по `V4Start.html`.
  - Тетрадный лист, карандаш (`#7B7F86`) — демо-ответ с пометкой «🔒 DEMO», синие чернила (`#1D3FB8`) — свой ответ.
  - Имя редактируется, пометка меняется на «YOUR ANSWER ✓», приветствие справа обновляется.
  - Стиль выбирается двумя «наклейками».
  - Справа: колонка пользы, превью приветствия, подарочная марка Player One, кнопка «MAKE MY ITEMS ▸».
- [ ] **Step 4:** Страница Guide по `V4Guide.html`: 6 шагов с мини-визуалами, «Two ways to learn», чек-лист, карточка коннектора «★ with Premium · at launch». Навигация: Collection · Console · Guide · Progress · Premium.
- [ ] **Step 5:** `npm test && npx tsc --noEmit && npm run build` — зелёное; браузер: сменить имя на «Anna» → консоль и тексты предметов обращаются к Anna.

### Task 3: Progress — небо навыков и паспорт марок (W5a)

**Files:** Create: `src/lib/sky.ts`, `src/lib/sky.test.ts`; Modify: `src/components/SkillMap.tsx`, `src/components/ProgressView.tsx`, `Progress.module.css`.

**Interfaces:**
- Consumes: `state.learnStars`, `state.results[m].stars`, `state.helpUsed`, `setBadge(state, m)`.
- Produces: `skySet(state: AppState, module: ModuleId): SkyStar[]`, где `SkyStar = { id: "l1" | "l2" | "l3" | "final" | "test" | "help" | "badge"; label: string; lit: boolean; next: boolean }`.

**Правила звёзд** (предложение исполнителя; если Капитан пришлёт другие, её правила заменяют этот блок до начала задачи):

| Звезда | Подпись | Горит, когда |
|---|---|---|
| `l1` | 1.1 The brief formula | `learnStars ≥ 1` |
| `l2` | 1.2 Ask for the shape | `learnStars ≥ 2` |
| `l3` | 1.3 Give it the material | `learnStars ≥ 3` |
| `final` | Final task | `learnStars ≥ 3` |
| `test` | Proving Lock · test | `results.stars ≥ 2` |
| `help` | Pocket Compass · help | `helpUsed` |
| `badge` | Set badge | `setBadge.earned` |

`next` — первая негорящая звезда в порядке `l1, l2, l3/final, test, help, badge`.

- [ ] **Step 1:** Тесты `skySet`:
  - новый игрок → ничего не горит, `next === "l1"`;
  - `learnStars.m1 = 1` → горит `l1`, `next === "l2"`;
  - после fast-forward → горят все 7, `next` нет.
- [ ] **Step 2:** SVG созвездия-ключа по `V4Progress.html`:
  - координаты из `gen5_progress.py` (`PERKS`, `LINKS`); горящие звёзды — с ореолом; следующая — пунктирное кольцо и подпись «NEXT»;
  - соседние созвездия: Player One — горит; 02 и 03 — «FREE» или «AT LAUNCH»; Premium — золотые;
  - у SVG `aria-label` со словесным состоянием.
- [ ] **Step 3:** Паспорт марок:
  - 13 слотов одной сеткой;
  - обводка: старт — серая, easy — зелёная, medium — жёлтая, hard — красная;
  - корешок «ADMIT ONE · VALID FOREVER · No. 0001 · <имя>»;
  - счётчик `n/13`; подпись «the Artifacts stamp comes with premium».
  Рядом — «What you can do now»; ниже поле кода результата и плашка «DEMO ONLY · FAST-FORWARD JOHN / BACK TO NOW».
- [ ] **Step 4:** `npm test && npx tsc --noEmit && npm run build` — зелёное; браузер: новый игрок → fast-forward → все звёзды горят, 4/13 марок.

### Task 4: Result v5 (W5b)

**Files:** Modify: `src/components/ResultView.tsx`, `Result.module.css`, `ResultCodeForm.tsx`; Test: `src/lib/resultcode.test.ts`, `src/lib/progress.test.ts`.

**Interfaces:**
- Consumes: `applyResultCode(state, raw)`, разбор кода (результат каждого задания).
- Produces: `practiceHint(result: TestResult): { task: string; lesson: string } | null` в `src/lib/scoring.ts` — по первому проваленному заданию; для q3 → `{ task: "Why paste your own material", lesson: "Lesson 1.3 · Give it the material" }`.

- [ ] **Step 1:** Тесты:
  - `practiceHint` для 10/10/0/35/35 возвращает q3;
  - для 100/100 → `null`;
  - мусор `"hello"` → `{ ok: false, error: "bad_format" }` без исключения;
  - код другого игрока → `error: "wrong_player"`;
  - тот же код второй раз → `error: "already_counted"`;
  - на каждую ошибку ResultView показывает человеческий текст: всё объединение `ResultCodeError` покрыто таблицей сообщений, тест проверяет, что пустых нет.
- [ ] **Step 2:** UI по `V4Result.html`:
  - слева — рамка TEST COMPLETE из чата;
  - справа — визуал: «READING CODE_» ~0,9 с, затем голографический Proving Lock, счёт, звёзды по одной (350 мс; с reduced motion — сразу);
  - чипы «CONSTELLATION COMPLETE», «+ STAMP», «MILESTONE»;
  - список заданий ✓/✗, блок «One thing to practice», CTA «Back to collection» / «See Premium».
- [ ] **Step 3:** `npm test && npx tsc --noEmit && npm run build` — зелёное; браузер: fast-forward → «See John's test result» → 90/100 ★★★.

### Task 5: Premium v5 (W5c)

**Files:** Modify: `src/components/ProView.tsx`, `Premium.module.css`.

- [ ] **Step 1:** UI по `V4Pass.html`:
  - три билета: «IN THIS DEMO · LIVE NOW», «FREE · AT LAUNCH $0», «PREMIUM · AT LAUNCH $7 / MONTH»; у пунктов Premium строки «WHY IT'S REAL»;
  - два пути с силуэтами ★ Legendary;
  - тёмная полоса «ADMIT ONE · PREMIUM · TEST MODE»: «GET PREMIUM» → «confirming test payment_» → «✓ PREMIUM ACTIVE · TEST MODE … arrives at launch»;
  - Set 01 после тестовой оплаты не меняется.
- [ ] **Step 2:** Тест: `activateSubscription` не открывает наборы 02+ в демо (`albumOf` после подписки: 02 по-прежнему `locked`).
- [ ] **Step 3:** `npm test && npx tsc --noEmit && npm run build` — зелёное.

### Task 6: Сортировка и фильтры коллекции

**Files:** Create: `src/lib/albumQuery.ts`, `src/lib/albumQuery.test.ts`; Modify: `src/components/CollectionView.tsx`.

**Interfaces:**
- Consumes: `albumOf(state): AlbumSet[]`.
- Produces: `queryAlbum(sets: AlbumSet[], q: AlbumQuery): AlbumGroup[]`, где
  - `AlbumQuery = { by: "set" | "skill" | "rarity"; type: "all" | ItemKind; showLocked: boolean }`;
  - `AlbumGroup = { key: string; title: string; cards: (AlbumCard & { set: string; setTitle: string })[] }`.

**Правила** (предложение; правила Капитана, если придут до начала задачи, заменяют этот блок):
- `set`: группы = наборы 01→15 (как сейчас);
- `skill`: одна группа на навык — название набора, по алфавиту, внутри LEARN → TEST → HELP;
- `rarity`: группы «★ Legendary», «◆ Rare», «● Common», внутри собранные первыми;
- `type`: оставляет только карты нужного типа;
- `showLocked: false` убирает силуэты и пустые группы.

Состояние запроса хранится в URL (`?by=rarity&type=learn`), чтобы ссылка открывала тот же вид.

- [ ] **Step 1:** Тесты:
  - `by: "set"` → 15 групп, первая `"01"`;
  - `by: "rarity"` → порядок `["legendary", "rare", "common"]`;
  - `type: "help"` → в каждой группе только `kind === "help"`;
  - `showLocked: false` у нового игрока → одна группа (Set 01) с созданными картами.
- [ ] **Step 2:** Реализовать `queryAlbum`; подключить панель SORT BY / TYPE / SHOW LOCKED; при `by ≠ set` — плоская сетка с подзаголовками групп; карты поднимаются при наведении.
- [ ] **Step 3:** `npm test && npx tsc --noEmit && npm run build` — зелёное.

### Task 7: Чистка текстов и мелкие баги из ревью

**Files:** `src/components/LandingView.tsx`, `src/lib/marketing.ts`, генератор (`src/lib/generator.ts`, `src/lib/content/*`), `src/lib/album.ts`.

- [ ] **Step 1:** Тест-«сторож» `copy.test.ts`: в собранных строках UI (`marketing.ts`, тексты компонентов через экспортированные константы) нет `/jury|judge|hackathon|office jobs/i`.
- [ ] **Step 2:** Исправить:
  - «FOR THE JURY» → «QUICK DEMO · 3 MIN»;
  - «people in office jobs who know…» → «people who know AI matters and don't know where to start.»;
  - в ответах Claude и на странице предмета вместо `m1`, `m1.1` → «Set 01», «Lesson 1.1»;
  - счётчики значков `/15` согласованы с полкой;
  - подписи групп марок — по факту группировки.
- [ ] **Step 3:** Прогнать LEARN через `e2e/live.sh` (`claude -p`): первый ответ без `m1`.
- [ ] **Step 4:** `npm test && npx tsc --noEmit && npm run build` — зелёное.

## Фаза B — надёжность продакшена (`aigo-backend`, ~07:00–08:30)

### Task 8: Защита `/api/chat` от перерасхода и общий IP

**Files:** Modify: `src/app/api/chat/route.ts`, `src/lib/server/rateLimit.ts`; Test: `src/lib/server/rateLimit.test.ts`, `src/app/api/chat/route.test.ts` (если есть) или новый `src/lib/server/chatGuard.test.ts`.

**Interfaces:**
- Produces: `chatLimits(env): { perIpMinute: number; perIpDay: number; globalMinute: number; globalDay: number; model: string }` в `src/lib/server/chatGuard.ts`:
  - значения по умолчанию: `perIpMinute = 40`, `perIpDay = 800`, `globalMinute = 120`, `globalDay = 3000`;
  - переопределения: `CHAT_PER_IP_MINUTE`, `CHAT_GLOBAL_DAY`, `CHAT_MODEL`; модель по умолчанию — текущая.

- [ ] **Step 1:** Тест: 30 запросов за минуту с одного IP проходят (комната на одном NAT); 41-й → 429 с `retryAfterSec`.
- [ ] **Step 2:** Тест: после `globalDay` запросов ответ 503 с текстом `"The live coach is resting. Copy an item from your collection into your own Claude: it works the same."`; то же при отсутствии ключа и при ошибке 401/429 от API.
- [ ] **Step 3:** Реализовать; консоль показывает этот текст плашкой со ссылкой на `/guide`.
- [ ] **Step 4:** Один smoke-вызов с реальным ключом через `npm run dev` + curl: поток идёт; в логах нет ключа и содержимого переписки.
- [ ] **Step 5:** `npm test && npx tsc --noEmit && npm run build` — зелёное.

**Капитан (вне кода):** в консоли Anthropic поставить месячный лимит расходов на ключ — $20.

### Task 9: Мобильная версия и последний проход по доступности

**Files:** CSS-модули экранов, `globals.css`.

- [ ] **Step 1:** Ширина 375 px на `/`, `/start`, `/collection`, `/item/learn`, `/console`, `/guide`, `/progress`, `/result/<код>`, `/pro`: нет горизонтальной прокрутки, кнопки не меньше 44 px, консоль и панель подсказок стоят столбиком.
- [ ] **Step 2:** Проверка с клавиатуры: Tab проходит навигацию, вкладки консоли, кнопки сортировки и звёзды неба; фокус виден; с reduced motion анимации выключены.
- [ ] **Step 3:** Production-сборка локально: `npm run build && npm start`. Страницы отдают заголовки CSP; шрифты грузятся с self (`font-src 'self'`); в консоли браузера нет ошибок.

## Фаза C — репозиторий и развёртывание (основная сессия + Капитан, начать параллельно с фазой A)

### Task 10: Порядок в репозитории

- [ ] **Step 1:** Проверка секретов:
  - `git ls-files` и рабочее дерево — нет `.env*` (кроме `.env.example`), ключей `sk-ant-`, токенов;
  - `grep -rn "sk-ant-" --exclude-dir=node_modules .` → пусто;
  - `.gitignore` покрывает `.env*.local`, `.next`, `node_modules`, `.claude/launch.json`.
- [ ] **Step 2:** `web/.env.example` с `ANTHROPIC_API_KEY=` и необязательными `CHAT_*`.
- [ ] **Step 3:** Корневой `README.md` (английский):
  - что это и для кого;
  - живая ссылка;
  - путь демо за 3 минуты;
  - как работает (предметы → Claude → маркеры → прогресс; код результата);
  - архитектура и безопасность (ключ только на сервере, лимиты);
  - локальный запуск (`cd web && npm i && cp .env.example .env.local && npm run dev`) и тесты;
  - структура папок (docs, spec, analysis, design, web).
- [ ] **Step 4:** Коммиты логическими блоками после одобрения Капитана:
  1. «docs: research, specs and design (v4–v5)»;
  2. «feat(web): AIGO Collection app»;
  3. «docs: README and release plan».

  Затем `git push origin main`.
- [ ] **Step 5 (Капитан):** сделать репозиторий `Sabira687/BC2.0` публичным на GitHub; основная сессия проверяет открытие без логина.

### Task 11: Развёртывание на Vercel (пробный выпуск — как можно раньше, целевое время ~07:00)

- [ ] **Step 1 (Капитан):** войти на vercel.com через GitHub → Add New Project → импорт `BC2.0`:
  - Root Directory: `web`, Framework: Next.js, команды по умолчанию;
  - Environment Variables (Production): `ANTHROPIC_API_KEY`.
- [ ] **Step 2:** Первый деплой. Основная сессия проверяет на `*.vercel.app`:
  - все маршруты отдают 200, в браузере нет ошибок;
  - CSP не блокирует шрифты и стили;
  - `/api/chat` — один реальный ответ потоком;
  - заголовок `x-real-ip` учитывается лимитером.
- [ ] **Step 3:** Дальше каждый push в `main` выкатывается сам. Перед заморозкой — последний push не позже 11:00.
- [ ] **Запасной путь:** если Vercel недоступен — Netlify (Next.js runtime) с теми же настройками; в README указываем рабочую ссылку.

## Фаза D — сдача

### Task 12: Презентация PDF (основная сессия, ~08:30–10:00)

- [ ] **Step 1:** 10 слайдов на английском, скриншоты с продакшена:
  1. Название и одна строка.
  2. Проблема и пользователь (15%).
  3. Решение: предметы, которые делают ИИ наставником.
  4. Как это работает: карта → «▶ ITEM ACTIVATED» → проверка → звёзды и марки.
  5. Демо-путь и скриншоты консоли, коллекции, неба навыков.
  6. Почему возвращаются: коллекция, марки, без серий; лучшее из старых игр (20%).
  7. Отличие от аналогов, оригинальность (10%).
  8. Бизнес: Free / Premium $7, «Big plan. Real parts.» (15%).
  9. Техника и надёжность: живой Claude API, захват маркеров, коды результата, тесты, безопасность (40%).
  10. Ссылки: продукт, репозиторий, команда SKaiCode.
- [ ] **Step 2:** Экспорт в PDF, проверка: ≤10 страниц, читается без анимаций.

### Task 13: Финальная проверка на продакшене (~10:00–10:30) и отправка

- [ ] **Step 1:** Полный путь в чистом профиле браузера:
  1. лендинг;
  2. анкета, имя меняем на своё;
  3. коллекция;
  4. консоль: урок 1.1 до «CHECK PASSED», один живой вызов;
  5. Work chat → Compass;
  6. Progress → fast-forward → Result 90 ★★★;
  7. Premium → тестовая оплата;
  8. Guide.

  То же на телефоне шириной 375 px.
- [ ] **Step 2:** Негативные случаи из Review Focus: мусорный код, повторный код, длинное имя.
- [ ] **Step 3:** Заморозка в 10:30; исправления — только блокеры; последний деплой — 11:00.
- [ ] **Step 4 (Капитан):** отправить форму: PDF, ссылку, репозиторий — до 11:30. Ссылка должна работать до конца финала 15 ноября.

## Если останется время (после Task 13, по решению Капитана)

Финальные иллюстрации Капитана вместо концепт-арта; полноценные фильтры по правилам Капитана, если они шире Task 6; анимация раскрытия для Set 01 при первом входе; мини-коннектор (MCP) как демонстрация; адаптация тёмной темы.

## Расписание (UTC+5)

| Время | `aigo-backend` | Основная сессия | Капитан |
|---|---|---|---|
| 03:00–05:30 | Task 1–5 | Task 10 (README, проверка секретов) | Правила сортировки и неба навыков |
| 05:30–07:00 | Task 6–7 | Коммиты после одобрения, push | Репозиторий публичный, вход в Vercel |
| 07:00–08:30 | Task 8–9 | Task 11: первый деплой и его проверка | Ключ в Vercel, лимит расходов |
| 08:30–10:00 | Исправления по деплою | Task 12: презентация | Просмотр презентации |
| 10:00–10:30 | Только блокеры | Task 13: финальная проверка | Финальная проверка глазами |
| 10:30–11:30 | Заморозка | Последний деплой в 11:00 | Отправка до 11:30 |
