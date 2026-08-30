import { buzz } from './game-utils.js';

// "Who Am I?" (من أنا؟) — flash-card game with difficulty levels.
// Each card shows a single clue about a person from the Bible.
// Clicking the card flips it to reveal that person's name.
// Difficulty levels: سهل (easy) / متوسط (medium) / صعب (hard).

import { WHOAMI_DEFAULT_POOL, WHOAMI_LEVEL_TO_ARABIC } from '../../data/games/whoami-data.js';

export const whoamiGameMixin = {
    createWhoamiGamePool() {
        return WHOAMI_DEFAULT_POOL.slice();
    },

    getWhoamiDifficulty(difficulty) {
        const normalized = (difficulty || 'medium').toLowerCase().trim() || 'medium';
        return WHOAMI_LEVEL_TO_ARABIC[normalized] || 'متوسط';
    },

    buildWhoamiGamePool(difficulty = 'medium') {
        const sourcePool = this.whoamiGamePool && this.whoamiGamePool.length
            ? this.whoamiGamePool
            : this.createWhoamiGamePool();
        const targetLevel = this.getWhoamiDifficulty(difficulty);
        const filtered = sourcePool.filter(person => person.difficulty === targetLevel);
        return filtered.length > 0 ? filtered : sourcePool;
    },

    pickWhoamiPerson() {
        const select = document.getElementById('whoami-difficulty-select');
        const difficulty = (select && select.value) || 'medium';
        const pool = this.buildWhoamiGamePool(difficulty);
        if (!pool.length) return null;

        if (!this.whoamiUsedPersons) this.whoamiUsedPersons = new Set();
        const available = pool.filter(person => !this.whoamiUsedPersons.has(person.name));
        const eligible = available.length > 0 ? available : pool;

        // Once every person in this level has been shown, start a new cycle.
        if (available.length === 0) this.whoamiUsedPersons.clear();

        const person = eligible[Math.floor(Math.random() * eligible.length)];
        this.whoamiUsedPersons.add(person.name);
        this.whoamiGameState.poolSize = pool.length;
        return person;
    },

    persistWhoamiGamePreferences() {
        const difficultySelect = document.getElementById('whoami-difficulty-select');
        if (difficultySelect) {
            localStorage.setItem(this.whoamiGameDifficultyKey, difficultySelect.value);
        }
    },

    loadWhoamiGamePreferences() {
        const savedDifficulty = localStorage.getItem(this.whoamiGameDifficultyKey) || 'medium';
        const difficultySelect = document.getElementById('whoami-difficulty-select');
        if (difficultySelect) difficultySelect.value = savedDifficulty;
        if (this.whoamiGameState) this.whoamiGameState.difficulty = savedDifficulty;
    },

    setWhoamiGradeButtons(enabled) {
        const knewBtn = document.getElementById('whoami-knew-btn');
        const didntBtn = document.getElementById('whoami-didnt-btn');
        if (knewBtn) knewBtn.disabled = !enabled;
        if (didntBtn) didntBtn.disabled = !enabled;
    },

    resetWhoamiFlip() {
        const card = document.getElementById('whoami-flip-card');
        if (card) {
            card.classList.remove('flipped');
            card.removeAttribute('aria-pressed');
        }
        if (this.whoamiGameState) {
            this.whoamiGameState.revealed = false;
            this.whoamiGameState.graded = false;
        }
        this.setWhoamiGradeButtons(false);
    },

    gradeWhoamiCard(knew) {
        if (!this.whoamiGameState || !this.whoamiGameState.person) return;
        if (!this.whoamiGameState.revealed || this.whoamiGameState.graded) return;

        this.whoamiGameState.graded = true;
        if (knew) this.whoamiGameState.knewCount += 1;
        else this.whoamiGameState.didntCount += 1;
        buzz(20);

        this.updateWhoamiCounters();
        this.setWhoamiGradeButtons(false);

        const statusEl = document.getElementById('whoami-game-status');
        if (statusEl) {
            statusEl.textContent = knew
                ? 'أحسنت! احتسبت هذه الشخصية ضمن من عرفتهم.'
                : 'لا بأس، ستتعرف عليها في المرة القادمة.';
        }

        // Grading immediately moves to the next card — no "new card" click needed.
        this.nextWhoamiCard();
    },

    updateWhoamiCounters() {
        const st = this.whoamiGameState;
        const countEl = document.getElementById('whoami-game-count');
        const knewEl = document.getElementById('whoami-game-knew');
        const didntEl = document.getElementById('whoami-game-didnt');
        const scoreEl = document.getElementById('whoami-game-score');

        const answered = st.knewCount + st.didntCount;
        const score = answered ? Math.round((st.knewCount / answered) * 100) : 0;

        if (countEl) countEl.textContent = String(st.seenCount);
        if (knewEl) knewEl.textContent = String(st.knewCount);
        if (didntEl) didntEl.textContent = String(st.didntCount);
        if (scoreEl) scoreEl.textContent = `${score}%`;
    },

    startWhoamiGame() {
        if (!this.whoamiGameState) this.whoamiGameState = {};
        this.whoamiGameState.seenCount = 0;
        this.whoamiGameState.knewCount = 0;
        this.whoamiGameState.didntCount = 0;
        this.whoamiGameState.graded = false;
        if (this.whoamiUsedPersons) this.whoamiUsedPersons.clear();
        this.setWhoamiGradeButtons(false);
        this.updateWhoamiCounters();
        this.nextWhoamiCard();
    },

    nextWhoamiCard() {
        if (this.whoamiNextTimer) {
            clearTimeout(this.whoamiNextTimer);
            this.whoamiNextTimer = null;
        }

        const person = this.pickWhoamiPerson();
        if (!person) return;

        this.whoamiGameState.person = person;
        this.whoamiGameState.seenCount += 1;
        this.updateWhoamiCounters();

        const nextBtn = document.getElementById('whoami-next-btn');
        if (nextBtn) nextBtn.disabled = true;

        // If the card is showing the previous answer, flip it back to the clue
        // first and wait for the animation to finish before swapping in the new
        // content — otherwise the next answer flashes on the back mid-flip.
        const card = document.getElementById('whoami-flip-card');
        const wasFlipped = card && card.classList.contains('flipped');
        this.resetWhoamiFlip();

        if (wasFlipped) {
            this.whoamiNextTimer = setTimeout(() => {
                this.whoamiNextTimer = null;
                this.loadWhoamiCardContent();
            }, 600);
        } else {
            this.loadWhoamiCardContent();
        }
    },

    loadWhoamiCardContent() {
        const person = this.whoamiGameState.person;
        if (!person) return;

        const clueEl = document.getElementById('whoami-game-clue-text');
        const answerEl = document.getElementById('whoami-game-answer');
        const categoryEl = document.getElementById('whoami-game-category');
        const statusEl = document.getElementById('whoami-game-status');

        if (clueEl) clueEl.textContent = person.clue;
        if (answerEl) answerEl.textContent = person.name;
        if (categoryEl) categoryEl.textContent = person.category;
        if (statusEl) statusEl.textContent = 'اقرأ التلميح وقلّب البطاقة، ثم حدد: هل عرفتها؟';

        // The card is ready — allow skipping it with "بطاقة جديدة".
        const nextBtn = document.getElementById('whoami-next-btn');
        if (nextBtn) nextBtn.disabled = false;
    },

    flipWhoamiCard() {
        if (!this.whoamiGameState || !this.whoamiGameState.person) return;

        const card = document.getElementById('whoami-flip-card');
        if (!card) return;

        card.classList.toggle('flipped');
        const flipped = card.classList.contains('flipped');
        this.whoamiGameState.revealed = flipped;

        const statusEl = document.getElementById('whoami-game-status');
        if (flipped) {
            card.setAttribute('aria-pressed', 'true');
            if (statusEl) statusEl.textContent = `الشخصية هي: ${this.whoamiGameState.person.name} — اسحب البطاقة يسارًا (عرفتها) أو يمينًا (لم أعرفها).`;
            this.setWhoamiGradeButtons(true);
        } else {
            card.removeAttribute('aria-pressed');
            if (statusEl) statusEl.textContent = 'اقرأ التلميح وقلّب البطاقة، ثم حدد: هل عرفتها؟';
            this.setWhoamiGradeButtons(false);
        }
    }
};