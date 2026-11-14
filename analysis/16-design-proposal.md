# Фаза 6. Предложение по дизайну

> Принцип из [12-visual-language.md](12-visual-language.md): **утверждённый стиль (тёмный космос + HUD) — это рамка. Ностальгию 2010-х передают сами карты и моменты получения.** Предложение, решает Капитан.

## 1. Анатомия карты

По образцу коллекционных карт (Pokémon TCG, Magic): рамка, иллюстрация, название, тип, символ набора, номер в наборе «X/Y», знак редкости, текст-описание **[Phygitals, MTG Wiki, TCG Protectors]**.

```
┌─────────────────────────────┐  ← рамка цвета типа (LEARN голубой / TEST маджента / HELP зелёный)
│ ■ LEARN            SET 01 · 1/3 │  ← форма типа + символ набора + номер
│ ┌─────────────────────────┐ │
│ │                         │ │
│ │     ИЛЛЮСТРАЦИЯ 4:5     │ │  ← сгенерированный арт (поле уже есть)
│ │                         │ │
│ └─────────────────────────┘ │
│ THE CLEAR ASK               │  ← название
│ Teaches · ~10 min · 3 lessons│  ← свойства
│ «Ask once. Get it right.»   │  ← flavor text курсивом (альманах PvZ)
│ ★★☆                    HOLO? │  ← звёзды мастерства; голограмма за ★★★
└─────────────────────────────┘
```

- **Форма типа** в углу: ■ LEARN · ▲ TEST · ● HELP · ⬢ скоро (как форма = тип в Club Penguin).
- **Номер «1/3»** в наборе — как «X/Y» у Pokémon: видно, сколько осталось.
- **Голографическая версия:** перелив по наклону и курсору. Технически это известный CSS-приём (градиенты, режимы смешивания, наклон 3D по курсору) **[simeydotme pokemon-cards-css, Speckyboy]**.
- **Глянцевый блик** сверху карты — тонкий намёк на «оптимистичную» эстетику 2000-х **[Creative Bloq]**.

## 2. Момент получения карты (страница коллекции)

```
1. [  ▒▒▒  ]        закрытая ячейка со силуэтом формы
2. [ ~▒▒▒~ ]        лёгкая тряска, блик пробегает по ячейке
3. [ ░░░░░ ]        свечение цвета типа (намёк до раскрытия)
4.  ...             пауза ~0,8 с
5. [ ✦ CARD ✦ ]     вспышка, карта переворачивается лицом
6.  NEW!  → карта встаёт в ячейку альбома, счётчик 1/3 → 2/3 «докручивается»
```

Основание: Hearthstone, Overwatch **[PC Gamer, Kotaku]**. Длительность каждого шага до ~300 мс, кроме паузы; кнопка «пропустить» для повторных раскрытий.

## 3. Альбом коллекции (вместо сетки карточек)

```
VAULT 001 · AI SKILLS                                   CARDS 2 / 24
──────────────────────────────────────────────────────────────────
SET 01 · THE CLEAR ASK   ★ 3/3 cards   ◎ set badge: 2 of 3 steps
 [ ■ LEARN ★★☆ ] [ ▲ TEST ★★★ HOLO ] [ ● HELP ]
SET 02 · ITERATE          LOCKED · with the pass
 [ ▒ ??? ] [ ▒ ??? ] [ ▒ ??? ]
SET 03 · SHOW, DON'T TELL LOCKED
 [ ▒ ??? ] [ ▒ ??? ] [ ▒ ??? ]
COMING SOON · GAME ⬢  CHALLENGE ⬢
```

- Наборы — «страницы альбома»; силуэты формы на закрытых картах (Покедекс).
- Счётчик общий и по набору; звезда / значок на полностью собранном наборе (Starbound, Steam).

## 4. Книга марок (страница прогресса)

```
STAMP BOOK · JOHN                                  STAMPS 3 / 12
┌──────────┬──────────┬──────────┬──────────┐
│  ◉ EASY  │  ◉ EASY  │  ◉ EASY  │  ◌ ???   │
│ BRIEF    │ EXPLICIT │ YOUR     │          │
│ FORMULA  │ FORMAT   │ MATERIAL │          │
└──────────┴──────────┴──────────┴──────────┘
Page reward: all SET 01 stamps → set artwork unlocks
```

- Марка — круглая печать с «зубчиками» по краю, цвет по сложности: Easy / Medium / Hard (Club Penguin).
- При получении марка «шлёпается» с лёгким наклоном — физическое ощущение печати.
- За полную страницу открывается иллюстрация набора (фото за категорию в Club Penguin).

