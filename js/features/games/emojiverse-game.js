import { buzz } from './game-utils.js';

// "EmojiVerse" (إيموجي آية) — emoji flash-card game with difficulty levels.
// The front of each card shows a set of emojis describing a Bible story,
// event, or verse. Clicking the card flips it to reveal the answer plus a
// short story summary.
// Difficulty levels: سهل (easy) / متوسط (medium) / صعب (hard).

import { EMOJIVERSE_DEFAULT_POOL, EMOJIVERSE_LEVEL_TO_ARABIC } from '../../data/games/emojiverse-data.js';

export const emojiverseGameMixin = {
    createEmojiverseGamePool() {
        return EMOJIVERSE_DEFAULT_POOL.slice();
    },

    getEmojiverseDifficulty(difficulty) {
        const normalized = (difficulty || 'medium').toLowerCase().trim() || 'medium';
        return EMOJIVERSE_LEVEL_TO_ARABIC[normalized] || 'متوسط';
    },

    buildEmojiverseGamePool(difficulty = 'medium') {
        const sourcePool = this.emojiverseGamePool && this.emojiverseGamePool.length
            ? this.emojiverseGamePool
            : this.createEmojiverseGamePool();
        const targetLevel = this.getEmojiverseDifficulty(difficulty);
        const filtered = sourcePool.filter(card => card.difficulty === targetLevel);
        return filtered.length > 0 ? filtered : sourcePool;
    },

    pickEmojiverseCard() {
        const select = document.getElementById('emojiverse-difficulty-select');
        const difficulty = (select && select.value) || 'medium';
        const pool = this.buildEmojiverseGamePool(difficulty);
        if (!pool.length) return null;

        if (!this.emojiverseUsedCards) this.emojiverseUsedCards = new Set();
        const available = pool.filter(card => !this.emojiverseUsedCards.has(card.emojis + card.answer));
        const eligible = available.length > 0 ? available : pool;

        // Once every card in this level has been shown, start a new cycle.
        if (available.length === 0) this.emojiverseUsedCards.clear();

        const card = eligible[Math.floor(Math.random() * eligible.length)];
        this.emojiverseUsedCards.add(card.emojis + card.answer);
        this.emojiverseGameState.poolSize = pool.length;
        return card;
    },

    persistEmojiverseGamePreferences() {
        const difficultySelect = document.getElementById('emojiverse-difficulty-select');
        if (difficultySelect) {
            localStorage.setItem(this.emojiverseGameDifficultyKey, difficultySelect.value);
        }
    },

    loadEmojiverseGamePreferences() {
        const savedDifficulty = localStorage.getItem(this.emojiverseGameDifficultyKey) || 'medium';
        const difficultySelect = document.getElementById('emojiverse-difficulty-select');
        if (difficultySelect) difficultySelect.value = savedDifficulty;
        if (this.emojiverseGameState) this.emojiverseGameState.difficulty = savedDifficulty;
    },

    setEmojiverseGradeButtons(enabled) {
        const knewBtn = document.getElementById('emojiverse-knew-btn');
        const didntBtn = document.getElementById('emojiverse-didnt-btn');
        if (knewBtn) knewBtn.disabled = !enabled;
        if (didntBtn) didntBtn.disabled = !enabled;
    },

    resetEmojiverseFlip() {
        const card = document.getElementById('emojiverse-flip-card');
        if (card) {
            card.classList.remove('flipped');
            card.removeAttribute('aria-pressed');
        }
        if (this.emojiverseGameState) {
            this.emojiverseGameState.revealed = false;
            this.emojiverseGameState.graded = false;
        }
        this.setEmojiverseGradeButtons(false);
    },

    gradeEmojiverseCard(knew) {
        if (!this.emojiverseGameState || !this.emojiverseGameState.card) return;
        if (!this.emojiverseGameState.revealed || this.emojiverseGameState.graded) return;

        this.emojiverseGameState.graded = true;
        if (knew) this.emojiverseGameState.knewCount += 1;
        else this.emojiverseGameState.didntCount += 1;
        buzz(20);

        this.updateEmojiverseCounters();
        this.setEmojiverseGradeButtons(false);

        const statusEl = document.getElementById('emojiverse-game-status');
        if (statusEl) {
            statusEl.textContent = knew
                ? 'أحسنت! احتسبت هذه البطاقة ضمن من عرفتها.'
                : 'لا بأس، ستتعرف على هذه القصة في المرة القادمة.';
        }

        // Grading immediately moves to the next card — no "new card" click needed.
        this.nextEmojiverseCard();
    },

    updateEmojiverseCounters() {
        const st = this.emojiverseGameState;
        const countEl = document.getElementById('emojiverse-game-count');
        const knewEl = document.getElementById('emojiverse-game-knew');
        const didntEl = document.getElementById('emojiverse-game-didnt');
        const scoreEl = document.getElementById('emojiverse-game-score');

        const answered = st.knewCount + st.didntCount;
        const score = answered ? Math.round((st.knewCount / answered) * 100) : 0;

        if (countEl) countEl.textContent = String(st.seenCount);
        if (knewEl) knewEl.textContent = String(st.knewCount);
        if (didntEl) didntEl.textContent = String(st.didntCount);
        if (scoreEl) scoreEl.textContent = `${score}%`;
    },

    startEmojiverseGame() {
        if (!this.emojiverseGameState) this.emojiverseGameState = {};
        this.emojiverseGameState.seenCount = 0;
        this.emojiverseGameState.knewCount = 0;
        this.emojiverseGameState.didntCount = 0;
        this.emojiverseGameState.graded = false;
        if (this.emojiverseUsedCards) this.emojiverseUsedCards.clear();
        this.setEmojiverseGradeButtons(false);
        this.updateEmojiverseCounters();
        this.nextEmojiverseCard();
    },

    nextEmojiverseCard() {
        if (this.emojiverseNextTimer) {
            clearTimeout(this.emojiverseNextTimer);
            this.emojiverseNextTimer = null;
        }

        const card = this.pickEmojiverseCard();
        if (!card) return;

        this.emojiverseGameState.card = card;
        this.emojiverseGameState.seenCount += 1;
        this.updateEmojiverseCounters();

        const nextBtn = document.getElementById('emojiverse-next-btn');
        if (nextBtn) nextBtn.disabled = true;

        // If the card is showing the previous answer, flip it back to the emojis
        // first and wait for the animation to finish before swapping in the new
        // content — otherwise the next answer flashes on the back mid-flip.
        const flipCard = document.getElementById('emojiverse-flip-card');
        const wasFlipped = flipCard && flipCard.classList.contains('flipped');
        this.resetEmojiverseFlip();

        if (wasFlipped) {
            this.emojiverseNextTimer = setTimeout(() => {
                this.emojiverseNextTimer = null;
                this.loadEmojiverseCardContent();
            }, 600);
        } else {
            this.loadEmojiverseCardContent();
        }
    },

    loadEmojiverseCardContent() {
        const card = this.emojiverseGameState.card;
        if (!card) return;

        const emojiEl = document.getElementById('emojiverse-game-emoji');
        const answerEl = document.getElementById('emojiverse-game-answer');
        const storyEl = document.getElementById('emojiverse-game-story');
        const categoryEl = document.getElementById('emojiverse-game-category');
        const statusEl = document.getElementById('emojiverse-game-status');

        if (emojiEl) emojiEl.textContent = card.emojis;
        if (answerEl) answerEl.textContent = card.answer;
        if (storyEl) storyEl.textContent = card.story;
        if (categoryEl) categoryEl.textContent = card.category;
        if (statusEl) statusEl.textContent = 'اقرأ الإيموجي وقلّب البطاقة، ثم حدّد: هل عرفتها؟';

        // The card is ready — allow skipping it with "بطاقة جديدة".
        const nextBtn = document.getElementById('emojiverse-next-btn');
        if (nextBtn) nextBtn.disabled = false;
    },

    flipEmojiverseCard() {
        if (!this.emojiverseGameState || !this.emojiverseGameState.card) return;

        const card = document.getElementById('emojiverse-flip-card');
        if (!card) return;

        card.classList.toggle('flipped');
        const flipped = card.classList.contains('flipped');
        this.emojiverseGameState.revealed = flipped;

        const statusEl = document.getElementById('emojiverse-game-status');
        if (flipped) {
            card.setAttribute('aria-pressed', 'true');
            if (statusEl) statusEl.textContent = `الإجابة: ${this.emojiverseGameState.card.answer} — اسحب البطاقة يسارًا (عرفتها) أو يمينًا (لم أعرفها).`;
            this.setEmojiverseGradeButtons(true);
        } else {
            card.removeAttribute('aria-pressed');
            if (statusEl) statusEl.textContent = 'اقرأ الإيموجي وقلّب البطاقة، ثم حدّد: هل عرفتها؟';
            this.setEmojiverseGradeButtons(false);
        }
    }
};






