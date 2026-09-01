import {
    buildTermPool,
    calcTimeBonusScore,
    createBibleTermPools,
    formatGameClock,
    getAnswerVariants,
    normalizeAnswerText
} from './game-utils.js';

// Factory for the two "word" games (الكلمات المعكوسة / الكلمات المبعثرة).
// They share the exact same skeleton: category + difficulty selects, a term
// pool with per-session cycling, localStorage preference/state restore, a
// countdown timer with time-bonus scoring, live auto-check, and automatic
// advance after a correct answer. `config` supplies only the parts that
// genuinely differ between the two games:
//   - prefix:        element-id prefix ("reverse" / "scramble")
//   - stem:          mixin method stem ("Reverse" / "Scramble")
//   - clueTransform: term → displayed clue (reversed vs scrambled characters)
//   - notStartedStatus / readyStatus: game-specific status strings
//   - onRoundStart:  optional hook after a fresh round is rendered
//                    (scramble rebuilds its letter tiles)
//   - onReveal:      optional hook after the answer is revealed
//                    (scramble re-syncs its letter tiles)
export function createWordGameMixin({
    prefix,
    stem,
    clueTransform,
    notStartedStatus,
    readyStatus,
    onRoundStart,
    onReveal
}) {
    const stateProp = `${prefix}GameState`;
    const timerProp = `${prefix}GameTimer`;
    const startTimeProp = `${prefix}GameStartTime`;
    const autoAdvanceProp = `${prefix}AutoAdvanceTimer`;

    return {
        [`create${stem}GamePool`]() {
            return createBibleTermPools();
        },

        [`persist${stem}GamePreferences`]() {
            const categorySelect = document.getElementById(`${prefix}-category-select`);
            const difficultySelect = document.getElementById(`${prefix}-difficulty-select`);
            localStorage.setItem(this[`${prefix}GameCategoryKey`], categorySelect.value);
            localStorage.setItem(this[`${prefix}GameDifficultyKey`], difficultySelect.value);
        },

        [`load${stem}GamePreferences`]() {
            const savedCategory = localStorage.getItem(this[`${prefix}GameCategoryKey`]) || 'random';
            const savedDifficulty = localStorage.getItem(this[`${prefix}GameDifficultyKey`]) || 'medium';
            const categorySelect = document.getElementById(`${prefix}-category-select`);
            const difficultySelect = document.getElementById(`${prefix}-difficulty-select`);

            if (categorySelect) categorySelect.value = savedCategory;
            if (difficultySelect) difficultySelect.value = savedDifficulty;

            this[stateProp].category = savedCategory;
            this[stateProp].difficulty = savedDifficulty;

            const savedStateRaw = localStorage.getItem(this[`${prefix}GameStateKey`]);
            if (savedStateRaw) {
                try {
                    const savedState = JSON.parse(savedStateRaw);
                    if (savedState && savedState.term) {
                        this[stateProp] = { ...this[stateProp], ...savedState };
                    }
                } catch (error) {
                    console.warn(`Failed to restore ${prefix} game state`, error);
                }
            }
        },

        [`persist${stem}GameState`]() {
            if (!this[stateProp].term) return;
            localStorage.setItem(this[`${prefix}GameStateKey`], JSON.stringify(this[stateProp]));
        },

        [`build${stem}GamePool`](category, difficulty = 'medium') {
            // Both word games draw from the same bundled Bible term pools.
            const sourcePool = this.reverseGamePool || createBibleTermPools();
            return buildTermPool(sourcePool, category, difficulty);
        },

        [`pick${stem}GameTerm`]() {
            const category = document.getElementById(`${prefix}-category-select`).value || 'random';
            const difficulty = document.getElementById(`${prefix}-difficulty-select`).value || 'medium';
            const pool = this[`build${stem}GamePool`](category, difficulty);
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

        [`start${stem}Game`]() {
            // Cancel any pending auto-advance from a previous correct answer.
            if (this[autoAdvanceProp]) {
                clearTimeout(this[autoAdvanceProp]);
                this[autoAdvanceProp] = null;
            }

            const selected = this[`pick${stem}GameTerm`]();
            if (!selected) {
                document.getElementById(`${prefix}-game-status`).textContent = 'لا توجد كلمات متاحة لهذه الفئة.';
                return;
            }

            const clue = clueTransform(selected.term);
            this[stateProp] = {
                term: selected.term,
                clue,
                category: selected.category,
                difficulty: document.getElementById(`${prefix}-difficulty-select`).value || 'medium',
                lastScore: 0,
                answers: selected.answers || getAnswerVariants(selected.term)
            };

            document.getElementById(`${prefix}-game-clue`).textContent = clue;
            document.getElementById(`${prefix}-game-category`).textContent = selected.category;
            const answerInput = document.getElementById(`${prefix}-game-answer`);
            answerInput.value = '';
            answerInput.disabled = false;
            document.getElementById(`${prefix}-check-btn`).disabled = true;
            document.getElementById(`${prefix}-reveal-btn`).disabled = false;
            // The word is ready — "كلمة جديدة" now works as a skip.
            document.getElementById(`${prefix}-next-btn`).disabled = false;
            document.getElementById(`${prefix}-game-status`).textContent = readyStatus;
            document.getElementById(`${prefix}-game-score`).textContent = '0%';
            if (onRoundStart) onRoundStart.call(this);
            this[`start${stem}GameTimer`]();
            this[`persist${stem}GameState`]();
        },

        [`start${stem}GameTimer`]() {
            const timerEl = document.getElementById(`${prefix}-game-timer`);
            this[`stop${stem}GameTimer`]();
            this[startTimeProp] = Date.now();
            this[timerProp] = setInterval(() => {
                const elapsed = Math.floor((Date.now() - this[startTimeProp]) / 1000);
                timerEl.textContent = formatGameClock(elapsed);
            }, 1000);
        },

        [`stop${stem}GameTimer`]() {
            if (this[timerProp]) {
                clearInterval(this[timerProp]);
                this[timerProp] = null;
            }
        },

        [`calc${stem}Score`]() {
            return calcTimeBonusScore(this[startTimeProp]);
        },

        [`check${stem}GameAnswer`]() {
            if (!this[stateProp].term) {
                this.showValidationMessage(notStartedStatus, 'error');
                return;
            }

            const isCorrect = this[`is${stem}AnswerCorrect`](document.getElementById(`${prefix}-game-answer`).value);
            const score = isCorrect ? this[`calc${stem}Score`]() : 0;

            this[stateProp].lastScore = score;
            document.getElementById(`${prefix}-game-status`).textContent = isCorrect
                ? 'إجابة صحيحة. أحسنت.'
                : 'إجابة غير صحيحة. جرّب مرة أخرى.';
            document.getElementById(`${prefix}-game-score`).textContent = `${score}%`;
            this[`persist${stem}GameState`]();
            this[`stop${stem}GameTimer`]();
            document.getElementById(`${prefix}-check-btn`).disabled = true;
            document.getElementById(`${prefix}-next-btn`).disabled = false;

            if (isCorrect) {
                document.getElementById(`${prefix}-reveal-btn`).disabled = true;
                const answerInput = document.getElementById(`${prefix}-game-answer`);
                if (answerInput) answerInput.disabled = true;
                // Correct answers flow straight into the next word — no click needed.
                this[`schedule${stem}AutoAdvance`]();
            }
        },

        [`is${stem}AnswerCorrect`](value) {
            if (!this[stateProp].term) return false;
            const userAnswer = normalizeAnswerText(value);
            const expectedAnswers = this[stateProp].answers?.length
                ? this[stateProp].answers
                : getAnswerVariants(this[stateProp].term);
            return expectedAnswers.some(answer => userAnswer === answer);
        },

        // Live auto-check: called on every keystroke, grades the moment the typed
        // answer matches — the check button becomes optional.
        [`maybeAutoCheck${stem}Answer`]() {
            if (!this[stateProp].term || this[stateProp].lastScore) return;
            const answerInput = document.getElementById(`${prefix}-game-answer`);
            if (!answerInput || answerInput.disabled) return;
            if (this[`is${stem}AnswerCorrect`](answerInput.value)) {
                this[`check${stem}GameAnswer`]();
            }
        },

        [`schedule${stem}AutoAdvance`]() {
            if (this[autoAdvanceProp]) clearTimeout(this[autoAdvanceProp]);
            this[autoAdvanceProp] = setTimeout(() => {
                this[autoAdvanceProp] = null;
                this[`start${stem}Game`]();
            }, 900);
        },

        [`reveal${stem}GameAnswer`]() {
            if (!this[stateProp].term) return;

            document.getElementById(`${prefix}-game-answer`).value = this[stateProp].term;
            if (onReveal) onReveal.call(this);
            document.getElementById(`${prefix}-game-status`).textContent = 'تم إظهار الإجابة الصحيحة.';
            document.getElementById(`${prefix}-reveal-btn`).disabled = true;
            this[`stop${stem}GameTimer`]();
        }
    };
}