## 5. Консоль: «портал»

```
┌ YOUR LESSON WITH CLAUDE ─────────────────────────────┐
│                                                      │
│  ▶ ITEM ACTIVATED · LEARN · The Clear Ask            │  ← первая строка ответа ИИ
│  Coach mode on. Hi John! …                           │
│                                                      │
├──────────────────────────────────────────────────────┤
│ ╔═[■ LEARN · The Clear Ask inserted]══════════════╗  │  ← рамка поля ввода светится цветом
│ ║ Type your answer…                         SEND ▸ ║  │    вставленной карты (портал Skylanders)
│ ╚══════════════════════════════════════════════════╝  │
└──────────────────────────────────────────────────────┘
```

- **Вставка карты** — короткая вспышка рамки поля цветом типа + мини-карта «inserted».
- **Звезда в чате** (`✅ CHECK PASSED · ★★☆`) на сайте повторяется анимацией: звезда вылетает и садится в мини-карту.
- **Марка в чате** (`STAMP EARNED · Brief Formula`) на сайте — всплывающая печать.

## 6. Карта навыков

- Наборы — точки на звёздной карте (стиль уже есть на лендинге), связанные линиями-созвездиями.
- У каждой точки — до трёх звёзд и форма значка набора.
- Открытые наборы можно выбирать в любом порядке; закрытые — тусклые с замком.
- Аналогия: карта уровней Candy Crush + выбор старого дерева Duolingo.

## 7. Надписи

| Момент | Текст | Основание |
|---|---|---|
| Вставка карты | **▶ ITEM ACTIVATED** | «CHEAT ACTIVATED» |
| Новая карта | **NEW!** · **YOU GOT A NEW CARD!** | «You got a new plant!» (PvZ) |
| Проверка пройдена | **CHECK PASSED · ★★☆** | Три звезды |
| Марка | **STAMP EARNED** | Club Penguin |
| Значок набора | **SET COMPLETE** | «Collection complete» |
| Достижения | **ACHIEVEMENT UNLOCKED** | Xbox |
| Закрытая карта | **??? · You'll see it later** | Покедекс |
| Без давления | **Your cards wait for you.** | Neopets, Webkinz |

Тон: капслок и восклицание — только в момент награды; в остальном простые слова (решение по консоли для не-технарей).

## 8. Звук (по желанию, выключатель)

- Короткий «щелчок» активации при вставке карты.
- Звон на звезду (как звон достижения, но мягче).
- Без фоновой музыки по умолчанию; возможно, тихая тема меню в духе джинглов Wii как пасхалка **[Vice, AV Club]**.

## 9. Что не трогаем

- Тёмный космос, HUD-подписи, шрифты Barlow / IBM Plex, лендинг — утверждены.
- Цвета типов карт (голубой / маджента / зелёный) и формы (квадрат / треугольник / круг) — утверждены.

## Источники
- [Phygitals: Pokémon card anatomy](https://phygitals.gitbook.io/wiki/understanding-pokemon-cards/card-anatomy) · [TCG Protectors: card anatomy and rarity](https://tcgprotectors.com/blogs/pokemon-blog/pokemon-card-anatomy-rarity-guide) · [MTG Wiki: Card frame](https://mtg.wiki/page/Border) · [Card layout reference](https://tyler274.github.io/rummage/card_systems/rendering/card_layout.html)
- [simeydotme: Pokémon cards CSS holographic effect](https://awesome.ecosyste.ms/projects/github.com%2Fsimeydotme%2Fpokemon-cards-css) · [hover-tilt demo](https://hover-tilt.simey.me/bespoke/pokemon-cards/) · [Speckyboy: card hover effects](https://speckyboy.com/css-javascript-card-ui-hover-effects/)
- [Creative Bloq: Frutiger Aero resurgence](https://creativebloq.com/news/frutiger-aero-aesthetic-resurgance) · [Medium: when the future looked optimistic](https://medium.com/illumination/frutiger-aero-when-the-future-looked-optimistic-e055e097f3ae)
- [Vice: Wii channel music](https://www.vice.com/en/article/replaying-the-pretty-synthwave-tunes-of-the-wii-channels) · [AV Club: Wii Shop Channel closing](https://www.avclub.com/wii-shop-channel-closing)
- [PC Gamer: loot box art](https://www.pcgamer.com/behind-the-addictive-psychology-and-seductive-art-of-loot-boxes) · [Kotaku: loot boxes like Christmas](https://kotaku.com/why-opening-loot-boxes-feels-like-christmas-according-1793446800)
