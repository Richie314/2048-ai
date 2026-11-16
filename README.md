# 2048 Game - HTML5

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
├── dataset/                   # Exported .2048.json training recordings
├── compose.train.yaml         # Docker training service
├── train/
│   ├── Dockerfile             # Python training image
│   ├── dataset.py             # Load and validate .2048.json demonstrations
│   ├── train.py               # Train an MLP policy from recorded moves
├── LICENSE                    # GNU GPLv3 license
├── requirements.txt           # Python training dependencies
└── README.md
```

## Run Locally

Open `game/index.html` directly in a modern browser, or serve the repository folder with any static web server. A static server is recommended for reliable service-worker behavior. No web build step or backend is required.

## Serve with Docker from VS Code

Install Docker with Compose and make sure Docker is running. The VS Code tasks
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

Place exported `.2048.json` files in `dataset/`. Training recursively reads every
matching file, including files in subdirectories, and saves `model/model.json`.
An empty dataset produces an error; add recordings before running training.

**Docker (recommended)** requires Docker with Compose, with Linux containers
running. No local Python installation is needed. In VS Code, run
**Tasks: Run Task → 2048: train model (Docker)**. From a terminal at the repository
root, the equivalent command is:

```bash
docker compose --project-name 2048-ai-training --file compose.train.yaml run --build --rm --no-deps -T train
```

The image installs the Python dependencies during its build. Recordings are
mounted read-only; the model is written back to the host. The training container
is removed when it exits and operates independently of the nginx container.
Re-running training replaces `model/model.json`.

To change training parameters, append the complete training arguments:

```bash
docker compose --project-name 2048-ai-training --file compose.train.yaml run --build --rm --no-deps -T train /dataset --output /model/model.json --epochs 500 --seed 42
```

**Debug training in VS Code:** install Microsoft's **Python Debugger** extension
(`ms-python.debugpy`). Set breakpoints in `train/train.py` or `train/dataset.py`,
select **2048: Debug training (Docker)** in Run and Debug, and press **F5**.
The start task builds the image and starts Python with `debugpy` inside Docker,
waits for its debugger port, then VS Code attaches before training begins.
Source files are mounted read-only and mapped to the local `train/` folder.
Press **Shift+F5** to disconnect and stop/remove the debug container; it is also
cleaned up when training finishes. All training code executes inside the container. The debug port is exposed only on localhost (5678).

The debug configuration uses a separate Compose project from normal training
and nginx. If attachment fails or VS Code closes unexpectedly, run
**Tasks: Run Task → 2048: stop training debugger** to clean up.

All generated models go in `model/`; its contents are ignored by Git except for
the directory's `.gitignore` file.

**Direct Python** requires Python 3.10 or newer. From the repository root,
optionally activate a virtual environment, then run:

```bash
python -m pip install -r requirements.txt
python train/train.py dataset --output model/model.json --epochs 200
```

A policy can choose an action from the current 16-cell board alone; it does not
need a recurrent model or the full move history. Tile spawning is random, so the
board determines the possible next states rather than one fixed next state.

Recordings capture `previousBoard` and `scoreBefore` before applying the move,
and `board` and `scoreAfter` after merging and spawning. Undo removes the
abandoned move from the recording and saves the restored state.

Training and playback expect files generated by the current web app. The loader
checks board values, actions, and move/spawn transitions. Malformed files are
skipped with a warning. Input files are never rewritten.
The exported model lists actions in classifier output order and includes its
output activation. Training accuracy measures fit to these demonstrations, not
playing strength on unseen games.

## Technical Details

- HTML5 and CSS3 with custom properties for light and dark themes
- Vanilla JavaScript for the generalized engine
- Bootstrap 5.3 and Bootstrap Icons for the shared UI
- Local storage keys: `2048_gameState`, `2048_bestScore`, `2048_language`, and `2048_theme`
- Export format: compact JSON with a `.2048.json` extension. It includes a `generatedAt` timestamp and a `recording.moves` array; every recorded state stores the player's `move`, an ISO `timestamp`, the board, and score information. The initial state has `move: null` and the session start timestamp.
- Animations respect `prefers-reduced-motion`
- Keyboard, touch, and accessible semantic controls are supported

### Example Exported File

Each `.2048.json` file follows this structure. The example uses shortened
values for readability while remaining valid JSON:

```json
{
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

The project code is licensed under the GNU General Public License (GPLv3). See [LICENSE](LICENSE) for the complete license text.

The language selector flags in `game/images/it-flag.svg` and `game/images/uk-flag.svg`
were obtained from [SVG Repo](https://www.svgrepo.com/). These third-party
assets are subject to the licenses and terms applicable to their respective
SVG Repo source pages and are not relicensed by this project's GPLv3 notice.
