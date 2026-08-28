# VerseUp Arena

A modular Arabic Bible web app — verse image generator and five Bible games in one place.

## What It Does

- Generate shareable 1080×1080 verse images with Arabic typography
- Memory game: hide words in a verse and fill them in from memory
- Reverse-words game: guess the original word from its reversed characters
- Scrambled-words game: unscramble shuffled characters to find the word
- Who-Am-I? flash-card game: read a clue, click the card, and it flips to reveal the Bible person's name
- HolyWordle: Wordle-style guessing of Bible words with selectable word lengths (4–7 letters)
- Smart verse search: by book name, book + chapter, exact reference, or free text
- Saved preferences and score tracking with `localStorage`

## Architecture

```text
bible-quote-generator/
├── index.html
├── styles.css
├── js/
│   ├── main.js                    ← thin shell: constructor + event wiring only
│   ├── core/
│   │   ├── bible-api.js           ← API client + smart search logic
│   │   ├── bible-database.js      ← offline book metadata (aligned to API names)
│   │   └── i18n.js                ← internationalization (AR/EN)
│   └── features/
│       ├── quote-feature.js       ← image generator, search UI, font map
│       └── games/
│           ├── memory-game.js     ← memory game logic
│           ├── reverse-game.js    ← reverse-words game
│           ├── scramble-game.js   ← scrambled-words game
│           ├── whoami-game.js     ← Who-Am-I? flash-card game
│           ├── wordle-game.js     ← HolyWordle guessing game
│           └── game-utils.js      ← shared Arabic normalization, scramble, reverse, term pools
├── assets/
│   ├── logo.svg
│   └── verseup_logo.png
└── README.md
```

`js/main.js` is a thin shell that wires the constructor and event listeners. All feature logic lives in the mixin modules, composed via `Object.assign`.

## Features

### Quote Generator

- Browse verses by book → chapter → verse dropdowns
- Smart search bar (see Search section below)
- Clicking a search result immediately generates the image — no extra button press needed
- 1080×1080 canvas output with decorative border and cross symbols
- 12 Arabic font choices (Thuluth Deco, Amiri, Aref Ruqaa, Reem Kufi, Lateef, Scheherazade, Noto Naskh, Markazi Text, Katibeh, Mirza, Harmattan, Diwan Kufi)
- 7 background styles (gradients + solid colors)
- Optional logo overlay with automatic light/dark contrast handling
- Download as PNG with Arabic reference in filename

### Smart Search

Four search modes, resolved in priority order:

| Input example | Behaviour |
|---|---|
| `يوحنا 3:16` | Returns that exact verse |
| `يوحنا 3` | Returns all chapters whose number starts with `3` (ch 3, 13, 21…), each expandable |
| `يوحنا` | Returns all chapters of John, each expandable |
| `الرب راعي` | Full-text search across all ~31 000 verses |

Chapter results show a **▼ expand arrow** — clicking opens an inline verse list for that chapter. Clicking any verse loads it and generates the image immediately. Keyboard: `↑ ↓` to navigate, `Enter` to select a verse result, `Escape` to close.

### Memory Game

- Pick a specific verse or a random one
- Words hidden by difficulty ratio (easy 20 % → expert 60 %)
- Type missing words into inline blanks
- Score, timer, high score, next-verse progression
- Last selected verse and difficulty saved and restored on reload

### Reverse Game

- Choose books, names, places, or random
- Read the reversed word, type the original
- Time-bonus scoring: `max(10, 100 − seconds)` — faster answers score higher
- `Enter` key submits the answer
- Tracks score, timer, high score; state persisted in `localStorage`

### Scrambled Words Game

- Same curated term pool as the reverse game
- Characters shuffled; type the original word
- Same time-bonus scoring model
- `Enter` key submits the answer
- Category and difficulty filtering; state persisted

### HolyWordle (Bible Wordle)

