import { normalizeArabicForMatch, normalizeGameText } from '../game-utils.js';

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
                return `<input class="game-blank" type="text" data-hidden-index="${blankIndex}" aria-label="كلمة ناقصة" autocomplete="off" spellcheck="false">`;
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
        if (!currentVerse || !this.bibleData) {
            return null;
        }

        const bookIndex = this.bibleData.books.findIndex(bookItem => {
            return bookItem.abbreviation === currentVerse.bookId || bookItem.name === currentVerse.bookId || bookItem.name_ar === currentVerse.bookName || bookItem.name === currentVerse.bookName || bookItem.name_ar === currentVerse.book_ar || bookItem.name === currentVerse.book;
        });
        if (bookIndex === -1) {
            return null;
        }

        const book = this.bibleData.books[bookIndex];
        const chapterNumber = parseInt(currentVerse.chapter);
        const verseNumber = parseInt(currentVerse.verse);
        const chapterList = bibleAPI.getChaptersForBook(this.bibleData, book.abbreviation || book.name);
        const chapterObj = chapterList.find(ch => ch && ch.number == chapterNumber);
        if (!chapterObj || !chapterObj.verses) {
            return null;
        }

        const verseList = Object.keys(chapterObj.verses)
            .map(v => parseInt(v))
            .filter(v => !isNaN(v))
            .sort((a, b) => a - b);

        const currentIndex = verseList.indexOf(verseNumber);
        const nextVerseNumber = verseList[currentIndex + 1];
        if (nextVerseNumber) {
            const nextText = bibleAPI.getVerse(this.bibleData, currentVerse.bookId, chapterNumber, nextVerseNumber);
            if (nextText) {
                return {
                    bookId: currentVerse.bookId,
                    chapter: chapterNumber,
                    verse: nextVerseNumber,
                    text: nextText,
                    reference: bibleAPI.formatArabicReference(book.name_ar || book.name, chapterNumber, nextVerseNumber)
                };
            }
        }

        const nextChapter = chapterList.find(ch => ch && ch.number > chapterNumber);
        if (nextChapter) {
            const nextChapterVerseNumbers = Object.keys(nextChapter.verses || {})
                .map(v => parseInt(v))
                .filter(v => !isNaN(v))
                .sort((a, b) => a - b);
            const nextChapterVerseNumber = nextChapterVerseNumbers[0];
            if (nextChapterVerseNumber) {
                const nextText = bibleAPI.getVerse(this.bibleData, currentVerse.bookId, nextChapter.number, nextChapterVerseNumber);
                if (nextText) {
                    return {
                        bookId: currentVerse.bookId,
                        chapter: nextChapter.number,
                        verse: nextChapterVerseNumber,
                        text: nextText,
                        reference: bibleAPI.formatArabicReference(book.name_ar || book.name, nextChapter.number, nextChapterVerseNumber)
                    };
                }
            }
        }

        const nextBook = this.bibleData.books[bookIndex + 1];
        if (nextBook) {
            const nextBookChapters = bibleAPI.getChaptersForBook(this.bibleData, nextBook.abbreviation || nextBook.name);
            const firstChapter = nextBookChapters.find(ch => ch && ch.number);
            if (firstChapter && firstChapter.verses) {
                const firstVerseNumber = Object.keys(firstChapter.verses)
                    .map(v => parseInt(v))
                    .filter(v => !isNaN(v))
                    .sort((a, b) => a - b)[0];
                if (firstVerseNumber) {
                    const nextText = bibleAPI.getVerse(this.bibleData, nextBook.abbreviation || nextBook.name, firstChapter.number, firstVerseNumber);
                    if (nextText) {
                        return {
                            bookId: nextBook.abbreviation || nextBook.name,
                            chapter: firstChapter.number,
                            verse: firstVerseNumber,
                            text: nextText,
                            reference: bibleAPI.formatArabicReference(nextBook.name_ar || nextBook.name, firstChapter.number, firstVerseNumber)
                        };
                    }
                }
            }
        }

        return null;
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

        const blankInputs = document.querySelectorAll('#game-verse-display .game-blank');
        blankInputs.forEach(input => {
            input.addEventListener('input', () => {
                document.getElementById('game-check-btn').disabled = !this.areGameAnswersFilled();
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

    updateHighScore(score) {
        const currentBest = parseInt(localStorage.getItem(this.gameHighScoreKey) || '0', 10) || 0;
        if (score > currentBest) {
            localStorage.setItem(this.gameHighScoreKey, String(score));
            document.getElementById('game-high-score').textContent = `${score}%`;
        }
    },

    areGameAnswersFilled() {
        const blankInputs = document.querySelectorAll('#game-verse-display .game-blank');
        if (blankInputs.length === 0) {
            return false;
        }

        return Array.from(blankInputs).every(input => input.value.trim().length > 0);
    },

    calculateGameScore(expectedText, userText) {
        const expectedWords = (this.gameState.hiddenWords && this.gameState.hiddenWords.length > 0)
            ? this.gameState.hiddenWords.map(word => this.normalizeArabicForMatch(word).trim())
            : this.normalizeGameText(expectedText).split(' ').filter(Boolean);
        const userWords = this.normalizeGameText(userText).split(' ').filter(Boolean).map(word => this.normalizeArabicForMatch(word).trim());

        if (expectedWords.length === 0) {
            return 0;
        }

        let exactMatches = 0;

        for (let index = 0; index < expectedWords.length; index++) {
            if (expectedWords[index] && userWords[index] && expectedWords[index] === userWords[index]) {
                exactMatches += 1;
            }
        }

        return Math.round((exactMatches / expectedWords.length) * 100);
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
        this.updateHighScore(score);
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
        const savedHighScore = localStorage.getItem(this.gameHighScoreKey);

        if (savedDifficulty) {
            this.gameDifficulty = savedDifficulty;
        }

        const difficultySelect = document.getElementById('game-difficulty-select');
        if (difficultySelect) {
            difficultySelect.value = this.gameDifficulty;
        }

        if (savedHighScore !== null) {
            document.getElementById('game-high-score').textContent = `${parseInt(savedHighScore) || 0}%`;
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
