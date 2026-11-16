// Translations are now in translations.js

// ============================================
// GAME STATE & STORAGE
// ============================================

class Game2048 {
    constructor(options = {}) {
        this.mode = options.mode || 'game';
        this.boardSize = 4;
        this.board = [];
        this.score = 0;
        this.gameOver = false;
        this.won = false;
        this.history = []; // For undo functionality
        this.maxHistory = 10;
        this.moveAnimations = [];
        this.animationTimer = null;
        this.keepPlaying = false;
        this.recordingSession = this.createRecordingSession();
        this.playbackTimer = null;
        this.playbackIndex = 0;
        
        this.initializeElements();
        if (this.mode === 'game') {
            this.loadGameState();
        } else {
            this.board = Array(this.boardSize * this.boardSize).fill(0);
        }
        this.setupEventListeners();
        this.render();
    }

    initializeElements() {
        this.boardElement = document.getElementById('board');
        this.scoreElement = document.getElementById('score');
        this.bestScoreElement = document.getElementById('best-score');
        this.undoBtn = document.getElementById('undo-btn');
        this.undoCount = document.getElementById('undo-count');
        this.newGameBtn = document.getElementById('new-game-btn');
        this.replayBtn = document.getElementById('replay-btn');
        this.continueBtn = document.getElementById('continue-btn');
        this.exportBtn = document.getElementById('export-btn');
        this.playbackBtn = document.getElementById('playback-btn');
        const gameOverModalElement = document.getElementById('gameOverModal');
        const victoryModalElement = document.getElementById('victoryModal');
        this.gameOverModal = gameOverModalElement ? new bootstrap.Modal(gameOverModalElement) : null;
        this.victoryModal = victoryModalElement ? new bootstrap.Modal(victoryModalElement) : null;
        
        this.finalScoreElement = document.getElementById('final-score');
        this.bestTileElement = document.getElementById('best-tile');
        this.victoryScoreElement = document.getElementById('victory-score');
    }

