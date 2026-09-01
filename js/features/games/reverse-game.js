import {
    buildTermPool,
    createBibleTermPools,
    getAnswerVariants,
    matchesDifficulty,
    normalizeAnswerText,
    reverseCharacters
} from './game-utils.js';

export const reverseGameMixin = {
    createReverseGamePool() {
        return createBibleTermPools();
    },

    normalizeReverseGameText(text) {
        return normalizeAnswerText(text);
    },

    getReverseAnswerVariants(text) {
        return getAnswerVariants(text);
    },

    reverseCharacters(text) {
        return reverseCharacters(text);
    },

    persistReverseGamePreferences() {
        const categorySelect = document.getElementById('reverse-category-select');
        const difficultySelect = document.getElementById('reverse-difficulty-select');
        localStorage.setItem(this.reverseGameCategoryKey, categorySelect.value);
        localStorage.setItem(this.reverseGameDifficultyKey, difficultySelect.value);
    },

    loadReverseGamePreferences() {
        const savedCategory = localStorage.getItem(this.reverseGameCategoryKey) || 'random';
        const savedDifficulty = localStorage.getItem(this.reverseGameDifficultyKey) || 'medium';
        const categorySelect = document.getElementById('reverse-category-select');
        const difficultySelect = document.getElementById('reverse-difficulty-select');

        if (categorySelect) categorySelect.value = savedCategory;
        if (difficultySelect) difficultySelect.value = savedDifficulty;

        this.reverseGameState.category = savedCategory;
        this.reverseGameState.difficulty = savedDifficulty;

        const savedStateRaw = localStorage.getItem(this.reverseGameStateKey);
        if (savedStateRaw) {
            try {
                const savedState = JSON.parse(savedStateRaw);
                if (savedState && savedState.term) {
                    this.reverseGameState = { ...this.reverseGameState, ...savedState };
                }
            } catch (error) {
                console.warn('Failed to restore reverse game state', error);
            }
        }
    },

    persistReverseGameState() {
        if (!this.reverseGameState.term) return;
        localStorage.setItem(this.reverseGameStateKey, JSON.stringify(this.reverseGameState));
    },

    buildReverseGamePool(category, difficulty = 'medium') {
        const sourcePool = this.reverseGamePool || createBibleTermPools();
        return buildTermPool(sourcePool, category, difficulty);
    },

    pickReverseGameTerm() {
        const category = document.getElementById('reverse-category-select').value || 'random';
        const difficulty = document.getElementById('reverse-difficulty-select').value || 'medium';
        const pool = this.buildReverseGamePool(category, difficulty);
        if (!pool.length) return null;

        if (!this.termGameUsedTerms) this.termGameUsedTerms = new Set();

        // Filter out terms already used in this session
        const available = pool.filter(entry => !this.termGameUsedTerms.has(entry.term));
        const eligiblePool = available.length > 0 ? available : pool;

        // If we've exhausted all terms, reset the tracker for a new cycle
        if (available.length === 0) {
            this.termGameUsedTerms.clear();
        }

        const selected = eligiblePool[Math.floor(Math.random() * eligiblePool.length)];
        this.termGameUsedTerms.add(selected.term);
        return selected;
    },

    startReverseGame() {
        // Cancel any pending auto-advance from a previous correct answer.
        if (this.reverseAutoAdvanceTimer) {
            clearTimeout(this.reverseAutoAdvanceTimer);
            this.reverseAutoAdvanceTimer = null;
        }

        const selected = this.pickReverseGameTerm();
        if (!selected) {
            document.getElementById('reverse-game-status').textContent = 'لا توجد كلمات متاحة لهذه الفئة.';
            return;
        }

        const reversed = this.reverseCharacters(selected.term);
        this.reverseGameState = {
            term: selected.term,
            clue: reversed,
            category: selected.category,
            difficulty: document.getElementById('reverse-difficulty-select').value || 'medium',
            lastScore: 0,
            answers: selected.answers || this.getReverseAnswerVariants(selected.term)
        };

        document.getElementById('reverse-game-clue').textContent = reversed;
        document.getElementById('reverse-game-category').textContent = selected.category;
        document.getElementById('reverse-game-answer').value = '';
        document.getElementById('reverse-game-answer').disabled = false;
        document.getElementById('reverse-check-btn').disabled = true;
        document.getElementById('reverse-reveal-btn').disabled = false;
        // The word is ready — "كلمة جديدة" now works as a skip.
        document.getElementById('reverse-next-btn').disabled = false;
        document.getElementById('reverse-game-status').textContent = 'اقرأ الكلمة المعكوسة واكتب الإجابة الصحيحة.';
        document.getElementById('reverse-game-score').textContent = '0%';
        this.startReverseGameTimer();
        this.persistReverseGameState();
    },

    startReverseGameTimer() {
        const timerEl = document.getElementById('reverse-game-timer');
        this.stopReverseGameTimer();
        this.reverseGameStartTime = Date.now();
        this.reverseGameTimer = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.reverseGameStartTime) / 1000);
            const minutes = String(Math.floor(elapsed / 60)).padStart(2, '0');
            const seconds = String(elapsed % 60).padStart(2, '0');
            timerEl.textContent = `${minutes}:${seconds}`;
        }, 1000);
    },

    stopReverseGameTimer() {
        if (this.reverseGameTimer) {
            clearInterval(this.reverseGameTimer);
            this.reverseGameTimer = null;
        }
    },

    calcReverseScore() {
        const elapsed = Math.floor((Date.now() - this.reverseGameStartTime) / 1000);
        return Math.max(10, 100 - elapsed);
    },

    checkReverseGameAnswer() {
        if (!this.reverseGameState.term) {
            this.showValidationMessage('ابدأ لعبة الكلمات المعكوسة أولاً.', 'error');
            return;
        }

        const isCorrect = this.isReverseAnswerCorrect(document.getElementById('reverse-game-answer').value);
        const score = isCorrect ? this.calcReverseScore() : 0;

        this.reverseGameState.lastScore = score;
        document.getElementById('reverse-game-status').textContent = isCorrect
            ? 'إجابة صحيحة. أحسنت.'
            : 'إجابة غير صحيحة. جرّب مرة أخرى.';
        document.getElementById('reverse-game-score').textContent = `${score}%`;
        this.persistReverseGameState();
        this.stopReverseGameTimer();
        document.getElementById('reverse-check-btn').disabled = true;
        document.getElementById('reverse-next-btn').disabled = false;

        if (isCorrect) {
            document.getElementById('reverse-reveal-btn').disabled = true;
            const answerInput = document.getElementById('reverse-game-answer');
            if (answerInput) answerInput.disabled = true;
            // Correct answers flow straight into the next word — no click needed.
            this.scheduleReverseAutoAdvance();
        }
    },

    isReverseAnswerCorrect(value) {
        if (!this.reverseGameState.term) return false;
        const userAnswer = this.normalizeReverseGameText(value);
        const expectedAnswers = this.reverseGameState.answers?.length
            ? this.reverseGameState.answers
            : this.getReverseAnswerVariants(this.reverseGameState.term);
        return expectedAnswers.some(answer => userAnswer === answer);
    },

    // Live auto-check: called on every keystroke, grades the moment the typed
    // answer matches — the check button becomes optional.
    maybeAutoCheckReverseAnswer() {
        if (!this.reverseGameState.term || this.reverseGameState.lastScore) return;
        const answerInput = document.getElementById('reverse-game-answer');
        if (!answerInput || answerInput.disabled) return;
        if (this.isReverseAnswerCorrect(answerInput.value)) {
            this.checkReverseGameAnswer();
        }
    },

    scheduleReverseAutoAdvance() {
        if (this.reverseAutoAdvanceTimer) clearTimeout(this.reverseAutoAdvanceTimer);
        this.reverseAutoAdvanceTimer = setTimeout(() => {
            this.reverseAutoAdvanceTimer = null;
            this.startReverseGame();
        }, 900);
    },

    revealReverseGameAnswer() {
        if (!this.reverseGameState.term) return;

        document.getElementById('reverse-game-answer').value = this.reverseGameState.term;
        document.getElementById('reverse-game-status').textContent = 'تم إظهار الإجابة الصحيحة.';
        document.getElementById('reverse-reveal-btn').disabled = true;
        this.stopReverseGameTimer();
    }
};
