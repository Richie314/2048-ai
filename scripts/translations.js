// ============================================
// LOCALIZATION - TRANSLATIONS.JS
// ============================================

const translations = {
    it: {
        landingTitle: 'Raggiungi 2048',
        landingSubtitle: 'La partita classica, con salvataggio locale e replay delle tue mosse.',
        startGame: 'Inizia a giocare',
        openPlayback: 'Rivedi una partita',
        footerCredit: 'Demo realizzata da Riccardo Ciucci tramite GitHub Copilot.',
        sourceAvailable: 'Il codice sorgente è disponibile su',
        newGame: 'Nuova Partita',
        undo: 'Annulla',
        chooseFile: 'Apri partita',
        startPlayback: 'Avvia',
        choosePlaybackFile: 'Scegli un file .2048.json per visualizzare la partita',
        score: 'Punteggio',
        instructions: 'Istruzioni',
        instr1: 'Usa le frecce della tastiera o scorri il dito per muovere i blocchi',
        instr2: 'Combina i blocchi con lo stesso numero per creare numeri più grandi',
        instr3: "L'obiettivo è raggiungere 2048",
        instr4: 'Puoi annullare fino a 10 mosse precedenti',
        bestScore: 'Migliore',
        gameOver: 'Partita Terminata',
        finalScore: 'Punteggio finale',
        bestTile: 'Miglior blocco',
        close: 'Chiudi',
        playAgain: 'Gioca Ancora',
        victory: '🎉 Hai Vinto! 🎉',
        continue: 'Continua',
        exportGame: 'Esporta',
        playback: 'Rivedi',
    },
    en: {
        landingTitle: 'Reach 2048',
        landingSubtitle: 'The classic game, with local saves and replayable moves.',
        startGame: 'Start playing',
        openPlayback: 'Open playback',
        footerCredit: 'Demo made by Riccardo Ciucci via GitHub Copilot.',
        sourceAvailable: 'Source code available at',
        newGame: 'New Game',
        undo: 'Undo',
        chooseFile: 'Open game',
        startPlayback: 'Start',
        choosePlaybackFile: 'Choose a .2048.json file to view the game',
        score: 'Score',
        instructions: 'Instructions',
        instr1: 'Use arrow keys or swipe to move tiles',
        instr2: 'Combine tiles with the same number to create larger numbers',
        instr3: 'The goal is to reach the 2048 tile',
        instr4: 'You can undo up to 10 previous moves',
        bestScore: 'Best Score',
        gameOver: 'Game Over',
        finalScore: 'Final Score',
        bestTile: 'Best Tile',
        close: 'Close',
        playAgain: 'Play Again',
        victory: '🎉 You Won! 🎉',
        continue: 'Continue',
        exportGame: 'Export',
        playback: 'Playback',
    }
};

/**
 * Update all elements with data-i18n attribute using the specified language
 * @param {string} lang - Language code ('it' or 'en')
 */
function updateTranslations(lang) {
    const translation = translations[lang];
    
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translation[key]) {
            element.textContent = translation[key];
        }
    });

    // Re-initialize modals with updated text
    const gameOverElement = document.getElementById('gameOverModal');
    const victoryElement = document.getElementById('victoryModal');
    const gameOverModal = gameOverElement ? bootstrap.Modal.getInstance(gameOverElement) : null;
    const victoryModal = victoryElement ? bootstrap.Modal.getInstance(victoryElement) : null;
    
    if (gameOverModal) {
        gameOverModal.hide();
    }
    if (victoryModal) {
        victoryModal.hide();
    }
}

/**
 * Change the current language and save preference to localStorage
 * @param {string} lang - Language code ('it' or 'en')
 */
function changeLanguage(lang) {
    localStorage.setItem('2048_language', lang);
    document.documentElement.lang = lang;
    updateTranslations(lang);
}

/**
 * Initialize language from localStorage or use default (Italian)
 */
function initializeLanguage() {
    const savedLang = localStorage.getItem('2048_language') || 'it';
    document.documentElement.lang = savedLang;
    
    const langRadio = document.querySelector(`input[name="language"][value="${savedLang}"]`);
    if (langRadio) {
        langRadio.checked = true;
    }
    
    updateTranslations(savedLang);
}

initializeLanguage();

