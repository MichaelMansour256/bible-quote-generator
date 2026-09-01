import { buzz, scrambleText } from './game-utils.js';
import { createWordGameMixin } from './word-game.js';

// "الكلمات المبعثرة" — unscramble shuffled characters back into the original
// term, by typing or by tapping the letter tiles under the clue. The shared
// word-game machinery comes from the factory; this file keeps only the
// tap-to-build tile behaviour and the game-specific wording.
const sharedWordGameMixin = createWordGameMixin({
    prefix: 'scramble',
    stem: 'Scramble',
    clueTransform: term => scrambleText(term),
    notStartedStatus: 'ابدأ لعبة الكلمات المبعثرة أولاً.',
    readyStatus: 'فك الحروف المبعثرة واكتب الكلمة الأصلية.',
    onRoundStart() {
        this.buildScrambleTiles();
    },
    onReveal() {
        this.syncScrambleTileStates();
    }
});

export const scrambleGameMixin = {
    ...sharedWordGameMixin,

    // ── Tap-to-build letter tiles (mobile-friendly, no keyboard needed) ──

    buildScrambleTiles() {
        const container = document.getElementById('scramble-tiles');
        if (!container) return;

        const chars = Array.from(String(this.scrambleGameState.clue || '')).filter(ch => ch.trim());
        container.innerHTML = '';
        chars.forEach(char => {
            const tile = document.createElement('button');
            tile.type = 'button';
            tile.className = 'scramble-tile';
            tile.textContent = char;
            container.appendChild(tile);
        });
        this.syncScrambleTileStates();
    },

    handleScrambleTileClick(tileEl) {
        const input = document.getElementById('scramble-game-answer');
        if (!input || input.disabled || !this.scrambleGameState.term) return;
        if (!tileEl || tileEl.classList.contains('used')) return;

        input.value = this.insertScrambleWordGap(input.value) + tileEl.textContent;
        this.syncScrambleTileStates();
        buzz(15);
        input.dispatchEvent(new Event('input', { bubbles: true }));
    },

    scrambleBackspace() {
        const input = document.getElementById('scramble-game-answer');
        if (!input || input.disabled) return;

        input.value = String(input.value || '').slice(0, -1).replace(/\s+$/, '');
        this.syncScrambleTileStates();
        input.dispatchEvent(new Event('input', { bubbles: true }));
    },

    // Mark tiles as consumed greedily — stays in sync whether the answer was
    // built by tapping tiles or typed manually.
    syncScrambleTileStates() {
        const container = document.getElementById('scramble-tiles');
        const input = document.getElementById('scramble-game-answer');
        if (!container || !input) return;

        const tiles = Array.from(container.querySelectorAll('.scramble-tile'));
        const typed = Array.from(String(input.value || '')).filter(ch => ch.trim());
        const usedFlags = tiles.map(() => false);

        typed.forEach(char => {
            const matchIndex = tiles.findIndex((tile, index) => !usedFlags[index] && tile.textContent === char);
            if (matchIndex !== -1) usedFlags[matchIndex] = true;
        });

        tiles.forEach((tile, index) => tile.classList.toggle('used', usedFlags[index]));
    },

    getScrambleWordLengths() {
        return String(this.scrambleGameState.term || '')
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .map(word => Array.from(word).length);
    },

    // Multi-word terms: auto-insert the space when a word is completed, so
    // tapping tiles alone can produce the exact answer.
    insertScrambleWordGap(value) {
        const lengths = this.getScrambleWordLengths();
        if (lengths.length < 2 || !value || /\s$/.test(value)) return value;

        const typedLetters = Array.from(String(value)).filter(ch => ch.trim()).length;
        let cumulative = 0;
        for (let i = 0; i < lengths.length - 1; i++) {
            cumulative += lengths[i];
            if (typedLetters === cumulative) return `${value} `;
        }
        return value;
    }
};
