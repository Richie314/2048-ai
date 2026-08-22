# 2048 Game - HTML5 Version

A responsive 2048 game built with vanilla JavaScript, Bootstrap 5.3, and a blue color palette. The project is split into three pages that share the same styles and game engine.

## Pages

- `index.html` is the landing page. It links to the game and playback pages.
- `game.html` is the playable game. It supports keyboard arrows, touch swipes, undo, score tracking, local persistence, language and theme preferences, and export.
- `playback.html` displays a previously exported game. Choose a `.2048.json` file, then start its recorded move sequence.

The board mechanics, recording format, rendering, theme handling, and persistence live in `scripts/game.js`. The engine selects its behavior from the page's `data-page` attribute, so the game logic is not duplicated between pages.

## How to Play

1. Open `index.html` and choose **Start playing**.
2. Move tiles with the arrow keys or by swiping on the board.
3. Combine equal tiles to reach 2048. You can continue after winning.
4. Use **Undo** to restore recent states, up to ten moves.
5. Use **Export .2048.json** to download the current recording.
6. Open **Playback**, choose the exported `.2048.json` file, and start the replay.

All game state, preferences, and the best score are stored in browser `localStorage`. Playback files are read locally in the browser and are not uploaded.

## File Structure

```text
2048-ai/
├── images/
│   ├── icon.svg               # App icon
│   ├── it-flag.svg            # SVG Repo flag asset
│   └── uk-flag.svg            # SVG Repo flag asset
├── scripts/
│   ├── game.js                # Shared 2048 engine and page controllers
│   ├── service-worker.js      # Offline cache
│   └── translations.js        # Italian and English translations
├── styles/
│   └── styles.css             # Shared themes, layout, tiles, and animations
├── game.html                  # Playable game page
├── index.html                 # Landing page
├── playback.html              # File-based playback page
├── manifest.json              # Installable web app metadata
├── LICENSE                    # GNU GPLv3 license
└── README.md
```

## Run Locally

Open `index.html` directly in a modern browser, or serve the folder with any static web server. A static server is recommended for reliable service-worker behavior. No build step or backend is required.

## Technical Details

- HTML5 and CSS3 with custom properties for light and dark themes
- Vanilla JavaScript for the generalized engine
- Bootstrap 5.3 and Bootstrap Icons for the shared UI
- Local storage keys: `2048_gameState`, `2048_bestScore`, `2048_language`, and `2048_theme`
- Export format: compact version 3 JSON with a `.2048.json` extension. It includes a `generatedAt` timestamp and a `recording.moves` array; every recorded state stores the player's `move`, an ISO `timestamp`, the board, and score information. The initial state has `move: null` and the session start timestamp.
- Animations respect `prefers-reduced-motion`
- Keyboard, touch, and accessible semantic controls are supported

### Example Exported File

Each `.2048.json` file follows this structure. The example uses shortened
values for readability while remaining valid JSON:

```json
{
	"version": 3,
	"generatedAt": "2026-08-22T15:14:19.171Z",
	"exportedAt": "2026-08-22T15:14:19.171Z",
	"game": {
		"boardSize": 4,
		"board": [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		"score": 0,
		"gameOver": false,
		"won": false,
		"bestScore": 0,
		"language": "it",
		"theme": "light"
	},
	"recording": {
		"version": 3,
		"startedAt": "2026-08-22T15:14:19.171Z",
		"initialState": {
			"board": [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			"score": 0,
			"gameOver": false,
			"won": false,
			"move": null,
			"timestamp": "2026-08-22T15:14:19.171Z"
		},
		"moves": [
			{
				"move": "right",
				"timestamp": "2026-08-22T15:14:25.004Z",
				"previousBoard": [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
				"board": [0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
				"scoreBefore": 0,
				"scoreAfter": 0,
				"gameOver": false,
				"won": false
			}
		]
	}
}
```

## License and Third-Party Assets

The project code is licensed under the GNU General Public License, version 3
(GPLv3). See [LICENSE](LICENSE) for the complete license text.

The language selector flags in `images/it-flag.svg` and `images/uk-flag.svg`
were obtained from [SVG Repo](https://www.svgrepo.com/). These third-party
assets are subject to the licenses and terms applicable to their respective
SVG Repo source pages and are not relicensed by this project's GPLv3 notice.
