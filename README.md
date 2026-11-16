# 2048 Game - HTML5 Version

A responsive 2048 game built with vanilla JavaScript, Bootstrap 5.3, and a blue color palette. The web app lives in `game/`; the Python training tools live in `train/`.

## Pages

- `game/index.html` is the landing page. It links to the game and playback pages.
- `game/game.html` is the playable game. It supports keyboard arrows, touch swipes, undo, score tracking, local persistence, language and theme preferences, and export.
- `game/playback.html` displays an exported game. Choose a `.2048.json` file, then start its recorded move sequence.

The board mechanics, recording format, rendering, theme handling, and persistence live in `game/scripts/game.js`. The engine selects its behavior from the page's `data-page` attribute, so the game logic is not duplicated between pages.

## How to Play

1. Open `game/index.html` and choose **Start playing**.
2. Move tiles with the arrow keys or by swiping on the board.
3. Combine equal tiles to reach 2048. You can continue after winning.
4. Use **Undo** to restore recent states, up to ten moves.
5. Use **Export .2048.json** to download the current recording.
6. Open **Playback**, choose the exported `.2048.json` file, and start the replay.

All game state, preferences, and the best score are stored in browser `localStorage`. Playback files are read locally in the browser and are not uploaded.

## File Structure

```text
2048-ai/
├── game/
│   ├── images/
│   │   ├── icon.svg           # App icon
│   │   ├── it-flag.svg        # SVG Repo flag asset
│   │   └── uk-flag.svg        # SVG Repo flag asset
│   ├── scripts/
│   │   ├── game.js            # Shared 2048 engine and page controllers
│   │   ├── service-worker.js  # Offline cache
│   │   └── translations.js    # Italian and English translations
│   ├── styles/
│   │   └── styles.css         # Shared themes, layout, tiles, and animations
│   ├── game.html              # Playable game page
│   ├── index.html             # Landing page
│   ├── playback.html          # File-based playback page
│   └── manifest.json          # Installable web app metadata
├── train/
│   ├── dataset.py             # Load and validate .2048.json demonstrations
│   ├── train.py               # Train an MLP policy from recorded moves
├── LICENSE                    # GNU GPLv3 license
├── requirements.txt           # Python training dependencies
└── README.md
```

## Run Locally

Open `game/index.html` directly in a modern browser, or serve the repository folder with any static web server. A static server is recommended for reliable service-worker behavior. No web build step or backend is required.

## Serve with Docker from VS Code

Install Docker with Compose v2 and make sure Docker is running. The VS Code tasks
work on Linux, macOS, and Windows with Docker running Linux containers.

1. Select **2048: Docker nginx** in **Run and Debug** and press **F5**.
2. The existing start task launches nginx and waits until healthy; the session
   terminal follows its logs.
3. Open `http://localhost:8080/game.html` in your preferred browser.
4. Press **Shift+F5** to end the session and run the existing stop task, which
   stops and removes the container.

The launch configuration uses VS Code's built-in JavaScript Debug Terminal to
hold the session open while streaming Docker logs. It launches no browser and
requires no Node.js application or machine-specific browser paths.

The container serves `game/` through a read-only bind mount, so reload the browser
to see edits. You can also run **Tasks: Run Task → 2048: start nginx** and
**2048: stop nginx** directly. If VS Code closes unexpectedly, run the stop task
to clean up any remaining container.

If offline caching hides an edit, enable **Bypass for network** in browser
DevTools → Application → Service Workers while developing.

## Train a First Policy

The training baseline uses supervised learning with scikit-learn's `MLPClassifier`: each recorded move becomes a labeled example, with the board immediately before that move as the input. It writes a JSON model that can later be connected to an automated player.

Place exported `.2048.json` files in a directory, then run:

```bash
python -m pip install -r requirements.txt
python train/train.py path/to/recordings --output train/model.json --epochs 200
```

A policy can choose an action from the current 16-cell board alone; it does not
need a recurrent model or the full move history. Tile spawning is random, so the
board determines the possible next states rather than one fixed next state.

New recordings capture `previousBoard` and `scoreBefore` before applying the
move, and `board` and `scoreAfter` after merging and spawning. Undo removes the
abandoned move from the recording and saves the restored state. Older exports
may contain incorrect pre-move fields or discontinuities from undo; use fresh
recordings for training.

The loader accepts only version-3 `.2048.json` exports. Files with another export or recording version are skipped with a warning.

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
				"board": [2, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
				"scoreBefore": 0,
				"scoreAfter": 0,
				"gameOver": false,
				"won": false
			}
		]
	}
}
```

## Game regression checks

Run `gjs tests/game.test.js` from the repository root (requires GNOME JavaScript).
The checks cover all 625 lines built from empty cells and tiles 2–16 in every
direction, scoring, tile trajectories, reduced motion, recording, undo persistence,
ten-move undo capacity, terminal states, victory continuation, and playback input.
Browser visual checks are still useful for responsive layout and touch interaction.

## License and Third-Party Assets

The project code is licensed under the GNU General Public License, version 3
(GPLv3). See [LICENSE](LICENSE) for the complete license text.

The language selector flags in `game/images/it-flag.svg` and `game/images/uk-flag.svg`
were obtained from [SVG Repo](https://www.svgrepo.com/). These third-party
assets are subject to the licenses and terms applicable to their respective
SVG Repo source pages and are not relicensed by this project's GPLv3 notice.
