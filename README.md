# Hebrew Flashcards

A tiny 3-file site: `index.html`, `style.css`, `app.js`, plus a `data.js`
dictionary you edit and an `audio/` folder for your recordings.

## How to use it

1. **Add words** — open `data.js` and add an entry for each card:
   ```js
   "13": { word: "כוכב", emoji: "⭐" },
   ```
   The key ("13") is the card's ID.

2. **Add audio** — record each word and save it in the `audio/` folder
   named after that same ID: `audio/13.mp3` (or `.m4a` / `.ogg` — the
   site tries all three automatically, so you don't need to convert
   anything).

3. **Open `index.html`** — just double-click it, or drag it into a
   browser tab. No server or build step needed.

## Two modes

- **Cards** — a grid of index-card-style tiles, one per word. Tap a
  card to hear its recording.
- **Quiz** — one word at a time, big emoji + jumbo Hebrew text filling
  the screen. Tap it to hear the sound, use the arrows (or ← / → keys,
  or spacebar to replay) to move between cards, and "Shuffle" to
  randomize the order.

## Notes

- If a card's audio file is missing, tapping it shows a small toast
  telling you which ID wasn't found — handy for spotting gaps while
  you're still recording.
- The quiz text auto-shrinks to fit the screen even for longer words.
- Everything is plain HTML/CSS/JS — no build tools, frameworks, or
  internet connection required (aside from loading the two Google
  Fonts on first visit).
