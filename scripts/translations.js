// ============================================
// LOCALIZATION - TRANSLATIONS.JS
// ============================================

const translations = {
    it: {
        score: 'Punteggio',
        instructions: 'Istruzioni',
        instr1: 'Usa le frecce della tastiera o scorri il dito per muovere i tile',
        instr2: 'Combina i tile con lo stesso numero per creare numeri più grandi',
        instr3: "L'obiettivo è raggiungere il tile 2048",
        instr4: 'Puoi annullare fino a 10 mosse precedenti',
        bestScore: 'Migliore',
        gameOver: 'Partita Terminata',
        finalScore: 'Punteggio finale',
        bestTile: 'Miglior tile',
        close: 'Chiudi',
        playAgain: 'Gioca Ancora',
        victory: '🎉 Hai Vinto! 🎉',
        continue: 'Continua',
        exportGame: 'Esporta .2048',
        playback: 'Playback',
    },
    en: {
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
        exportGame: 'Export .2048',
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
    const gameOverModal = bootstrap.Modal.getInstance(document.getElementById('gameOverModal'));
    const victoryModal = bootstrap.Modal.getInstance(document.getElementById('victoryModal'));
    
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

