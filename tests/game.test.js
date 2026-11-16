// Run from the repository root with: gjs tests/game.test.js
const GLib = imports.gi.GLib;
const [, bytes] = GLib.file_get_contents('game/scripts/game.js');
const source = new TextDecoder().decode(bytes).replace(/initializeGame\(\);\s*$/, '');
const Game = new Function(`${source}\nreturn Game2048;`)();
let assertions = 0;
function equal(actual, expected, label) {
    assertions++;
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`${label}: ${JSON.stringify(actual)} != ${JSON.stringify(expected)}`);
    }
}
const storage = new Map();
globalThis.localStorage = {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value))
};
function game(board) {
    const g = Object.create(Game.prototype);
    Object.assign(g, { board: [...board], boardSize: 4, score: 0, mode: 'game',
        gameOver: false, won: false, keepPlaying: false, history: [], maxHistory: 10,
        animationTimer: null, playbackTimer: null });
    g.recordingSession = g.createRecordingSession();
    g.render = () => {};
    g.updateScore = () => {};
    g.animateMove = () => {};
    g.saveGameState();
    return g;
}
// Independently compute each line using pair consumption; exhaustive merge coverage.
for (let code = 0; code < 625; code++) {
    let n = code;
    const line = Array.from({ length: 4 }, () => { const v = [0, 2, 4, 8, 16][n % 5]; n = Math.floor(n / 5); return v; });
    const input = line.filter(Boolean), expected = [];
    let score = 0;
    while (input.length) {
        let value = input.shift();
        if (value === input[0]) { input.shift(); value *= 2; score += value; }
        expected.push(value);
    }
    while (expected.length < 4) expected.push(0);
    for (const direction of ['left', 'right', 'up', 'down']) {
        const indices = Array.from({ length: 4 }, (_, i) => {
            const p = ['right', 'down'].includes(direction) ? 3 - i : i;
            return ['left', 'right'].includes(direction) ? p : p * 4;
        });
        const board = Array(16).fill(0);
        indices.forEach((index, i) => { board[index] = line[i]; });
        const g = game(board);
        const changed = g.move(direction);
        equal(indices.map(index => g.board[index]), expected, 'directional merge');
        equal(g.score, score, 'merge score');
        equal(changed, JSON.stringify(line) !== JSON.stringify(expected), 'no-op detection');
        equal(g.moveAnimations.length, line.filter(Boolean).length, 'all source tiles tracked');
    }
}
const g = game([2, 2, ...Array(14).fill(0)]);
g.addNewTile = function () { this.board[this.board.indexOf(0)] = 2; };
equal(g.performMove('left'), true, 'valid action');
equal(g.recordingSession.moves[0].previousBoard, [2, 2, ...Array(14).fill(0)], 'pre-action board');
equal(g.recordingSession.moves[0].scoreBefore, 0, 'pre-action score');
equal(g.recordingSession.moves[0].scoreAfter, 4, 'post-action score');
g.undo();
equal(g.board, [2, 2, ...Array(14).fill(0)], 'undo board');
equal(g.recordingSession.moves.length, 0, 'undo truncates recording');
equal(JSON.parse(storage.get('2048_gameState')).score, 0, 'undo persisted');
for (let i = 0; i < 15; i++) g.saveGameState();
equal(g.history.length, 11, 'ten undo moves plus current state');
const blocked = game([2,4,2,4,4,2,4,2,2,4,2,4,4,2,4,2]);
blocked.checkGameState();
equal(blocked.gameOver, true, 'terminal board');
blocked.board[0] = 0;
blocked.checkGameState();
equal(blocked.gameOver, false, 'terminal flag resets');
const won = game([1024,1024,...Array(14).fill(0)]);
won.performMove('left');
equal(won.won, true, 'victory');
equal(won.performMove('right'), false, 'victory pauses input');
won.keepPlaying = true;
equal(won.performMove('right'), true, 'continue after victory');
won.mode = 'playback';
equal(won.performMove('left'), false, 'playback cannot accept player moves');
equal(g.validBoard(Array(16).fill(3)), false, 'reject invalid tile');
print(`Passed ${assertions} assertions`);
// Minimal DOM geometry verifies both source tiles slide to a shared merge cell.
globalThis.matchMedia = () => ({ matches: false });
globalThis.window = globalThis;
let finish;
globalThis.setTimeout = callback => { finish = callback; return 1; };
globalThis.clearTimeout = () => {};
const paths = [];
const animated = game([2, 0, 2, ...Array(13).fill(0)]);
animated.moveLeft();
const cells = Array.from({ length: 16 }, (_, index) => ({
    getBoundingClientRect: () => ({ left: 10 + index % 4 * 100, top: 10 + Math.floor(index / 4) * 100, width: 90, height: 90 }),
    removeAttribute() {}
}));
animated.boardElement = {
    children: cells, animate() {}, appendChild() {},
    getBoundingClientRect: () => ({ left: 0, top: 0 })
};
animated.renderBoard = () => {};
animated.createTile = () => ({ classList: { add() {} }, style: {}, animate: frames => paths.push(frames) });
Game.prototype.animateMove.call(animated, [2, 0, 2, ...Array(13).fill(0)]);
equal(paths.map(frames => frames[1].transform), ['translate(0px, 0px)', 'translate(-200px, 0px)'], 'merge trajectories');
finish();
equal(animated.animationTimer, null, 'animation completes');
window.matchMedia = () => ({ matches: true });
paths.length = 0;
Game.prototype.animateMove.call(animated, [2, 0, 2, ...Array(13).fill(0)]);
equal(paths.length, 0, 'reduced motion skips sliding');
print(`Passed ${assertions} assertions including animation geometry`);
