# 2048 Game - HTML5 Version

A modern, responsive 2048 game built with vanilla JavaScript, Bootstrap 5.3, and a beautiful blue color palette.

## Features

✨ **Game Features:**
- Classic 2048 gameplay mechanics
- Swipe controls for mobile devices
- Keyboard arrow key controls
- Undo up to 10 previous moves
- Record every move and state for replay
- Export the current game as a .2048 JSON file
- Playback the recorded session from the beginning
- Score tracking and best score recording
- Smooth animations and transitions

🎨 **UI Features:**
- Mobile-first responsive design
- Light and Dark themes with blue palette
- Bilingual support (Italian and English)
- Language toggle without losing game data
- Accessibility-focused design

💾 **Data Persistence:**
- Game state saved to localStorage
- Best score tracking
- Language and theme preferences saved
- Full session state recovery on refresh

## How to Play

1. **Starting the Game:**
   - Open `index.html` in a web browser
   - Click "Nuova Partita" (New Game) or "New Game" to start

2. **Moving Tiles:**
   - **Desktop:** Use arrow keys (↑ ↓ ← →) to move tiles
   - **Mobile:** Swipe in any direction to move tiles
   - Tiles merge when two tiles with the same number touch

3. **Objective:**
   - Create larger numbers by merging tiles
   - Goal: Reach the 2048 tile
   - After reaching 2048, you can continue playing

4. **Undo Moves:**
   - Click the "Annulla" (Undo) button to go back up to 10 moves
   - The badge shows available undo moves
   - Cannot undo beyond the current game start

5. **Recording, Exporting & Playback:**
   - Every valid move is recorded separately from the undo history, so undoing does not erase the replay trail
   - Use the export button to download the current game as a JSON file with the .2048 extension
   - Use the playback button to replay the recorded session from the beginning

6. **Language & Theme:**
   - Toggle between Italian and English anytime
   - Switch between light and dark themes
   - Your preferences and game data are preserved

## File Structure

```
2048-ai/
├── index.html         # Main HTML structure and layout
├── styles/            # CSS styling, themes, animations, and responsive design
├── scripts/           # Game logic, state persistence, translations, and service worker
└── README.md          # This file
```

## Technical Details

### Languages
- **HTML5** - Semantic markup with Bootstrap 5.3
- **CSS3** - Custom properties for theming, responsive grid layout
- **Vanilla JavaScript** - No dependencies except Bootstrap for UI
- **localStorage** - For persistent data storage

### Color Palette (Blue)
- Light Theme: Sky blue to light blue gradient
- Dark Theme: Slate to dark blue gradient
- Tiles use various shades of blue for visual hierarchy

### Localization
- Italian (Default)
- English
- Localization strings are separated in `translations.js` for easy maintenance
- Easy to add more languages by extending the `translations` object

### Animations
The game features smooth, polished animations:
- **New Tiles**: Elastic pop-in animation with scale and opacity transitions
- **Merged Tiles**: Playful bounce animation with slight rotation
- **Moved Tiles**: Smooth linear movement with spring easing
- **Score Updates**: Scale pop animation when score increases
- **Button Interactions**: Ripple effect on click with hover lift effect
- All animations respect `prefers-reduced-motion` user preference

### Data Storage
All data is stored locally in the browser:
- `2048_gameState` - Current game board, score, history
- `2048_bestScore` - Best score achieved
- `2048_language` - Selected language preference
- `2048_theme` - Light/Dark theme preference

## Browser Compatibility

Works on all modern browsers:
- Chrome/Edge 88+
- Firefox 87+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile, Samsung Internet)

## Accessibility

- Keyboard navigation support
- Touch/gesture support for mobile
- Semantic HTML with proper ARIA labels
- Respects `prefers-reduced-motion` preference
- Sufficient color contrast in both themes
- Minimum touch target size (44x44px)

## Customization

### Add More Languages
Edit the `translations` object in `translations.js`:

```javascript
const translations = {
    it: { /* Italian translations */ },
    en: { /* English translations */ },
    es: { /* Add Spanish here */ }
};
```

Then update the language selector in `index.html`:

```html
<input type="radio" class="btn-check" name="language" id="lang-es" value="es">
<label class="btn btn-outline-primary btn-sm" for="lang-es">
    <i class="bi bi-globe"></i> Español
</label>
```

### Change Colors
Modify CSS custom properties in `styles.css`:

```css
:root {
    --primary-50: #f0f9ff;
    --primary-500: #0ea5e9;
    /* ... change these to your preferred colors ... */
}
```

### Adjust Undo Limit
In `game.js`, change the `maxHistory` value:

```javascript
this.maxHistory = 10; // Change to desired number
```

### Customize Animations
Modify animation keyframes in `styles.css`:

```css
@keyframes newTile {
    0% {
        transform: scale(0);
        opacity: 0;
    }
    /* ... adjust animation timing and transforms ... */
}
```

## Performance

- Lightweight (~20KB total with all libraries)
- No external game frameworks
- Smooth 60fps animations
- Minimal DOM manipulation
- Optimized render cycle

## Notes

- Game saves automatically after each move
- All data is stored locally - no server required
- Works completely offline after initial load
- localStorage has ~5-10MB limit (plenty for this game)
- Game continues indefinitely after reaching 2048 if desired

## Future Enhancements (Optional)

- Sound effects toggle
- Custom board sizes (3x3, 5x5)
- Leaderboard with multiple saved games
- Statistics tracking
- Share score functionality
- Multiplayer/Challenge modes

Enjoy the game! 🎮
