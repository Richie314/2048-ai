# 2048 Game - HTML5 Version

A responsive 2048 game built with vanilla JavaScript, Bootstrap 5.3, and a blue color palette. The project is split into three pages that share the same styles and game engine.

## Pages

- `index.html` is the landing page. It links to the game and playback pages.
- `game.html` is the playable game. It supports keyboard arrows, touch swipes, undo, score tracking, local persistence, language and theme preferences, and export.
- `playback.html` displays a previously exported game. Choose a `.2048` file, then start its recorded move sequence.

The board mechanics, recording format, rendering, theme handling, and persistence live in `scripts/game.js`. The engine selects its behavior from the page's `data-page` attribute, so the game logic is not duplicated between pages.

## How to Play

1. Open `index.html` and choose **Start playing**.
2. Move tiles with the arrow keys or by swiping on the board.
3. Combine equal tiles to reach 2048. You can continue after winning.
4. Use **Undo** to restore recent states, up to ten moves.
5. Use **Export .2048** to download the current recording.
6. Open **Playback**, choose the exported `.2048` file, and start the replay.

All game state, preferences, and the best score are stored in browser `localStorage`. Playback files are read locally in the browser and are not uploaded.

## File Structure

```text
2048-ai/
├── index.html                 # Landing page
├── game.html                  # Playable game page
├── playback.html              # File-based playback page
├── styles/styles.css          # Shared themes, layout, tiles, and animations
├── scripts/game.js            # Shared 2048 engine and page controllers
├── scripts/translations.js    # Italian and English translations
├── scripts/service-worker.js  # Offline cache
├── manifest.json              # Installable web app metadata
├── images/icon.svg            # App icon
└── README.md
```

## Run Locally

Open `index.html` directly in a modern browser, or serve the folder with any static web server. A static server is recommended for reliable service-worker behavior. No build step or backend is required.

## Technical Details

- HTML5 and CSS3 with custom properties for light and dark themes
- Vanilla JavaScript for the generalized engine
- Bootstrap 5.3 and Bootstrap Icons for the shared UI
- Local storage keys: `2048_gameState`, `2048_bestScore`, `2048_language`, and `2048_theme`
- Export format: JSON with a `.2048` extension containing the current game and its recorded frames
- Animations respect `prefers-reduced-motion`
- Keyboard, touch, and accessible semantic controls are supported
