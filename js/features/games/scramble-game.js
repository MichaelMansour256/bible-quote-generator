import {
    buildTermPool,
    buzz,
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

    buildScrambleGamePool(category, difficulty = 'medium') {
        const sourcePool = this.reverseGamePool || createBibleTermPools();
        return buildTermPool(sourcePool, category, difficulty);
    },

    pickScrambleGameTerm() {
        const category = document.getElementById('scramble-category-select').value || 'random';
        const difficulty = document.getElementById('scramble-difficulty-select').value || 'medium';
        const pool = this.buildScrambleGamePool(category, difficulty);
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

    startScrambleGame() {
        // Cancel any pending auto-advance from a previous correct answer.
        if (this.scrambleAutoAdvanceTimer) {
            clearTimeout(this.scrambleAutoAdvanceTimer);
            this.scrambleAutoAdvanceTimer = null;
        }

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
        // The word is ready — "كلمة جديدة" now works as a skip.
        document.getElementById('scramble-next-btn').disabled = false;
        document.getElementById('scramble-game-status').textContent = 'فك الحروف المبعثرة واكتب الكلمة الأصلية.';
        document.getElementById('scramble-game-score').textContent = '0%';
        this.buildScrambleTiles();
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

        const isCorrect = this.isScrambleAnswerCorrect(document.getElementById('scramble-game-answer').value);
        const score = isCorrect ? this.calcScrambleScore() : 0;

        this.scrambleGameState.lastScore = score;
        document.getElementById('scramble-game-status').textContent = isCorrect
            ? 'إجابة صحيحة. أحسنت.'
            : 'إجابة غير صحيحة. جرّب مرة أخرى.';
        document.getElementById('scramble-game-score').textContent = `${score}%`;
        this.persistScrambleGameState();
        this.stopScrambleGameTimer();
        document.getElementById('scramble-check-btn').disabled = true;
        document.getElementById('scramble-next-btn').disabled = false;

        if (isCorrect) {
            document.getElementById('scramble-reveal-btn').disabled = true;
            const answerInput = document.getElementById('scramble-game-answer');
            if (answerInput) answerInput.disabled = true;
            // Correct answers flow straight into the next word — no click needed.
            this.scheduleScrambleAutoAdvance();
        }
    },

    isScrambleAnswerCorrect(value) {
        if (!this.scrambleGameState.term) return false;
        const userAnswer = normalizeAnswerText(value);
        const expectedAnswers = this.scrambleGameState.answers?.length
            ? this.scrambleGameState.answers
            : getAnswerVariants(this.scrambleGameState.term);
        return expectedAnswers.some(answer => userAnswer === answer);
    },

    // Live auto-check: called on every keystroke, grades the moment the typed
    // answer matches — the check button becomes optional.
    maybeAutoCheckScrambleAnswer() {
        if (!this.scrambleGameState.term || this.scrambleGameState.lastScore) return;
        const answerInput = document.getElementById('scramble-game-answer');
        if (!answerInput || answerInput.disabled) return;
        if (this.isScrambleAnswerCorrect(answerInput.value)) {
            this.checkScrambleGameAnswer();
        }
    },

    scheduleScrambleAutoAdvance() {
        if (this.scrambleAutoAdvanceTimer) clearTimeout(this.scrambleAutoAdvanceTimer);
        this.scrambleAutoAdvanceTimer = setTimeout(() => {
            this.scrambleAutoAdvanceTimer = null;
            this.startScrambleGame();
        }, 900);
    },

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
    },

    revealScrambleGameAnswer() {
        if (!this.scrambleGameState.term) return;

        document.getElementById('scramble-game-answer').value = this.scrambleGameState.term;
        this.syncScrambleTileStates();
        document.getElementById('scramble-game-status').textContent = 'تم إظهار الإجابة الصحيحة.';
        document.getElementById('scramble-reveal-btn').disabled = true;
        this.stopScrambleGameTimer();
    }
};
