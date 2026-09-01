import { buzz, getAdjacentBibleVerse, normalizeArabicForMatch, normalizeGameText } from './game-utils.js';

// Fallback decoy words used when a verse does not have enough non-hidden words
// to mix into the word bank.
const MEMORY_DECOY_WORDS = [
    'الله', 'الرب', 'المسيح', 'القدس', 'محبة', 'نور', 'حياة', 'سلام',
    'خلاص', 'قلب', 'يوم', 'مجد', 'قوة', 'سماء', 'أرض', 'خبز'
];

export const memoryGameMixin = {
    buildMaskedVerse(text) {
        const tokens = text.split(/(\s+)/);
        const wordIndices = [];

        tokens.forEach((token, index) => {
            if (index % 2 === 0 && token.trim().length > 2) {
                wordIndices.push(index);
            }
        });

        if (wordIndices.length === 0) {
            return {
                maskedHtml: this.escapeHtml(text),
                hiddenIndices: [],
                hiddenWords: []
            };
        }

        const hideRatio = this.getDifficultyHideRatio();
        const wordsToHide = Math.max(1, Math.round(wordIndices.length * hideRatio));
        const shuffledIndices = [...wordIndices].sort(() => Math.random() - 0.5);
        const hiddenIndices = shuffledIndices.slice(0, Math.min(wordsToHide, shuffledIndices.length));
        const hiddenWords = [];

        const maskedTokens = tokens.map((token, index) => {
            if (hiddenIndices.includes(index)) {
                hiddenWords.push(token);
                const blankIndex = hiddenWords.length - 1;
                return `<input class="game-blank" type="text" data-hidden-index="${blankIndex}" aria-label="كلمة ناقصة" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" enterkeyhint="next">`;
            }
            return this.escapeHtml(token);
        });

        return {
            maskedHtml: maskedTokens.join(''),
            hiddenIndices,
            hiddenWords
        };
    },

    getVerseBySelection(bookId, chapter, verse) {
        if (!this.bibleData || !bookId || !chapter || !verse) {
            return null;
        }

        const verseText = bibleAPI.getVerse(this.bibleData, bookId, chapter, verse);
        if (!verseText) {
            return null;
        }

        const book = bibleAPI.getBookByName(this.bibleData, bookId);
        if (!book) {
            return null;
        }

        return {
            bookId,
            bookName: book.name_ar || book.name,
            chapter: parseInt(chapter),
            verse: parseInt(verse),
            text: verseText,
            reference: bibleAPI.formatArabicReference(book.name_ar || book.name, chapter, verse)
        };
    },

    startMemorizeGameFromSelection() {
        const gameBookSelect = document.getElementById('game-book-select');
        const gameChapterSelect = document.getElementById('game-chapter-select');
        const gameVerseSelect = document.getElementById('game-verse-select');

        const verse = this.getVerseBySelection(
            gameBookSelect.value,
            gameChapterSelect.value,
            gameVerseSelect.value
        );

        if (!verse) {
            document.getElementById('game-status').textContent = 'اختر سفرًا وإصحاحًا وآية أولًا، ثم ابدأ الآية المحددة.';
            return;
        }

        this.startMemorizeGameWithVerse(verse);
    },

    getNextVerseReference(currentVerse) {
        return getAdjacentBibleVerse(
            this.bibleData,
            currentVerse,
            1,
            (bookName, chapter, verse) => bibleAPI.formatArabicReference(bookName, chapter, verse)
        );
    },

    updateNextVersePreview() {
        const nextReferenceEl = document.getElementById('game-next-reference');
        const gameNextBtn = document.getElementById('game-next-btn');
        const nextVerse = this.getNextVerseReference(this.gameState.verse);

        if (nextVerse) {
            nextReferenceEl.textContent = nextVerse.reference;
            gameNextBtn.disabled = false;
        } else {
            nextReferenceEl.textContent = '-';
            gameNextBtn.disabled = true;
        }

        this.gameState.nextVerse = nextVerse;
    },

    startNextMemorizeGame() {
        if (this.gameState.nextVerse) {
            this.startMemorizeGameWithVerse(this.gameState.nextVerse);
            return;
        }

        this.startMemorizeGame();
    },

    refreshGamePreviewForCurrentVerse() {
        if (this.gameState.verse) {
            this.startMemorizeGameWithVerse(this.gameState.verse);
        }
    },

    startMemorizeGame() {
        const verses = this.getGameVersePool();
        if (!verses.length) {
            document.getElementById('game-status').textContent = 'لا توجد آيات متاحة للعبة بعد.';
            return;
        }

        const verse = verses[Math.floor(Math.random() * verses.length)];
        this.startMemorizeGameWithVerse(verse);
    },

    startMemorizeGameWithVerse(verse) {
        // Cancel any pending auto-check from the previous round.
        if (this.memoryAutoCheckTimer) {
            clearTimeout(this.memoryAutoCheckTimer);
            this.memoryAutoCheckTimer = null;
        }

        const masked = this.buildMaskedVerse(verse.text);
        this.stopGameTimer();
        this.gameStartTime = Date.now();
        this.gameElapsedSeconds = 0;
        this.startGameTimer();
        this.gameState = {
            verse,
            maskedHtml: masked.maskedHtml,
            hiddenIndices: masked.hiddenIndices,
            hiddenWords: masked.hiddenWords,
            lastScore: 0,
            nextVerse: null
        };

        document.getElementById('game-reference').textContent = verse.reference;
        document.getElementById('game-hidden-count').textContent = masked.hiddenIndices.length.toString();
        document.getElementById('game-verse-display').innerHTML = masked.maskedHtml;
        document.getElementById('game-check-btn').disabled = true;
        document.getElementById('game-reveal-btn').disabled = false;
        document.getElementById('game-status').textContent = 'تم اختيار آية جديدة. حاول تذكر الكلمات المخفية.';
        this.updateGameScore(0);
        this.persistGameState();
        this.updateNextVersePreview();
        this.renderGameWordChips();

        const blankInputs = document.querySelectorAll('#game-verse-display .game-blank');
        blankInputs.forEach(input => {
            input.addEventListener('input', () => {
                document.getElementById('game-check-btn').disabled = !this.areGameAnswersFilled();
                // Keep chip dimming in sync so cleared (wrong) taps re-light.
                this.syncMemoryChipStates();
                // Every blank correct → grade the round without a click.
                this.maybeAutoCheckGameAnswers();
            });
        });
    },

    startGameTimer() {
        const timerEl = document.getElementById('game-timer');
        this.stopGameTimer();
        this.gameTimer = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.gameStartTime) / 1000);
            this.gameElapsedSeconds = elapsed;
            const minutes = String(Math.floor(elapsed / 60)).padStart(2, '0');
            const seconds = String(elapsed % 60).padStart(2, '0');
            timerEl.textContent = `${minutes}:${seconds}`;
        }, 1000);
    },

    stopGameTimer() {
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
            this.gameTimer = null;
        }
    },

    areGameAnswersFilled() {
        const blankInputs = document.querySelectorAll('#game-verse-display .game-blank');
        if (blankInputs.length === 0) {
            return false;
        }

        return Array.from(blankInputs).every(input => input.value.trim().length > 0);
    },

    // ── Word-bank chips (tap-to-fill, no typing needed on phones) ──

    // Shuffles an array in place (Fisher–Yates) and returns it.
    shuffleMemoryChips(list) {
        for (let i = list.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [list[i], list[j]] = [list[j], list[i]];
        }
        return list;
    },

    // Word-bank content: the hidden answer words PLUS extra decoy words that
    // are NOT in the answer, so the chips never hand the solution over.
    buildMemoryChipWords() {
        const hidden = (this.gameState.hiddenWords || []).slice();
        const hiddenNormalized = new Set(hidden.map(word => this.normalizeArabicForMatch(word).trim()));
        const candidates = [];

        const addCandidate = (raw) => {
            const token = String(raw || '').trim();
            if (!token) return;
            const letters = token.replace(/[^\u0621-\u064A]/g, '');
            if (letters.length < 3) return;
            const normalized = this.normalizeArabicForMatch(token).trim();
            if (hiddenNormalized.has(normalized)) return;
            if (candidates.some(existing => this.normalizeArabicForMatch(existing) === normalized)) return;
            candidates.push(token);
        };

        // Plausible decoys: the verse's own non-hidden words.
        if (this.gameState.verse && this.gameState.verse.text) {
            this.gameState.verse.text.split(/(\s+)/).forEach(token => addCandidate(token));
        }
        // Top up from common Bible vocabulary when the verse is too short.
        MEMORY_DECOY_WORDS.forEach(addCandidate);

        // Roughly double the bank: one decoy per hidden word, if available.
        const decoyCount = Math.min(hidden.length || 1, candidates.length);
        const decoys = this.shuffleMemoryChips(candidates.slice()).slice(0, decoyCount);
        return this.shuffleMemoryChips([...hidden, ...decoys]);
    },

    renderGameWordChips() {
        const chipsContainer = document.getElementById('game-word-chips');
        if (!chipsContainer) return;

        const words = this.buildMemoryChipWords();
        chipsContainer.innerHTML = '';
        chipsContainer.hidden = words.length === 0;
        words.forEach(word => {
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = 'memory-chip';
            chip.textContent = word;
            chipsContainer.appendChild(chip);
        });
    },

    // Dim the chips whose word is currently sitting in a blank; light them
    // again when the blank is cleared so a wrong tap can be undone.
    syncMemoryChipStates() {
        const chipsContainer = document.getElementById('game-word-chips');
        if (!chipsContainer) return;

        const filled = new Set(
            Array.from(document.querySelectorAll('#game-verse-display .game-blank'))
                .map(input => this.normalizeArabicForMatch(input.value.trim()).trim())
                .filter(Boolean)
        );
        chipsContainer.querySelectorAll('.memory-chip').forEach(chip => {
            const chipWord = this.normalizeArabicForMatch(chip.textContent).trim();
            chip.classList.toggle('used', filled.has(chipWord));
        });
    },

    // Fill the first empty blank with the tapped chip's word.
    // Returns true when a blank was filled (so the chip can dim).
    fillGameBlankFromChip(word) {
        if (!this.gameState.verse) return false;

        const blankInputs = Array.from(document.querySelectorAll('#game-verse-display .game-blank'));
        const target = blankInputs.find(input => !input.disabled && !input.value.trim());
        if (!target) return false;

        target.value = word;
        buzz(15);

        // Park the focus on the next empty blank for rapid chip tapping.
        const next = blankInputs.find(input => !input.disabled && !input.value.trim());
        if (next && typeof next.focus === 'function') next.focus();

        target.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
    },

    // All blanks filled correctly → grade the round automatically.
    maybeAutoCheckGameAnswers() {
        if (!this.gameState.verse || this.gameState.autoChecked) return;
        if (!this.areGameAnswersFilled()) return;

        const userText = this.getFilledGameAnswerText();
        if (this.calculateGameScore(this.gameState.verse.text, userText) < 100) return;

        this.gameState.autoChecked = true;
        if (this.memoryAutoCheckTimer) clearTimeout(this.memoryAutoCheckTimer);
        this.memoryAutoCheckTimer = setTimeout(() => {
            this.memoryAutoCheckTimer = null;
            this.checkMemorizeGameAnswer();
        }, 500);
    },

    calculateGameScore(expectedText, userText) {
        // Normalize the hidden words with the SAME pipeline as the user's input
        // (diacritics and punctuation stripped). Previously the expected side
        // only used normalizeArabicForMatch, which kept attached punctuation —
        // a word like "شَيْءٌ." never matched a typed "شيء" and perfect rounds
        // scored close to zero.
        const hiddenWords = (this.gameState.hiddenWords && this.gameState.hiddenWords.length > 0)
            ? this.gameState.hiddenWords.map(word => this.normalizeGameText(word)).filter(Boolean)
            : this.normalizeGameText(expectedText).split(' ').filter(Boolean);
        const userWords = this.normalizeGameText(userText).split(' ').filter(Boolean);

        if (hiddenWords.length === 0) {
            return 0;
        }

        let exactMatches = 0;

        for (let index = 0; index < hiddenWords.length; index++) {
            if (hiddenWords[index] && userWords[index] && hiddenWords[index] === userWords[index]) {
                exactMatches += 1;
            }
        }

        return Math.round((exactMatches / hiddenWords.length) * 100);
    },

    updateGameScore(score) {
        const safeScore = Math.max(0, Math.min(100, score));
        this.gameState.lastScore = safeScore;
        document.getElementById('game-score').textContent = `${safeScore}%`;
    },

    checkMemorizeGameAnswer() {
        if (!this.gameState.verse) {
            this.showValidationMessage('ابدأ آية جديدة أولاً.', 'error');
            return;
        }

        if (!this.areGameAnswersFilled()) {
            this.showValidationMessage('اكتب إجابتك أولاً.', 'warning');
            return;
        }

        const userText = this.getFilledGameAnswerText();
        const score = this.calculateGameScore(this.gameState.verse.text, userText);
        this.updateGameScore(score);
        this.persistGameState();
        this.stopGameTimer();

        let message = 'محاولة جيدة، واصل التدريب.';
        if (score >= 95) {
            message = 'ممتاز، إجابة شبه كاملة.';
        } else if (score >= 80) {
            message = 'جيد جداً، بقيت تفاصيل بسيطة.';
        } else if (score >= 60) {
            message = 'هناك أجزاء صحيحة، حاول مرة أخرى.';
        }

        document.getElementById('game-status').textContent = `${message} درجتك: ${score}%`;

        const shouldContinue = this.gameState.nextVerse;
        document.getElementById('game-next-btn').disabled = !shouldContinue;
        if (shouldContinue) {
            document.getElementById('game-status').textContent += ' يمكنك المتابعة إلى الآية التالية مباشرة.';
        }
    },

    getFilledGameAnswerText() {
        const blankInputs = document.querySelectorAll('#game-verse-display .game-blank');
        const words = [];

        blankInputs.forEach((input, index) => {
            words.push(input.value.trim());
        });

        return words.join(' ');
    },

    revealMemorizeGameAnswer() {
        if (!this.gameState.verse) {
            return;
        }

        const blankInputs = document.querySelectorAll('#game-verse-display .game-blank');
        blankInputs.forEach((input, index) => {
            input.value = this.gameState.hiddenWords[index] || '';
            input.disabled = true;
        });
        document.getElementById('game-status').textContent = 'تم إظهار الإجابة الكاملة.';
        document.getElementById('game-reveal-btn').disabled = true;
        document.getElementById('game-check-btn').disabled = false;
        this.stopGameTimer();
    },

    populateGameBookSelect() {
        const gameBookSelect = document.getElementById('game-book-select');
        const books = bibleAPI.getAllBooks(this.bibleData);

        gameBookSelect.innerHTML = '<option value="">-- اختر سفر --</option>';
        books.forEach(book => {
            const option = document.createElement('option');
            option.value = book.id;
            option.textContent = book.name;
            gameBookSelect.appendChild(option);
        });
    },

    populateGameChapterSelect() {
        const gameBookSelect = document.getElementById('game-book-select');
        const gameChapterSelect = document.getElementById('game-chapter-select');
        const gameVerseSelect = document.getElementById('game-verse-select');
        const gameSpecificBtn = document.getElementById('game-specific-btn');

        gameChapterSelect.innerHTML = '<option value="">-- اختر إصحاح --</option>';
        gameVerseSelect.innerHTML = '<option value="">-- اختر آية --</option>';
        gameChapterSelect.disabled = true;
        gameVerseSelect.disabled = true;
        gameSpecificBtn.disabled = true;

        const selectedBookId = gameBookSelect.value;
        if (!selectedBookId || !this.bibleData) {
            return;
        }

        const chapters = bibleAPI.getChaptersForBook(this.bibleData, selectedBookId);
        chapters.forEach(chapter => {
            const option = document.createElement('option');
            option.value = chapter.number;
            option.textContent = `الإصحاح ${chapter.number}`;
            gameChapterSelect.appendChild(option);
        });

        gameChapterSelect.disabled = false;
    },

    populateGameVerseSelect() {
        const gameBookSelect = document.getElementById('game-book-select');
        const gameChapterSelect = document.getElementById('game-chapter-select');
        const gameVerseSelect = document.getElementById('game-verse-select');
        const gameSpecificBtn = document.getElementById('game-specific-btn');

        gameVerseSelect.innerHTML = '<option value="">-- اختر آية --</option>';
        gameVerseSelect.disabled = true;
        gameSpecificBtn.disabled = true;

        const selectedBookId = gameBookSelect.value;
        const selectedChapter = gameChapterSelect.value;
        if (!selectedBookId || !selectedChapter || !this.bibleData) {
            return;
        }

        const chapters = bibleAPI.getChaptersForBook(this.bibleData, selectedBookId);
        const chapterData = chapters.find(ch => ch.number === parseInt(selectedChapter));

        if (chapterData && chapterData.verses) {
            const verseNumbers = Object.keys(chapterData.verses)
                .map(v => parseInt(v))
                .filter(v => !isNaN(v))
                .sort((a, b) => a - b);

            verseNumbers.forEach(verseNum => {
                const option = document.createElement('option');
                option.value = verseNum;
                option.textContent = `الآية ${verseNum}`;
                gameVerseSelect.appendChild(option);
            });
        }

        gameVerseSelect.disabled = false;
    },

    onGameBookChange() {
        this.populateGameChapterSelect();
    },

    onGameChapterChange() {
        this.populateGameVerseSelect();
    },

    onGameVerseChange() {
        const gameBookSelect = document.getElementById('game-book-select');
        const gameChapterSelect = document.getElementById('game-chapter-select');
        const gameVerseSelect = document.getElementById('game-verse-select');
        const gameSpecificBtn = document.getElementById('game-specific-btn');

        gameSpecificBtn.disabled = !(gameBookSelect.value && gameChapterSelect.value && gameVerseSelect.value);
    },

    normalizeGameText(text) {
        return normalizeGameText(text);
    },

    normalizeArabicForMatch(text) {
        return normalizeArabicForMatch(text);
    },

    getDifficultyHideRatio() {
        switch (this.gameDifficulty) {
            case 'easy':
                return 0.2;
            case 'hard':
                return 0.45;
            case 'expert':
                return 0.6;
            case 'medium':
            default:
                return 0.35;
        }
    },

    escapeHtml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    },

    loadGamePreferences() {
        const savedDifficulty = localStorage.getItem(this.gameDifficultyKey);

        if (savedDifficulty) {
            this.gameDifficulty = savedDifficulty;
        }

        const difficultySelect = document.getElementById('game-difficulty-select');
        if (difficultySelect) {
            difficultySelect.value = this.gameDifficulty;
        }

        const savedStateRaw = localStorage.getItem(this.gameStateKey);
        if (savedStateRaw) {
            try {
                const savedState = JSON.parse(savedStateRaw);
                if (savedState && savedState.verse) {
                    this.pendingGameRestore = savedState;
                }
            } catch (error) {
                console.warn('Failed to restore game state', error);
            }
        }
    },

    restorePendingGameState() {
        if (!this.pendingGameRestore || !this.pendingGameRestore.verse) {
            return;
        }

        const savedState = this.pendingGameRestore;
        this.pendingGameRestore = null;
        this.restoreGameSelection(savedState.verse);
        this.startMemorizeGameWithVerse(savedState.verse);
        this.updateGameScore(savedState.lastScore || 0);
        this.persistGameState();
    },

    persistGamePreferences() {
        localStorage.setItem(this.gameDifficultyKey, this.gameDifficulty);
    },

    persistGameState() {
        if (!this.gameState.verse) {
            return;
        }

        localStorage.setItem(this.gameStateKey, JSON.stringify({
            verse: this.gameState.verse,
            lastScore: this.gameState.lastScore
        }));
    },

    restoreGameSelection(verse) {
        const gameBookSelect = document.getElementById('game-book-select');
        const gameChapterSelect = document.getElementById('game-chapter-select');
        const gameVerseSelect = document.getElementById('game-verse-select');
        const gameSpecificBtn = document.getElementById('game-specific-btn');

        if (!verse || !this.bibleData) {
            return;
        }

        const book = this.bibleData.books.find(bookItem => bookItem.abbreviation === verse.bookId || bookItem.name === verse.bookId || bookItem.name_ar === verse.bookName || bookItem.name === verse.bookName);
        if (!book) {
            return;
        }

        gameBookSelect.value = verse.bookId || book.abbreviation || book.name;
        this.populateGameChapterSelect();
        gameChapterSelect.value = verse.chapter;
        this.populateGameVerseSelect();
        gameVerseSelect.value = verse.verse;
        gameSpecificBtn.disabled = false;
    },

    buildGameVersePool() {
        const verses = [];

        if (!this.bibleData || !this.bibleData.books) {
            this.gameVersePool = verses;
            return verses;
        }

        this.bibleData.books.forEach(book => {
            if (!book.chapters || !Array.isArray(book.chapters)) {
                return;
            }

            book.chapters.forEach(chapter => {
                if (!chapter || !chapter.verses || !Array.isArray(chapter.verses)) {
                    return;
                }

                chapter.verses.forEach(verse => {
                    if (!verse || !verse.text || !verse.verse) {
                        return;
                    }

                    verses.push({
                        bookId: book.abbreviation || book.name,
                        bookName: book.name_ar || book.name,
                        chapter: chapter.chapter,
                        verse: verse.verse,
                        text: verse.text,
                        reference: bibleAPI.formatArabicReference(book.name_ar || book.name, chapter.chapter, verse.verse)
                    });
                });
            });
        });

        this.gameVersePool = verses;
        return verses;
    }
};
