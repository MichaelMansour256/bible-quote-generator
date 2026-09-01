import {
    buildWordleDictionary,
    buildWordleWordPool,
    buzz,
    createBibleTermPools,
    evaluateWordleGuess,
    getWordleDisplayLetters,
    getWordleLetterCount,
    isWordleGuessValid,
    normalizeArabicForMatch,
    calcTimeBonusScore,
    formatGameClock
} from './game-utils.js';

import {
    WORDLE_ALLOWED_LENGTHS,
    WORDLE_KEY_ROWS,
    WORDLE_MAX_ATTEMPTS
} from '../../data/games/wordle-data.js';

const WORDLE_STATUS_RANK = { absent: 1, present: 2, correct: 3 };

export const wordleGameMixin = {
    createWordlePool() {
        return createBibleTermPools();
    },

    buildWordlePool(category) {
        const sourcePool = this.wordleGamePool || this.createWordlePool();
        return buildWordleWordPool(sourcePool, category);
    },

    // Every Bible term and alias across all pools — feeds the guess dictionary
    // so the answer words themselves are always acceptable guesses.
    collectWordlePoolTerms() {
        const pools = this.wordleGamePool || this.createWordlePool();
        const terms = [];
        Object.values(pools).forEach(list => {
            (list || []).forEach(entry => {
                if (!entry) return;
                if (entry.term) terms.push(entry.term);
                (entry.aliases || []).forEach(alias => terms.push(alias));
            });
        });
        return terms;
    },

    // Raw verse text used to build the guess dictionary: the full fetched Bible
    // when already loaded, plus the popular verses bundled in bible-database.js.
    collectWordleBibleText() {
        const texts = [];
        if (this.bibleData && Array.isArray(this.bibleData.books)) {
            this.bibleData.books.forEach(book => {
                (book.chapters || []).forEach(chapter => {
                    if (!chapter) return;
                    const verses = Array.isArray(chapter.verses)
                        ? chapter.verses
                        : (chapter.verses ? Object.values(chapter.verses) : []);
                    verses.forEach(verse => {
                        const text = verse && (typeof verse === 'string' ? verse : verse.text);
                        if (text) texts.push(text);
                    });
                });
            });
        }
        if (typeof bibleDatabase !== 'undefined' && bibleDatabase.verses) {
            Object.values(bibleDatabase.verses).forEach(verse => {
                if (verse && verse.text) texts.push(verse.text);
            });
        }
        return texts;
    },

    // Set of accepted guesses, built once and cached on the instance.
    buildWordleDictionary() {
        if (!this.wordleDictionary) {
            this.wordleDictionary = buildWordleDictionary({
                bibleText: this.collectWordleBibleText(),
                poolTerms: this.collectWordlePoolTerms()
            });
        }
        return this.wordleDictionary;
    },

    // Kick off a background fetch of the full Bible so the guess dictionary
    // grows to the whole Bible vocabulary as soon as the text arrives.
    warmWordleDictionary() {
        if (typeof this.ensureBibleDataLoaded !== 'function') return;
        Promise.resolve(this.ensureBibleDataLoaded())
            .then(() => {
                this.wordleDictionary = null;
                this.buildWordleDictionary();
            })
            .catch(() => {
                /* offline — the bundled dictionary still applies */
            });
    },

    // Shake the row being typed for a moment to flag a rejected guess.
    shakeWordleRow() {
        const board = document.getElementById('wordle-board');
        if (!board) return;
        const rowEl = board.querySelectorAll('.wordle-row')[this.wordleGameState.rows.length];
        if (!rowEl) return;
        rowEl.classList.remove('wordle-shake');
        void rowEl.offsetWidth; // restart the animation
        rowEl.classList.add('wordle-shake');
        setTimeout(() => rowEl.classList.remove('wordle-shake'), 450);
    },

    persistWordleGamePreferences() {
        const categorySelect = document.getElementById('wordle-category-select');
        const lengthSelect = document.getElementById('wordle-length-select');
        localStorage.setItem(this.wordleGameCategoryKey, categorySelect.value);
        localStorage.setItem(this.wordleGameLengthKey, lengthSelect.value);
    },

    persistWordleGameState() {
        if (!this.wordleGameState.target) return;
        localStorage.setItem(this.wordleGameStateKey, JSON.stringify(this.wordleGameState));
    },

    loadWordleGamePreferences() {
        const savedCategory = localStorage.getItem(this.wordleGameCategoryKey) || 'random';
        const savedLength = parseInt(localStorage.getItem(this.wordleGameLengthKey) || '5', 10) || 5;
        const categorySelect = document.getElementById('wordle-category-select');
        const lengthSelect = document.getElementById('wordle-length-select');

        if (categorySelect) categorySelect.value = savedCategory;
        if (lengthSelect && WORDLE_ALLOWED_LENGTHS.includes(savedLength)) {
            lengthSelect.value = String(savedLength);
        }

        this.wordleGameState.category = savedCategory;
        this.wordleGameState.length = parseInt((lengthSelect && lengthSelect.value) || '5', 10) || 5;

        // Render the idle board for the restored length before replaying a
        // saved round on top of it.
        this.renderWordleBoard();
        this.updateWordleAttempts();
        this.refreshWordleKeyboard();

        const savedStateRaw = localStorage.getItem(this.wordleGameStateKey);
        if (!savedStateRaw) return;

        try {
            const savedState = JSON.parse(savedStateRaw);
            if (savedState && savedState.target && savedState.length === this.wordleGameState.length) {
                this.wordleGameState = { ...this.wordleGameState, ...savedState };
                const categoryEl = document.getElementById('wordle-game-category');
                if (categoryEl) categoryEl.textContent = this.wordleGameState.displayCategory || '-';

                this.renderWordleBoard();
                this.updateWordleAttempts();
                this.refreshWordleKeyboard();

                if (this.wordleGameState.finished) {
                    const nextBtn = document.getElementById('wordle-next-btn');
                    if (nextBtn) nextBtn.disabled = false;
                    this.showWordleAgainButton(true);
                } else {
                    this.startWordleGameTimer();
                }
            }
        } catch (error) {
            console.warn('Failed to restore wordle game state', error);
        }
    },

    pickWordleWord(candidates) {
        if (!candidates.length) return null;
        if (!this.wordleUsedWords) this.wordleUsedWords = new Set();

        const available = candidates.filter(entry => !this.wordleUsedWords.has(entry.term));
        if (available.length === 0) {
            // Every word of this length was played: start a fresh cycle.
            this.wordleUsedWords.clear();
            return candidates[Math.floor(Math.random() * candidates.length)];
        }

        return available[Math.floor(Math.random() * available.length)];
    },

    startWordleGame() {
        const categorySelect = document.getElementById('wordle-category-select');
        const lengthSelect = document.getElementById('wordle-length-select');
        const category = (categorySelect && categorySelect.value) || 'random';
        const length = parseInt((lengthSelect && lengthSelect.value) || '5', 10) || 5;

        const pool = this.buildWordlePool(category);
        const candidates = pool.filter(entry => getWordleLetterCount(entry.term) === length);

        if (!candidates.length) {
            this.showValidationMessage('لا توجد كلمات بهذا الطول في هذه الفئة. جرّب طولاً أو فئة أخرى.', 'warning');
            return;
        }

        const selected = this.pickWordleWord(candidates);
        if (!selected) {
            this.showValidationMessage('تعذّر اختيار كلمة. حاول مرة أخرى.', 'error');
            return;
        }

        if (!this.wordleUsedWords) this.wordleUsedWords = new Set();
        this.wordleUsedWords.add(selected.term);

        this.stopWordleGameTimer();
        this.wordleGameState = {
            target: selected.term,
            targetLetters: Array.from(normalizeArabicForMatch(selected.term)),
            displayLetters: getWordleDisplayLetters(selected.term),
            length,
            category,
            displayCategory: selected.category,
            rows: [],
            current: [],
            finished: null,
            lastScore: 0
        };

        document.getElementById('wordle-game-category').textContent = selected.category;
        document.getElementById('wordle-game-score').textContent = '0%';
        document.getElementById('wordle-next-btn').disabled = true;
        document.getElementById('wordle-reveal-btn').disabled = false;
        this.showWordleAgainButton(false);
        document.getElementById('wordle-game-status').textContent = 'خمّن الكلمة السرية. بعد كل محاولة تتلوّن الحروف: الأخضر في مكانه الصحيح، والأصفر موجود لكن في مكان آخر.';
        this.updateWordleAttempts();
        this.renderWordleBoard();
        this.refreshWordleKeyboard();
        this.startWordleGameTimer();
        this.persistWordleGameState();
    },

    resetWordleGame() {
        this.stopWordleGameTimer();
        this.wordleGameState = {
            target: null,
            targetLetters: [],
            displayLetters: [],
            length: this.wordleGameState.length,
            category: this.wordleGameState.category,
            displayCategory: '',
            rows: [],
            current: [],
            finished: null,
            lastScore: 0
        };

        const categoryEl = document.getElementById('wordle-game-category');
        if (categoryEl) categoryEl.textContent = '-';
        const statusEl = document.getElementById('wordle-game-status');
        if (statusEl) statusEl.textContent = 'اختر عدد الحروف ثم اضغط البدء.';
        const nextBtn = document.getElementById('wordle-next-btn');
        if (nextBtn) nextBtn.disabled = true;
        const revealBtn = document.getElementById('wordle-reveal-btn');
        if (revealBtn) revealBtn.disabled = true;
        const timerEl = document.getElementById('wordle-game-timer');
        if (timerEl) timerEl.textContent = '00:00';
        this.showWordleAgainButton(false);

        this.renderWordleBoard();
        this.updateWordleAttempts();
        this.refreshWordleKeyboard();
        localStorage.removeItem(this.wordleGameStateKey);
    },

    updateWordleAttempts() {
        const attemptsEl = document.getElementById('wordle-game-attempts');
        if (!attemptsEl) return;
        const used = this.wordleGameState.rows.length;
        const remaining = Math.max(0, WORDLE_MAX_ATTEMPTS - used);
        attemptsEl.textContent = `${remaining} / ${WORDLE_MAX_ATTEMPTS}`;
    },

    renderWordleBoard(animateRowIndex = -1) {
        const board = document.getElementById('wordle-board');
        if (!board) return;

        const state = this.wordleGameState;
        const length = state.length || 5;
        board.style.setProperty('--wordle-cols', String(length));
        board.innerHTML = '';

        for (let r = 0; r < WORDLE_MAX_ATTEMPTS; r += 1) {
            const rowEl = document.createElement('div');
            rowEl.className = 'wordle-row';

            for (let c = 0; c < length; c += 1) {
                const tile = document.createElement('div');
                tile.className = 'wordle-tile';

                const savedRow = state.rows[r];
                if (savedRow) {
                    tile.textContent = savedRow.letters[c] || '';
                    const status = savedRow.statuses && savedRow.statuses[c];
                    if (status) tile.classList.add(status);
                    if (r === animateRowIndex) {
                        tile.classList.add('reveal');
                        tile.style.setProperty('--i', String(c));
                    }
                } else if (r === state.rows.length && !state.finished) {
                    const letter = state.current[c];
                    if (letter) {
                        tile.textContent = letter;
                        tile.classList.add('filled');
                    }
                }

                rowEl.appendChild(tile);
            }

            board.appendChild(rowEl);
        }
    },

    handleWordleKey(rawKey) {
        const state = this.wordleGameState;
        if (!state || !state.target || state.finished) return;

        if (rawKey === 'Enter') {
            this.submitWordleRow();
            return;
        }

        if (rawKey === 'Backspace') {
            if (state.current.length > 0) {
                state.current.pop();
                this.renderWordleBoard();
            }
            return;
        }

        const letter = Array.from(String(rawKey || ''))[0] || '';
        if (!/[\u0621-\u064A]/.test(letter)) return;
        if (state.current.length >= state.length) return;

        state.current.push(letter);
        this.renderWordleBoard();
    },

    submitWordleRow() {
        const state = this.wordleGameState;
        if (!state.target || state.finished) return;

        if (state.current.length < state.length) {
            const missing = state.length - state.current.length;
            document.getElementById('wordle-game-status').textContent =
                `أكمل الكلمة أولاً — ينقصك ${missing} ${missing === 1 ? 'حرف' : 'حروف'}.`;
            return;
        }

        const guessLetters = state.current.map(letter => normalizeArabicForMatch(letter));
        const guessWord = guessLetters.join('');
        const targetWord = state.targetLetters.join('');

        // Only real words are accepted — gibberish is rejected without
        // consuming the row. A guess counts as valid when it is the secret
        // word itself, appears in the Bible text (full fetch or bundled
        // verses), comes from the game's own term pools, or is in the bundled
        // common-Arabic baseline list.
        if (guessWord !== targetWord && !isWordleGuessValid(this.buildWordleDictionary(), guessWord)) {
            document.getElementById('wordle-game-status').textContent =
                `كلمة \"${state.current.join('')}\" ليست كلمة صحيحة — حاول كلمة من الكتاب المقدس.`;
            this.shakeWordleRow();
            buzz([40, 30, 40]);
            return;
        }

        const statuses = evaluateWordleGuess(guessLetters, state.targetLetters);
        const rowIndex = state.rows.length;

        state.rows.push({ letters: state.current.slice(), statuses });
        state.current = [];

        this.renderWordleBoard(rowIndex);
        this.refreshWordleKeyboard();

        const isWin = statuses.every(status => status === 'correct');
        if (isWin) {
            buzz([40, 60, 40]);
            state.finished = 'won';
            const score = this.calcWordleScore();
            state.lastScore = score;
            document.getElementById('wordle-game-score').textContent = `${score}%`;
            document.getElementById('wordle-game-status').textContent =
                `أحسنت! الكلمة الصحيحة هي "${state.target}". درجتك: ${score}%`;
            this.stopWordleGameTimer();
            document.getElementById('wordle-next-btn').disabled = false;
            document.getElementById('wordle-reveal-btn').disabled = true;
            this.showWordleAgainButton(true);
        } else if (state.rows.length >= WORDLE_MAX_ATTEMPTS) {
            buzz([60, 50, 60]);
            state.finished = 'lost';
            state.lastScore = 0;
            document.getElementById('wordle-game-score').textContent = '0%';
            document.getElementById('wordle-game-status').textContent =
                `انتهت المحاولات! الكلمة الصحيحة هي "${state.target}".`;
            this.stopWordleGameTimer();
            document.getElementById('wordle-next-btn').disabled = false;
            document.getElementById('wordle-reveal-btn').disabled = true;
            this.showWordleAgainButton(true);
        } else {
            buzz(30);
        }

        this.updateWordleAttempts();
        this.persistWordleGameState();
    },

    showWordleAgainButton(show) {
        const againBtn = document.getElementById('wordle-again-btn');
        if (againBtn) againBtn.hidden = !show;
    },

    revealWordleAnswer() {
        const state = this.wordleGameState;
        if (!state.target || state.finished) return;

        state.finished = 'revealed';
        state.lastScore = 0;

        // Show the correct word on its own row (when there is room left).
        if (state.rows.length < WORDLE_MAX_ATTEMPTS) {
            state.rows.push({
                letters: state.displayLetters.slice(),
                statuses: state.targetLetters.map(() => 'target')
            });
        }

        this.renderWordleBoard(state.rows.length - 1);
        document.getElementById('wordle-game-status').textContent =
            `الكلمة الصحيحة هي "${state.target}".`;
        document.getElementById('wordle-reveal-btn').disabled = true;
        document.getElementById('wordle-next-btn').disabled = false;
        this.showWordleAgainButton(true);
        this.stopWordleGameTimer();
        this.updateWordleAttempts();
        this.refreshWordleKeyboard();
        this.persistWordleGameState();
    },

    refreshWordleKeyboard() {
        const keyboard = document.getElementById('wordle-keyboard');
        if (!keyboard) return;

        const state = this.wordleGameState;
        const bestStatus = new Map();
        state.rows.forEach(row => {
            row.letters.forEach((rawLetter, index) => {
                const letter = normalizeArabicForMatch(rawLetter);
                const status = row.statuses[index];
                const known = bestStatus.get(letter);
                if (!known || WORDLE_STATUS_RANK[status] > WORDLE_STATUS_RANK[known]) {
                    bestStatus.set(letter, status);
                }
            });
        });

        keyboard.querySelectorAll('.wordle-key[data-key]').forEach(keyEl => {
            keyEl.classList.remove('key-correct', 'key-present', 'key-absent');
            const status = bestStatus.get(normalizeArabicForMatch(keyEl.dataset.key));
            if (status) keyEl.classList.add(`key-${status}`);
        });

        keyboard.classList.toggle('disabled', !state.target || !!state.finished);
    },

    buildWordleKeyboard() {
        const keyboard = document.getElementById('wordle-keyboard');
        if (!keyboard || keyboard.childElementCount) return;

        WORDLE_KEY_ROWS.forEach((rowKeys, rowIndex) => {
            const rowEl = document.createElement('div');
            rowEl.className = 'wordle-keyboard-row';

            rowKeys.forEach(letter => {
                const key = document.createElement('button');
                key.type = 'button';
                key.className = 'wordle-key';
                key.dataset.key = letter;
                key.textContent = letter;
                rowEl.appendChild(key);
            });

            if (rowIndex === 0) {
                const backspace = document.createElement('button');
                backspace.type = 'button';
                backspace.className = 'wordle-key wide';
                backspace.dataset.key = 'Backspace';
                backspace.textContent = '⌫';
                rowEl.appendChild(backspace);
            }

            if (rowIndex === 1) {
                const enter = document.createElement('button');
                enter.type = 'button';
                enter.className = 'wordle-key wide';
                enter.dataset.key = 'Enter';
                enter.textContent = '⏎';
                rowEl.appendChild(enter);
            }

            keyboard.appendChild(rowEl);
        });

        keyboard.addEventListener('click', (event) => {
            const keyEl = event.target.closest('.wordle-key');
            if (keyEl) this.handleWordleKey(keyEl.dataset.key);
        });
    },

    startWordleGameTimer() {
        const timerEl = document.getElementById('wordle-game-timer');
        this.stopWordleGameTimer();
        this.wordleGameStartTime = Date.now();
        this.wordleGameTimer = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.wordleGameStartTime) / 1000);
            timerEl.textContent = formatGameClock(elapsed);
        }, 1000);
    },

    stopWordleGameTimer() {
        if (this.wordleGameTimer) {
            clearInterval(this.wordleGameTimer);
            this.wordleGameTimer = null;
        }
    },

    calcWordleScore() {
        return calcTimeBonusScore(this.wordleGameStartTime);
    }
};