- Wordle-style guessing: find the secret Bible word within **six attempts**
- **Selectable word length — 4, 5, 6, or 7 letters** — the length acts as the difficulty
- Words come from the same curated term pools (books, names, places, prophets, kings, women, tribes, feasts, artifacts); single words only, de-duplicated
- Standard Wordle coloring with duplicate-letter handling: 🟩 right letter & spot, 🟨 letter exists elsewhere, ⬛ letter not in the word
- Arabic-aware letter matching (hamza variants, taa marbuta, diacritics are normalized) so أ/ا, ة/ه, ى/ي all match
- Built-in Arabic on-screen keyboard plus physical keyboard support (`Enter` submits, `Backspace` deletes)
- Keyboard keys light up with the best known status of each letter
- Time-bonus scoring on win: `max(10, 100 − seconds)`; timer, high score, category and remaining-attempts stats
- Board, category, length, high score and in-progress round are saved in `localStorage` and restored on reload

### Who Am I? (Flash Cards)

- Each flash card shows a single clue about a person from the Bible
- Click the card (or press `Enter`/`Space` on it) to flip it and reveal the person's name
- **Three difficulty levels** — سهل (easy) / متوسط (medium) / صعب (hard):
  - **Easy**: well-known figures (نوح، داود، موسى، بطرس…)
  - **Medium**: deeper Old/New Testament people (جدعون، استفانوس، نيقوديموس…)
  - **Hard**: obscure figures (ملك صادق، أبشالوم، كورنيليوس، حنانيا…)
- 114 curated persons in total across the levels, each with a category (نبي، ملك، رسول، امرأة…)
- Cards avoid repeating within a level until the whole pool has been seen, then the cycle restarts
- **Scoring (self-graded)**: after flipping a card, choose **"✓ عرفتها"** (I knew it) or **"✗ لم أعرفها"** (I didn't know). The score = `(عرفتها ÷ إجمالي الإجابات) × 100` — the share of people you actually recognized
- The **"بطاقة جديدة"** button unlocks only after you grade the current card, keeping the score honest
- Live counters for cards shown, "knew", and "didn't know"
- Difficulty selection is saved in `localStorage` and restored on reload

## Getting Started

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

The app is fully static — no build step, no dependencies to install.

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl + Enter` | Generate image |
| `Ctrl + S` | Download image (if generated) |
| `Enter` (in reverse/scramble answer field) | Submit answer |
| `Enter` / letters / `Backspace` (on HolyWordle page) | Submit row / type / erase letters |
| `↑ / ↓` (in search) | Navigate results |
| `Enter` (in search, verse result) | Load verse + generate image |
| `Escape` (in search) | Close results |

## Deployment, SEO & Link Sharing

The site is fully static — deployed to **https://verse-up-arena.vercel.app** (Vercel). Steps for Google + rich link cards:

1. **Deploy** any changes to the site (all URLs already point to `https://verse-up-arena.vercel.app`).
2. **Verify the share card**:
   - Facebook/Instagram: `https://developers.facebook.com/tools/debug/`
   - LinkedIn: `https://www.linkedin.com/post-inspector/`
   - WhatsApp: paste the link into a chat — the card with the logo (`assets/og-image.png`, 1200×630) appears automatically.
   - Sometimes the caches need a few minutes; the debug tools prompt a re-scrape.
3. **Submit to Google**:
   - Google Search Console → add your property → request indexing.
   - Wait for Google to crawl; `sitemap.xml` + `robots.txt` (both included) speed this up.

What was added: `meta description`/`keywords`/`robots`/`canonical`, Open Graph tags (`og:*`), Twitter card tags (`twitter:*`), `application/ld+json` WebSite/Organization schema (used by Google for the site name + logo in results), `assets/og-image.png` (branded share-card image), `sitemap.xml`, `robots.txt`.

## Data Source
- Bible text: Arabic Smith & Van Dyck via `https://api.getbible.net/v2/arabicsv.json`
- Book metadata: `js/core/bible-database.js` (used as offline fallback in `js/features/games/game-utils.js`)
- Book names in `js/core/bible-database.js` are aligned to the API names (e.g. `تكوين`, `1 صموئيل`) so the fallback term pool matches live data

## Code Notes

- Font lookup uses a single `FONT_MAP` constant in `js/features/quote-feature.js` — no repeated switch-cases
- Arabic normalization (diacritics, alef variants, taa marbuta) is centralised in `js/features/games/game-utils.js`
- `matchesDifficulty` is defined once in `js/features/games/game-utils.js` and imported where needed
- Search dropdown closes on `mousedown` (not `click`) so item handlers fire before the close handler
- Chapter expand/collapse is DOM-local state — highlight changes never rebuild the list