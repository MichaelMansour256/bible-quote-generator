# منصة ألعاب الكتاب المقدس

A modular Arabic Bible web app with a verse image generator and three Bible games in one place.

## What It Does

- Quote generator for Bible verses with Arabic typography and downloadable images
- Memory game to hide words in a verse and let the player fill them in
- Reverse-words game for books, names, and places
- Scrambled-words game using the same curated Bible term pool
- Searchable Bible verse picker with Arabic-friendly matching
- Saved preferences and score tracking with `localStorage`

## Architecture

The app is now split into a small core controller plus feature modules:

```text
bible-quote-generator/
├── index.html
├── script.js
├── bible-api.js
├── bible-database.js
├── styles.css
├── js/
│   ├── game-utils.js
│   └── games/
│       ├── reverse-game.js
│       └── scramble-game.js
└── README.md
```

`script.js` remains the main application shell and imports the game modules as mixins. Shared Arabic normalization, scrambling, reversing, and curated Bible term helpers live in `js/game-utils.js`.

## Features

### Quote Generator

- Browse verses by book, chapter, and verse
- Search Arabic verse text in real time
- Generate 1080x1080 verse images
- Choose from multiple backgrounds and Arabic fonts
- Optional logo overlay with automatic contrast handling

### Memory Game

- Pick a specific verse or random verse
- Hide words by difficulty level
- Type the missing words inside locked blanks
- Get score, timer, high score, and next-verse progression
- Save the last selected verse and continue later

### Reverse Game

- Choose between books, names, places, or random selection
- Reverse the chosen term and guess the original
- Supports curated aliases and Arabic normalization
- Tracks score, timer, and high score

### Scrambled Words Game

- Uses the same curated Bible term pool
- Scrambles the characters in the selected word or phrase
- Supports category and difficulty filtering
- Tracks score, timer, and high score

## Getting Started

1. Open the project folder in VS Code or your browser.
2. Serve the folder with a local static server.
3. Open `index.html`.

If you want a quick local server, use something like:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Data Source

- Bible text is loaded from the Arabic Smith & Van Dyck API used by `bible-api.js`
- Canonical book metadata is stored in `bible-database.js`

## Notes

- The app uses Arabic normalization so answers are more forgiving with diacritics and common letter variants.
- The reverse and scrambled games share the same curated pool of books, names, and places.
- The project is designed to stay fully static and run in the browser.