    setupEventListeners() {
        if (!this.boardElement) return;
        // Keyboard controls
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        // Touch controls
        let touchStartX = 0, touchStartY = 0;
        this.boardElement.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }, { passive: false });
        this.boardElement.addEventListener('touchend', (e) => {
            e.preventDefault();
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            this.handleSwipe(touchStartX, touchStartY, touchEndX, touchEndY);
        }, { passive: false });
        
        // Prevent default scroll on board
        this.boardElement.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });

        // Button controls
        this.newGameBtn?.addEventListener('click', () => this.newGame());
        this.undoBtn?.addEventListener('click', () => this.undo());
        this.replayBtn?.addEventListener('click', () => this.newGame());
        this.exportBtn?.addEventListener('click', () => this.exportGame());
        this.playbackBtn?.addEventListener('click', () => this.playbackRecordedGame());
        this.continueBtn?.addEventListener('click', () => {
            this.keepPlaying = true;
            this.saveGameState(false);
            this.render();
        });

        // Language toggle
        document.querySelectorAll('input[name="language"]').forEach(radio => {
            radio.addEventListener('change', (e) => changeLanguage(e.target.value));
        });

        // Theme toggle
        document.getElementById('theme-toggle')?.addEventListener('click', () => this.toggleTheme());

        document.getElementById('recording-file')?.addEventListener('change', (event) => {
            this.loadPlaybackFile(event.target.files[0]);
        });
        document.getElementById('start-playback-btn')?.addEventListener('click', () => this.playbackRecordedGame());
    }

    // ============================================
    // GAME LOGIC
    // ============================================

    newGame() {
        this.finishAnimation();
        this.gameOverModal?.hide();
        this.victoryModal?.hide();
        clearInterval(this.playbackTimer);
        this.playbackTimer = null;
        this.keepPlaying = false;
        this.board = Array(this.boardSize * this.boardSize).fill(0);
        this.score = 0;
        this.gameOver = false;
        this.won = false;
        this.history = [];
        this.resetRecordingSession();
        
        this.addNewTile();
        this.addNewTile();
        this.recordingSession.initialState = {
            ...this.getCurrentSnapshot(),
            move: null,
            timestamp: this.recordingSession.startedAt
        };
        
        this.saveGameState();
        this.render();
    }

    addNewTile() {
        const emptyCells = [];
        for (let i = 0; i < this.board.length; i++) {
            if (this.board[i] === 0) {
                emptyCells.push(i);
            }
        }
        
        if (emptyCells.length > 0) {
            const randomIndex = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            this.board[randomIndex] = Math.random() < 0.9 ? 2 : 4;
        }
    }

    handleKeyPress(e) {
        if (e.target?.closest('input, textarea, select, [contenteditable="true"]') ||
            document.querySelector('.modal.show')) return;
        const direction = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' }[e.key];
        if (!direction) return;
        e.preventDefault();
        this.performMove(direction);
    }

    handleSwipe(startX, startY, endX, endY) {
        const dx = endX - startX, dy = endY - startY;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 30) return;
        this.performMove(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
    }

    performMove(direction) {
        if (this.mode !== 'game' || this.playbackTimer || this.gameOver || (this.won && !this.keepPlaying)) return false;
        this.finishAnimation();
        const previousBoard = [...this.board];
        const scoreBefore = this.score;
        if (!this.move(direction)) return false;
        this.addNewTile();
        this.checkGameState();
        this.recordMove(direction, previousBoard, scoreBefore);
        this.saveGameState();
        this.updateScore();
        this.animateMove(previousBoard);
        return true;
    }

    // A deterministic move: spawning and recording belong to performMove.
    move(direction) {
        if (!['left', 'right', 'up', 'down'].includes(direction)) return false;
        const before = [...this.board];
        this.moveAnimations = [];
        for (let line = 0; line < this.boardSize; line++) {
            const indices = Array.from({ length: this.boardSize }, (_, offset) => {
                const position = direction === 'right' || direction === 'down' ? this.boardSize - 1 - offset : offset;
                return direction === 'left' || direction === 'right' ? line * this.boardSize + position : position * this.boardSize + line;
            });
            const tiles = indices.filter(index => before[index] !== 0);
            indices.forEach(index => { this.board[index] = 0; });
            let destination = 0;
            for (let i = 0; i < tiles.length; i++) {
                const from = tiles[i], to = indices[destination++];
                const merged = i + 1 < tiles.length && before[from] === before[tiles[i + 1]];
                this.board[to] = before[from] * (merged ? 2 : 1);
                this.moveAnimations.push({ from, to });
                if (merged) {
                    this.score += this.board[to];
                    this.moveAnimations.push({ from: tiles[++i], to });
                }
            }
        }
        return before.some((value, index) => value !== this.board[index]);
    }

    moveLeft() { return this.move('left'); }
    moveRight() { return this.move('right'); }
    moveUp() { return this.move('up'); }
    moveDown() { return this.move('down'); }

    checkGameState() {
        // Check for 2048
        if (!this.won && this.board.some(val => val === 2048)) {
            this.won = true;
        }

        this.gameOver = false;
        // Check if any moves are possible
        if (!this.board.some(val => val === 0)) {
            // Check for possible merges
            let canMove = false;
            
            for (let i = 0; i < this.boardSize; i++) {
                for (let j = 0; j < this.boardSize; j++) {
                    const idx = i * this.boardSize + j;
                    const current = this.board[idx];
                    
                    // Check right neighbor
                    if (j < this.boardSize - 1 && current === this.board[idx + 1]) {
                        canMove = true;
                    }
                    
                    // Check bottom neighbor
                    if (i < this.boardSize - 1 && current === this.board[idx + this.boardSize]) {
                        canMove = true;
                    }
                }
            }
            
            if (!canMove) {
                this.gameOver = true;
            }
        }
    }

    // ============================================
    // UNDO FUNCTIONALITY
    // ============================================

    createRecordingSession() {
        const startedAt = new Date().toISOString();
        return {
            version: 3,
            startedAt,
            initialState: {
                ...this.getCurrentSnapshot(),
                move: null,
                timestamp: startedAt
            },
            moves: []
        };
    }

    resetRecordingSession() {
        this.recordingSession = this.createRecordingSession();
    }

    getCurrentSnapshot() {
        return {
            board: [...this.board],
            score: this.score,
            gameOver: this.gameOver,
            won: this.won
        };
    }

    recordMove(direction, previousBoard, scoreBefore) {
        if (!this.recordingSession) {
            this.recordingSession = this.createRecordingSession();
        }

        if (!this.recordingSession.initialState) {
            this.recordingSession.initialState = this.getCurrentSnapshot();
        }

        this.recordingSession.moves.push({
            move: direction,
            timestamp: new Date().toISOString(),
            previousBoard: [...previousBoard],
            board: [...this.board],
            scoreBefore,
            scoreAfter: this.score,
            gameOver: this.gameOver,
            won: this.won
        });
    }

    playbackRecordedGame() {
        this.finishAnimation();
        if (!this.recordingSession || !this.recordingSession.initialState) {
            return;
        }

        if (this.playbackTimer) {
            clearInterval(this.playbackTimer);
            this.playbackTimer = null;
        }

        this.playbackIndex = 0;
        this.board = [...this.recordingSession.initialState.board];
        this.score = this.recordingSession.initialState.score;
        this.gameOver = false;
        this.won = false;
        this.updateScore();
        this.renderBoard();

        if (!this.recordingSession.moves.length) {
            return;
        }

        this.playbackTimer = window.setInterval(() => {
            if (this.playbackIndex >= this.recordingSession.moves.length) {
                clearInterval(this.playbackTimer);
                this.playbackTimer = null;
                return;
            }

            const frame = this.recordingSession.moves[this.playbackIndex];
            const previousBoard = [...this.board];
            this.move(frame.move);
            this.board = [...frame.board];
            this.score = frame.scoreAfter;
            this.gameOver = frame.gameOver;
            this.won = frame.won;
            this.playbackIndex += 1;
            this.updateScore();
            this.animateMove(previousBoard);
        }, 700);
    }

    validBoard(board) {
        return Array.isArray(board) && board.length === 16 && board.every(value =>
            Number.isSafeInteger(value) && (value === 0 || (value >= 2 && Number.isInteger(Math.log2(value)))));
    }

    loadPlaybackFile(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.addEventListener('load', () => {
            try {
                const data = JSON.parse(reader.result);
                if (!data.recording?.initialState || !Array.isArray(data.recording.moves)) {
                    throw new Error('Invalid recording');
                }
                if (data.version !== 3 || data.recording.version !== 3 ||
                    (data.game?.boardSize ?? 4) !== 4 ||
                    !this.validBoard(data.recording.initialState.board) ||
                    !Number.isFinite(data.recording.initialState.score) ||
                    !data.recording.moves.every(frame => frame && this.validBoard(frame.board) &&
                        ['left', 'right', 'up', 'down'].includes(frame.move) && Number.isFinite(frame.scoreAfter))) {
                    throw new Error('Invalid recording frames');
                }
                this.finishAnimation();
                clearInterval(this.playbackTimer);
                this.playbackTimer = null;
                this.recordingSession = data.recording;
                this.boardSize = data.game?.boardSize || 4;
                this.board = [...this.recordingSession.initialState.board];
                this.score = this.recordingSession.initialState.score;
                this.gameOver = false;
                this.won = false;
                const startButton = document.getElementById('start-playback-btn');
                if (startButton) startButton.disabled = false;
                const status = document.getElementById('playback-status');
                if (status) status.textContent = `${file.name} (${this.recordingSession.moves.length} mosse)`;
                this.updateScore();
                this.renderBoard();
            } catch (error) {
                console.error('Error loading playback file:', error);
                const status = document.getElementById('playback-status');
                if (status) status.textContent = 'File .2048.json non valido';
            }
        });
        reader.readAsText(file);
    }

    exportGame() {
        const generatedAt = new Date().toISOString();
        const exportData = {
            version: 3,
            generatedAt,
            exportedAt: generatedAt,
            game: {
                boardSize: this.boardSize,
                board: [...this.board],
                score: this.score,
                gameOver: this.gameOver,
                won: this.won,
                bestScore: parseInt(localStorage.getItem('2048_bestScore') || '0', 10),
                language: localStorage.getItem('2048_language') || 'it',
                theme: localStorage.getItem('2048_theme') || 'light'
            },
            recording: this.recordingSession
        };

        const blob = new Blob([JSON.stringify(exportData)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `2048-game-${Date.now()}.2048.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    undo() {
        if (this.history.length <= 1) return;
        
        this.finishAnimation();
        this.gameOverModal?.hide();
        this.victoryModal?.hide();
        this.history.pop(); // Remove current state
        const previousState = this.history[this.history.length - 1];
        
        this.board = JSON.parse(JSON.stringify(previousState.board));
        this.score = previousState.score;
        this.gameOver = previousState.gameOver || false;
        this.won = previousState.won || false;
        this.keepPlaying = previousState.keepPlaying || false;
        this.recordingSession.moves.pop();
        this.saveGameState(false);
        this.updateUndoUI();
        this.render();
    }

    updateUndoUI() {
        const undoCount = Math.max(0, this.history.length - 1);
        if (this.undoCount) this.undoCount.textContent = undoCount;
        if (this.undoBtn) this.undoBtn.disabled = undoCount === 0;
    }

    // ============================================
    // RENDERING
    // ============================================

    render() {
        this.updateScore();
        this.renderBoard();
        if (this.mode !== 'game') return;
        this.updateUndoUI();
        this.checkGameState();
        
        if (this.gameOver) {
            this.showGameOver();
        } else if (this.won && !this.keepPlaying) {
            this.showVictory();
        }
    }

    updateScore() {
        if (!this.scoreElement) return;
        // Trigger animation by removing and re-adding the animation class
        this.scoreElement.style.animation = 'none';
        setTimeout(() => {
            if (this.scoreElement) {
                this.scoreElement.textContent = this.score;
                this.scoreElement.style.animation = 'scoreUpdate 0.3s ease-out';
            }
        }, 10);
        
        const bestScore = parseInt(localStorage.getItem('2048_bestScore') || '0', 10);
        if (this.mode === 'game' && this.score > bestScore) {
            localStorage.setItem('2048_bestScore', this.score);
        }
        
        if (this.bestScoreElement) {
            this.bestScoreElement.textContent = Math.max(this.score, bestScore);
        }
    }

    finishAnimation() {
        if (this.animationTimer === null) return;
        clearTimeout(this.animationTimer);
        this.animationTimer = null;
        this.render();
    }

    animateMove(previousBoard) {
        this.renderBoard(previousBoard);
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !this.boardElement.animate) {
            this.render();
            return;
        }
        const cells = [...this.boardElement.children];
        const origin = this.boardElement.getBoundingClientRect();
        for (const { from, to } of this.moveAnimations) {
            const source = cells[from].getBoundingClientRect();
            const target = cells[to].getBoundingClientRect();
            const tile = this.createTile(previousBoard[from]);
            tile.classList.add('sliding-tile');
            Object.assign(tile.style, {
                left: `${source.left - origin.left}px`, top: `${source.top - origin.top}px`,
                width: `${source.width}px`, height: `${source.height}px`
            });
            this.boardElement.appendChild(tile);
            cells[from].textContent = '';
            cells[from].removeAttribute('data-value');
            tile.animate([
                { transform: 'translate(0, 0)' },
                { transform: `translate(${target.left - source.left}px, ${target.top - source.top}px)` }
            ], { duration: 140, easing: 'ease-out', fill: 'forwards' });
        }
        this.animationTimer = setTimeout(() => {
            this.animationTimer = null;
            this.render();
        }, 150);
    }

    createTile(value) {
        const tile = document.createElement('div');
        tile.className = 'tile';
        if (value) {
            tile.dataset.value = value;
            tile.textContent = value;
        }
        return tile;
    }

    renderBoard(board = this.board) {
        this.boardElement.replaceChildren(...board.map((value, index) => {
            const tile = this.createTile(value);
            tile.id = `tile-${index}`;
            return tile;
        }));
    }

    showGameOver() {
        if (!this.gameOverModal) return;
        const bestTile = Math.max(...this.board);
        this.finalScoreElement.textContent = this.score;
        this.bestTileElement.textContent = bestTile;
        this.gameOverModal.show();
    }

    showVictory() {
        if (!this.victoryModal) return;
        this.victoryScoreElement.textContent = this.score;
        this.victoryModal.show();
    }

    // ============================================
    // STORAGE
    // ============================================

    saveGameState(addHistory = true) {
        if (addHistory) {
            this.history.push({ ...this.getCurrentSnapshot(), keepPlaying: this.keepPlaying });
            if (this.history.length > this.maxHistory + 1) this.history.shift();
        }

        // Save to localStorage
        const gameData = {
            board: this.board,
            score: this.score,
            gameOver: this.gameOver,
            won: this.won,
            keepPlaying: this.keepPlaying,
            history: this.history,
            recording: this.recordingSession
        };
        
        localStorage.setItem('2048_gameState', JSON.stringify(gameData));
        this.updateUndoUI();
    }

    loadGameState() {
        const savedData = localStorage.getItem('2048_gameState');
        
        if (savedData) {
            try {
                const gameData = JSON.parse(savedData);
                if (!this.validBoard(gameData.board)) throw new Error("Invalid saved board");
                this.board = gameData.board;
                this.keepPlaying = gameData.keepPlaying || false;
                this.score = gameData.score || 0;
                this.gameOver = gameData.gameOver || false;
                this.won = gameData.won || false;
                this.history = gameData.history || [];
                this.recordingSession = gameData.recording || this.createRecordingSession();
                if (!this.recordingSession.initialState) {
                    this.recordingSession.initialState = {
                        ...this.getCurrentSnapshot(),
                        move: null,
                        timestamp: this.recordingSession.startedAt || new Date().toISOString()
                    };
                }
            } catch (e) {
                console.error('Error loading game state:', e);
                this.newGame();
            }
        } else {
            this.newGame();
        }
    }

    // ============================================
    // THEME
    // ============================================

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('2048_theme', newTheme);
        
        updateThemeButton(newTheme);
    }

    initializeTheme() {
        const savedTheme = localStorage.getItem('2048_theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        updateThemeButton(savedTheme);
    }


}

// ============================================
// INITIALIZATION
// ============================================

function initializeGame() {
    const page = document.documentElement.dataset.page;
    if (page === 'landing') {
        initializeTheme();
        document.querySelectorAll('input[name="language"]').forEach(radio => {
            radio.addEventListener('change', event => changeLanguage(event.target.value));
        });
        document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);
        return;
    }
    const game = new Game2048({ mode: page === 'playback' ? 'playback' : 'game' });
    game.initializeTheme();
}

function updateThemeButton(theme) {
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) themeBtn.innerHTML = `<i class="bi bi-${theme === 'dark' ? 'sun' : 'moon'}"></i>`;
}

function initializeTheme() {
    const savedTheme = localStorage.getItem('2048_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeButton(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('2048_theme', newTheme);
    updateThemeButton(newTheme);
}
initializeGame();