import {
    buildTermPool,
    createBibleTermPools,
    getAnswerVariants,
    normalizeAnswerText,
    scrambleText
} from './game-utils.js';

export const scrambleGameMixin = {
    persistScrambleGamePreferences() {
        const categorySelect = document.getElementById('scramble-category-select');
        const difficultySelect = document.getElementById('scramble-difficulty-select');
        localStorage.setItem(this.scrambleGameCategoryKey, categorySelect.value);
        localStorage.setItem(this.scrambleGameDifficultyKey, difficultySelect.value);
    },

    loadScrambleGamePreferences() {
        const savedCategory = localStorage.getItem(this.scrambleGameCategoryKey) || 'random';
        const savedDifficulty = localStorage.getItem(this.scrambleGameDifficultyKey) || 'medium';
        const categorySelect = document.getElementById('scramble-category-select');
        const difficultySelect = document.getElementById('scramble-difficulty-select');

        if (categorySelect) categorySelect.value = savedCategory;
        if (difficultySelect) difficultySelect.value = savedDifficulty;

        this.scrambleGameState.category = savedCategory;
        this.scrambleGameState.difficulty = savedDifficulty;

        const savedScore = parseInt(localStorage.getItem(this.scrambleGameHighScoreKey) || '0', 10) || 0;
        const highScoreEl = document.getElementById('scramble-game-high-score');
        if (highScoreEl) highScoreEl.textContent = `${savedScore}%`;

        const savedStateRaw = localStorage.getItem(this.scrambleGameStateKey);
        if (savedStateRaw) {
            try {
                const savedState = JSON.parse(savedStateRaw);
                if (savedState && savedState.term) {
                    this.scrambleGameState = { ...this.scrambleGameState, ...savedState };
                }
            } catch (error) {
                console.warn('Failed to restore scramble game state', error);
            }
        }
    },

    persistScrambleGameState() {
        if (!this.scrambleGameState.term) return;
        localStorage.setItem(this.scrambleGameStateKey, JSON.stringify(this.scrambleGameState));
    },

    updateScrambleHighScore(score) {
        const currentBest = parseInt(localStorage.getItem(this.scrambleGameHighScoreKey) || '0', 10) || 0;
        if (score > currentBest) {
            localStorage.setItem(this.scrambleGameHighScoreKey, String(score));
            document.getElementById('scramble-game-high-score').textContent = `${score}%`;
        }
    },

    buildScrambleGamePool(category, difficulty = 'medium') {
        const sourcePool = this.reverseGamePool || createBibleTermPools();
        return buildTermPool(sourcePool, category, difficulty);
    },

    pickScrambleGameTerm() {
        const category = document.getElementById('scramble-category-select').value || 'random';
        const difficulty = document.getElementById('scramble-difficulty-select').value || 'medium';
        const pool = this.buildScrambleGamePool(category, difficulty);
        if (!pool.length) return null;
        return pool[Math.floor(Math.random() * pool.length)];
    },

    startScrambleGame() {
        const selected = this.pickScrambleGameTerm();
        if (!selected) {
            document.getElementById('scramble-game-status').textContent = 'لا توجد كلمات متاحة لهذه الفئة.';
            return;
        }

        const scrambled = scrambleText(selected.term);
        this.scrambleGameState = {
            term: selected.term,
            clue: scrambled,
            category: selected.category,
            difficulty: document.getElementById('scramble-difficulty-select').value || 'medium',
            lastScore: 0,
            answers: selected.answers || getAnswerVariants(selected.term)
        };

        document.getElementById('scramble-game-clue').textContent = scrambled;
        document.getElementById('scramble-game-category').textContent = selected.category;
        document.getElementById('scramble-game-answer').value = '';
        document.getElementById('scramble-game-answer').disabled = false;
        document.getElementById('scramble-check-btn').disabled = true;
        document.getElementById('scramble-reveal-btn').disabled = false;
        document.getElementById('scramble-next-btn').disabled = true;
        document.getElementById('scramble-game-status').textContent = 'فك الحروف المبعثرة واكتب الكلمة الأصلية.';
        document.getElementById('scramble-game-score').textContent = '0%';
        this.startScrambleGameTimer();
        this.persistScrambleGameState();
    },

    startScrambleGameTimer() {
        const timerEl = document.getElementById('scramble-game-timer');
        this.stopScrambleGameTimer();
        this.scrambleGameStartTime = Date.now();
        this.scrambleGameTimer = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.scrambleGameStartTime) / 1000);
            const minutes = String(Math.floor(elapsed / 60)).padStart(2, '0');
            const seconds = String(elapsed % 60).padStart(2, '0');
            timerEl.textContent = `${minutes}:${seconds}`;
        }, 1000);
    },

    stopScrambleGameTimer() {
        if (this.scrambleGameTimer) {
            clearInterval(this.scrambleGameTimer);
            this.scrambleGameTimer = null;
        }
    },

    calcScrambleScore() {
        const elapsed = Math.floor((Date.now() - this.scrambleGameStartTime) / 1000);
        return Math.max(10, 100 - elapsed);
    },

    checkScrambleGameAnswer() {
        if (!this.scrambleGameState.term) {
            this.showValidationMessage('ابدأ لعبة الكلمات المبعثرة أولاً.', 'error');
            return;
        }

        const userAnswer = normalizeAnswerText(document.getElementById('scramble-game-answer').value);
        const expectedAnswers = this.scrambleGameState.answers?.length
            ? this.scrambleGameState.answers
            : getAnswerVariants(this.scrambleGameState.term);

        const isCorrect = expectedAnswers.some(answer => userAnswer === answer);
        const score = isCorrect ? this.calcScrambleScore() : 0;

        this.scrambleGameState.lastScore = score;
        document.getElementById('scramble-game-status').textContent = isCorrect
            ? 'إجابة صحيحة. أحسنت.'
            : 'إجابة غير صحيحة. جرّب مرة أخرى.';
        document.getElementById('scramble-game-score').textContent = `${score}%`;
        this.updateScrambleHighScore(score);
        this.persistScrambleGameState();
        this.stopScrambleGameTimer();
        document.getElementById('scramble-check-btn').disabled = true;
        document.getElementById('scramble-next-btn').disabled = false;
    },

    revealScrambleGameAnswer() {
        if (!this.scrambleGameState.term) return;

        document.getElementById('scramble-game-answer').value = this.scrambleGameState.term;
        document.getElementById('scramble-game-status').textContent = 'تم إظهار الإجابة الصحيحة.';
        document.getElementById('scramble-reveal-btn').disabled = true;
        this.stopScrambleGameTimer();
    }
};
