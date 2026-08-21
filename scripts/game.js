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
        this.tileAnimations = {}; // Track tile animations (position, state)
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
            this.won = false;
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
        this.board = Array(this.boardSize * this.boardSize).fill(0);
        this.score = 0;
        this.gameOver = false;
        this.won = false;
        this.history = [];
        this.resetRecordingSession();
        
        this.addNewTile();
        this.addNewTile();
        this.recordingSession.initialState = this.getCurrentSnapshot();
        
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
        if (this.gameOver || this.won) return;
        
        const key = e.key;
        let moved = false;
        let direction = null;
        
        if (key === 'ArrowLeft') {
            e.preventDefault();
            direction = 'left';
            moved = this.moveLeft();
        } else if (key === 'ArrowRight') {
            e.preventDefault();
            direction = 'right';
            moved = this.moveRight();
        } else if (key === 'ArrowUp') {
            e.preventDefault();
            direction = 'up';
            moved = this.moveUp();
        } else if (key === 'ArrowDown') {
            e.preventDefault();
            direction = 'down';
            moved = this.moveDown();
        }
        
        if (moved) {
            const previousBoard = [...this.board];
            const scoreBefore = this.score;
            this.addNewTile();
            this.checkGameState();
            this.recordMove(direction, previousBoard, scoreBefore);
            this.saveGameState();
            this.render();
        }
    }

    handleSwipe(startX, startY, endX, endY) {
        if (this.gameOver || this.won) return;
        
        const diffX = endX - startX;
        const diffY = endY - startY;
        const threshold = 50;
        
        let moved = false;
        let direction = null;
        
        if (Math.abs(diffX) > Math.abs(diffY)) {
            if (diffX > threshold) {
                direction = 'right';
                moved = this.moveRight();
            } else if (diffX < -threshold) {
                direction = 'left';
                moved = this.moveLeft();
            }
        } else {
            if (diffY > threshold) {
                direction = 'down';
                moved = this.moveDown();
            } else if (diffY < -threshold) {
                direction = 'up';
                moved = this.moveUp();
            }
        }
        
        if (moved) {
            const previousBoard = [...this.board];
            const scoreBefore = this.score;
            this.addNewTile();
            this.checkGameState();
            this.recordMove(direction, previousBoard, scoreBefore);
            this.saveGameState();
            this.render();
        }
    }

    moveLeft() {
        const oldBoard = JSON.parse(JSON.stringify(this.board));
        
        for (let row = 0; row < this.boardSize; row++) {
            const lineStartIdx = row * this.boardSize;
            const line = this.board.slice(lineStartIdx, lineStartIdx + this.boardSize);
            
            const moved = this.moveLine(line);
            
            for (let i = 0; i < this.boardSize; i++) {
                this.board[lineStartIdx + i] = line[i];
            }
        }
        
        return this.isBoardChanged(oldBoard);
    }

    moveRight() {
        const oldBoard = JSON.parse(JSON.stringify(this.board));
        
        for (let row = 0; row < this.boardSize; row++) {
            const lineStartIdx = row * this.boardSize;
            const line = this.board.slice(lineStartIdx, lineStartIdx + this.boardSize).reverse();
            
            this.moveLine(line);
            
            for (let i = 0; i < this.boardSize; i++) {
                this.board[lineStartIdx + i] = line[this.boardSize - 1 - i];
            }
        }
        
        return this.isBoardChanged(oldBoard);
    }

    moveUp() {
        const oldBoard = JSON.parse(JSON.stringify(this.board));
        
        for (let col = 0; col < this.boardSize; col++) {
            const line = [];
            for (let row = 0; row < this.boardSize; row++) {
                line.push(this.board[row * this.boardSize + col]);
            }
            
            this.moveLine(line);
            
            for (let row = 0; row < this.boardSize; row++) {
                this.board[row * this.boardSize + col] = line[row];
            }
        }
        
        return this.isBoardChanged(oldBoard);
    }

    moveDown() {
        const oldBoard = JSON.parse(JSON.stringify(this.board));
        
        for (let col = 0; col < this.boardSize; col++) {
            const line = [];
            for (let row = 0; row < this.boardSize; row++) {
                line.push(this.board[row * this.boardSize + col]);
            }
            
            line.reverse();
            this.moveLine(line);
            line.reverse();
            
            for (let row = 0; row < this.boardSize; row++) {
                this.board[row * this.boardSize + col] = line[row];
            }
        }
        
        return this.isBoardChanged(oldBoard);
    }

    moveLine(line) {
        // Remove zeros
        const nonZero = line.filter(val => val !== 0);
        
        // Merge adjacent equal values
        for (let i = 0; i < nonZero.length - 1; i++) {
            if (nonZero[i] === nonZero[i + 1]) {
                nonZero[i] *= 2;
                this.score += nonZero[i];
                nonZero.splice(i + 1, 1);
            }
        }
        
        // Add zeros at the end
        while (nonZero.length < this.boardSize) {
            nonZero.push(0);
        }
        
        // Copy back to line
        for (let i = 0; i < this.boardSize; i++) {
            line[i] = nonZero[i];
        }
    }

    isBoardChanged(oldBoard) {
        for (let i = 0; i < oldBoard.length; i++) {
            if (oldBoard[i] !== this.board[i]) {
                return true;
            }
        }
        return false;
    }

    checkGameState() {
        // Check for 2048
        if (!this.won && this.board.some(val => val === 2048)) {
            this.won = true;
        }

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
        return {
            version: 1,
            startedAt: new Date().toISOString(),
            initialState: this.getCurrentSnapshot(),
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
            direction,
            previousBoard: [...previousBoard],
            board: [...this.board],
            scoreBefore,
            scoreAfter: this.score,
            gameOver: this.gameOver,
            won: this.won
        });
    }

    playbackRecordedGame() {
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
            this.board = [...frame.board];
            this.score = frame.scoreAfter;
            this.gameOver = frame.gameOver;
            this.won = frame.won;
            this.playbackIndex += 1;
            this.updateScore();
            this.renderBoard();
        }, 700);
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
        const exportData = {
            version: 1,
            exportedAt: new Date().toISOString(),
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

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `2048-game-${Date.now()}.2048.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    saveGameState() {
        // Keep history limited to maxHistory moves
        if (this.history.length >= this.maxHistory) {
            this.history.shift();
        }
        
        this.history.push({
            board: JSON.parse(JSON.stringify(this.board)),
            score: this.score
        });
        
        const gameData = {
            board: this.board,
            score: this.score,
            gameOver: this.gameOver,
            won: this.won,
            history: this.history,
            recording: this.recordingSession
        };
        
        localStorage.setItem('2048_gameState', JSON.stringify(gameData));
        this.updateUndoUI();
    }

    undo() {
        if (this.history.length <= 1) return;
        
        this.history.pop(); // Remove current state
        const previousState = this.history[this.history.length - 1];
        
        this.board = JSON.parse(JSON.stringify(previousState.board));
        this.score = previousState.score;
        this.gameOver = false;
        this.won = false;
        
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
        this.checkGameState();
        
        if (this.gameOver) {
            this.showGameOver();
        } else if (this.won) {
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
        if (this.score > bestScore) {
            localStorage.setItem('2048_bestScore', this.score);
        }
        
        if (this.bestScoreElement) {
            this.bestScoreElement.textContent = Math.max(this.score, bestScore);
        }
    }

    renderBoard() {
        this.boardElement.innerHTML = '';
        
        // Track previous board state for animations
        const prevAnimations = { ...this.tileAnimations };
        this.tileAnimations = {};
        
        for (let i = 0; i < this.board.length; i++) {
            const tile = document.createElement('div');
            tile.className = 'tile';
            tile.id = `tile-${i}`;
            
            const value = this.board[i];
            
            if (value !== 0) {
                tile.setAttribute('data-value', value);
                tile.textContent = value;
                
                // Track tile animations
                const wasEmpty = !prevAnimations[i] || prevAnimations[i].value === 0;
                const wasMerged = prevAnimations[i]?.merged;
                const valueChanged = prevAnimations[i]?.value !== value;
                
                if (wasEmpty) {
                    // New tile spawned
                    tile.classList.add('new');
                    this.tileAnimations[i] = { value, merged: false };
                } else if (valueChanged && !wasMerged) {
                    // Tile merged (value increased)
                    tile.classList.add('merge');
                    this.tileAnimations[i] = { value, merged: true };
                } else {
                    // Tile moved or stayed
                    tile.classList.add('move');
                    this.tileAnimations[i] = { value, merged: false };
                }
            }
            
            this.boardElement.appendChild(tile);
        }
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

    saveGameState() {
        // Keep history limited to maxHistory moves
        if (this.history.length >= this.maxHistory) {
            this.history.shift();
        }
        
        this.history.push({
            board: JSON.parse(JSON.stringify(this.board)),
            score: this.score
        });
        
        // Save to localStorage
        const gameData = {
            board: this.board,
            score: this.score,
            gameOver: this.gameOver,
            won: this.won,
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
                this.board = gameData.board || Array(16).fill(0);
                this.score = gameData.score || 0;
                this.gameOver = gameData.gameOver || false;
                this.won = gameData.won || false;
                this.history = gameData.history || [];
                this.recordingSession = gameData.recording || this.createRecordingSession();
                if (!this.recordingSession.initialState) {
                    this.recordingSession.initialState = this.getCurrentSnapshot();
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