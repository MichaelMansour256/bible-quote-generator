import { reverseGameMixin } from './js/games/reverse-game.js';
import { scrambleGameMixin } from './js/games/scramble-game.js';
import { quoteFeatureMixin } from './js/features/quote-feature.js';
import { memoryGameMixin } from './js/features/memory-game.js';

class BibleQuoteGenerator {
    constructor() {
        this.canvas = document.getElementById('quote-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.bibleData = null;
        this.currentBook = null;
        this.currentChapter = null;
        this.currentVerse = null;
        this.searchTimeout = null;
        this.searchResults = [];
        this.searchActiveIndex = -1;
        this.logoImage = new Image();
        this.logoLoaded = false;

        this.selectedBg = 'gradient1';
        this.selectedText = 'white';
        this.selectedFont = 'aref-ruqaa';
        this.gameState = {
            verse: null,
            maskedText: '',
            hiddenIndices: [],
            hiddenWords: [],
            lastScore: 0
        };
        this.activeView = 'quote';
        this.gameTimer = null;
        this.gameStartTime = null;
        this.gameElapsedSeconds = 0;
        this.gameDifficulty = 'medium';
        this.gameHighScoreKey = 'bible-game-high-score';
        this.gameStateKey = 'bible-game-state';
        this.gameDifficultyKey = 'bible-game-difficulty';
        this.pendingGameRestore = null;
        this.gameVersePool = [];
        this.reverseGameTimer = null;
        this.reverseGameStartTime = null;
        this.reverseGameState = {
            term: null,
            clue: '',
            category: '',
            difficulty: 'medium',
            lastScore: 0
        };
        this.reverseGameHighScoreKey = 'bible-reverse-game-high-score';
        this.reverseGameStateKey = 'bible-reverse-game-state';
        this.reverseGameCategoryKey = 'bible-reverse-game-category';
        this.reverseGameDifficultyKey = 'bible-reverse-game-difficulty';
        this.reverseGamePool = this.createReverseGamePool();
        this.scrambleGameTimer = null;
        this.scrambleGameStartTime = null;
        this.scrambleGameState = {
            term: null,
            clue: '',
            category: '',
            difficulty: 'medium',
            lastScore: 0
        };
        this.scrambleGameHighScoreKey = 'bible-scramble-game-high-score';
        this.scrambleGameStateKey = 'bible-scramble-game-state';
        this.scrambleGameCategoryKey = 'bible-scramble-game-category';
        this.scrambleGameDifficultyKey = 'bible-scramble-game-difficulty';
        this.scrambleGamePool = this.reverseGamePool;

        this.logoImage.onload = () => { this.logoLoaded = true; };
        this.logoImage.src = 'logo.svg';

        this.initializeEventListeners();
        this.setupSearchFunctionality();
        this.loadBibleData();
        this.setupColorCombinations();
        this.setupFontSelection();
        this.setupVerseTextSelection();
        this.setupViewSwitcher();
        this.loadGamePreferences();
        this.loadReverseGamePreferences();
        this.loadScrambleGamePreferences();
        this.initializeCanvas();
        this.setupThemeToggle();
    }

    async loadBibleData() {
        this.bibleData = await bibleAPI.loadBibleData();
        if (this.bibleData) {
            this.populateBookSelect();
            this.populateGameBookSelect();
            this.buildGameVersePool();
            this.restorePendingGameState();
        }
    }

    initializeEventListeners() {
        const generateBtn = document.getElementById('generate-btn');
        const downloadBtn = document.getElementById('download-btn');
        const loadVerseBtn = document.getElementById('load-verse-btn');
        const bookSelect = document.getElementById('book-select');
        const chapterSelect = document.getElementById('chapter-select');
        const verseSelect = document.getElementById('verse-select');
        const gameBookSelect = document.getElementById('game-book-select');
        const gameChapterSelect = document.getElementById('game-chapter-select');
        const gameVerseSelect = document.getElementById('game-verse-select');
        const gameStartBtn = document.getElementById('game-start-btn');
        const gameSpecificBtn = document.getElementById('game-specific-btn');
        const gameCheckBtn = document.getElementById('game-check-btn');
        const gameRevealBtn = document.getElementById('game-reveal-btn');
        const gameNextBtn = document.getElementById('game-next-btn');
        const gameVerseDisplay = document.getElementById('game-verse-display');
        const gameDifficultySelect = document.getElementById('game-difficulty-select');
        const reverseStartBtn = document.getElementById('reverse-start-btn');
        const reverseNextBtn = document.getElementById('reverse-next-btn');
        const reverseCheckBtn = document.getElementById('reverse-check-btn');
        const reverseRevealBtn = document.getElementById('reverse-reveal-btn');
        const reverseAnswer = document.getElementById('reverse-game-answer');
        const reverseCategorySelect = document.getElementById('reverse-category-select');
        const reverseDifficultySelect = document.getElementById('reverse-difficulty-select');
        const scrambleStartBtn = document.getElementById('scramble-start-btn');
        const scrambleNextBtn = document.getElementById('scramble-next-btn');
        const scrambleCheckBtn = document.getElementById('scramble-check-btn');
        const scrambleRevealBtn = document.getElementById('scramble-reveal-btn');
        const scrambleAnswer = document.getElementById('scramble-game-answer');
        const scrambleCategorySelect = document.getElementById('scramble-category-select');
        const scrambleDifficultySelect = document.getElementById('scramble-difficulty-select');

        gameSpecificBtn.disabled = true;
        gameNextBtn.disabled = true;
        reverseNextBtn.disabled = true;
        scrambleNextBtn.disabled = true;

        generateBtn.addEventListener('click', () => this.generateImage());
        downloadBtn.addEventListener('click', () => this.downloadImage());
        loadVerseBtn.addEventListener('click', () => this.loadSelectedVerse());
        gameStartBtn.addEventListener('click', () => this.startMemorizeGame());
        gameSpecificBtn.addEventListener('click', () => this.startMemorizeGameFromSelection());
        gameNextBtn.addEventListener('click', () => this.startNextMemorizeGame());
        gameCheckBtn.addEventListener('click', () => this.checkMemorizeGameAnswer());
        gameRevealBtn.addEventListener('click', () => this.revealMemorizeGameAnswer());
        gameVerseDisplay.addEventListener('input', () => {
            gameCheckBtn.disabled = !this.gameState.verse || !this.areGameAnswersFilled();
        });

        gameDifficultySelect.addEventListener('change', () => {
            this.gameDifficulty = gameDifficultySelect.value;
            this.persistGamePreferences();
            this.refreshGamePreviewForCurrentVerse();
        });

        gameBookSelect.addEventListener('change', () => this.onGameBookChange());
        gameChapterSelect.addEventListener('change', () => this.onGameChapterChange());
        gameVerseSelect.addEventListener('change', () => this.onGameVerseChange());

        reverseStartBtn.addEventListener('click', () => this.startReverseGame());
        reverseNextBtn.addEventListener('click', () => this.startReverseGame());
        reverseCheckBtn.addEventListener('click', () => this.checkReverseGameAnswer());
        reverseRevealBtn.addEventListener('click', () => this.revealReverseGameAnswer());
        reverseAnswer.addEventListener('input', () => {
            reverseCheckBtn.disabled = !this.reverseGameState.term || reverseAnswer.value.trim().length === 0;
        });
        reverseAnswer.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !reverseCheckBtn.disabled) this.checkReverseGameAnswer();
        });
        reverseCategorySelect.addEventListener('change', () => {
            this.reverseGameState.category = reverseCategorySelect.value;
            this.persistReverseGamePreferences();
        });
        reverseDifficultySelect.addEventListener('change', () => {
            this.reverseGameState.difficulty = reverseDifficultySelect.value;
            this.persistReverseGamePreferences();
        });

        scrambleStartBtn.addEventListener('click', () => this.startScrambleGame());
        scrambleNextBtn.addEventListener('click', () => this.startScrambleGame());
        scrambleCheckBtn.addEventListener('click', () => this.checkScrambleGameAnswer());
        scrambleRevealBtn.addEventListener('click', () => this.revealScrambleGameAnswer());
        scrambleAnswer.addEventListener('input', () => {
            scrambleCheckBtn.disabled = !this.scrambleGameState.term || scrambleAnswer.value.trim().length === 0;
        });
        scrambleAnswer.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !scrambleCheckBtn.disabled) this.checkScrambleGameAnswer();
        });
        scrambleCategorySelect.addEventListener('change', () => {
            this.scrambleGameState.category = scrambleCategorySelect.value;
            this.persistScrambleGamePreferences();
        });
        scrambleDifficultySelect.addEventListener('change', () => {
            this.scrambleGameState.difficulty = scrambleDifficultySelect.value;
            this.persistScrambleGamePreferences();
        });

        bookSelect.addEventListener('change', () => this.onBookChange());
        chapterSelect.addEventListener('change', () => this.onChapterChange());
        verseSelect.addEventListener('change', () => this.onVerseChange());

        document.getElementById('verse-search').value = '';
        document.getElementById('search-results').innerHTML = '';
        document.getElementById('search-results').style.display = 'none';
    }

    setupThemeToggle() {
        const themeToggle = document.getElementById('theme-toggle');
        if (!themeToggle) return;

        // Load saved theme preference
        const savedTheme = localStorage.getItem('verseup-theme') || 'dark';
        this.setTheme(savedTheme);

        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            this.setTheme(newTheme);
        });
    }

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('verseup-theme', theme);
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.textContent = theme === 'dark' ? '🌙' : '☀️';
        }
    }

    getGameVersePool() {
        const verses = [];

        if (this.currentVerse && this.currentVerse.text && this.currentVerse.reference) {
            verses.push({
                bookId: this.currentVerse.bookId || this.currentVerse.book || this.currentVerse.book_ar,
                bookName: this.currentVerse.bookName || this.currentVerse.book_ar || this.currentVerse.book || this.currentVerse.reference,
                chapter: parseInt(this.currentVerse.chapter),
                verse: parseInt(this.currentVerse.verse),
                text: this.currentVerse.text,
                reference: this.currentVerse.reference
            });
        }

        if (this.gameVersePool.length > 0) {
            verses.push(...this.gameVersePool);
        } else if (this.bibleData) {
            verses.push(...this.buildGameVersePool());
        }

        return verses;
    }

    populateBookSelect() {
        const bookSelect = document.getElementById('book-select');
        const books = bibleAPI.getAllBooks(this.bibleData);

        const canonicalOrder = [
            'تكوين', 'خروج', 'لاويين', 'عدد', 'تثنية',
            'يشوع', 'القضاة', 'راعوث', '1 صموئيل', '2 صموئيل',
            '1 الملوك', '2 الملوك', '1 أخبار الأيام', '2 أخبار الأيام',
            'عزرا', 'نحميا', 'أستير', 'أيوب', 'المزامير', 'الأمثال',
            'الجامعة', 'نشيد الأنشاد', 'إشعياء', 'إرميا', 'مراثي إرميا',
            'حزقيال', 'دانيال', 'هوشع', 'يوئيل', 'عاموس', 'عوبديا',
            'يونان', 'ميخا', 'ناحوم', 'حبقوق', 'صفنيا', 'حجي', 'زكريا',
            'ملاخي', 'متى', 'مرقس', 'لوقا', 'يوحنا', 'أعمال الرسل',
            'رومية', '1 كورنثوس', '2 كورنثوس', 'غلاطية',
            'أفسس', 'فيليبي', 'كولوسي', '1 تسالونيكي', '2 تسالونيكي',
            '1 تيموثاوس', '2 تيموثاوس', 'تيطس', 'فليمون',
            'عبرانيين', 'يعقوب', '1 بطرس', '2 بطرس', '1 يوحنا',
            '2 يوحنا', '3 يوحنا', 'يهوذا', 'الرؤيا'
        ];

        books.sort((a, b) => {
            const aIndex = canonicalOrder.indexOf(a.name);
            const bIndex = canonicalOrder.indexOf(b.name);
            if (aIndex === -1 && bIndex === -1) return a.name.localeCompare(b.name, 'ar');
            if (aIndex === -1) return 1;
            if (bIndex === -1) return -1;
            return aIndex - bIndex;
        });

        books.forEach(book => {
            const option = document.createElement('option');
            option.value = book.id;
            option.textContent = book.name;
            bookSelect.appendChild(option);
        });
    }

    onBookChange() {
        const bookSelect = document.getElementById('book-select');
        const chapterSelect = document.getElementById('chapter-select');
        const verseSelect = document.getElementById('verse-select');
        const loadVerseBtn = document.getElementById('load-verse-btn');

        chapterSelect.innerHTML = '<option value="">-- اختر إصحاح --</option>';
        verseSelect.innerHTML = '<option value="">-- اختر آية --</option>';
        chapterSelect.disabled = true;
        verseSelect.disabled = true;
        loadVerseBtn.disabled = true;

        const selectedBookId = bookSelect.value;
        if (!selectedBookId || !this.bibleData) return;

        const book = bibleAPI.getBookByName(this.bibleData, selectedBookId);
        if (!book) return;

        const chapters = bibleAPI.getChaptersForBook(this.bibleData, selectedBookId);
        chapters.forEach(chapter => {
            const option = document.createElement('option');
            option.value = chapter.number;
            option.textContent = `الإصحاح ${chapter.number}`;
            chapterSelect.appendChild(option);
        });

        chapterSelect.disabled = false;
    }

    onChapterChange() {
        const bookSelect = document.getElementById('book-select');
        const chapterSelect = document.getElementById('chapter-select');
        const verseSelect = document.getElementById('verse-select');
        const loadVerseBtn = document.getElementById('load-verse-btn');

        verseSelect.innerHTML = '<option value="">-- اختر آية --</option>';
        verseSelect.disabled = true;
        loadVerseBtn.disabled = true;

        const selectedBookId = bookSelect.value;
        const selectedChapter = chapterSelect.value;
        if (!selectedBookId || !selectedChapter || !this.bibleData) return;

        const chapters = bibleAPI.getChaptersForBook(this.bibleData, selectedBookId);
        const chapterData = chapters.find(ch => ch.number === parseInt(selectedChapter));

        if (chapterData && chapterData.verses) {
            Object.keys(chapterData.verses)
                .map(v => parseInt(v))
                .filter(v => !isNaN(v))
                .sort((a, b) => a - b)
                .forEach(verseNum => {
                    const option = document.createElement('option');
                    option.value = verseNum;
                    option.textContent = `الآية ${verseNum}`;
                    verseSelect.appendChild(option);
                });
        }

        verseSelect.disabled = false;
    }

    onVerseChange() {
        const bookSelect = document.getElementById('book-select');
        const chapterSelect = document.getElementById('chapter-select');
        const verseSelect = document.getElementById('verse-select');
        const loadVerseBtn = document.getElementById('load-verse-btn');
        loadVerseBtn.disabled = !(bookSelect.value && chapterSelect.value && verseSelect.value);
    }

    loadSelectedVerse() {
        const bookSelect = document.getElementById('book-select');
        const chapterSelect = document.getElementById('chapter-select');
        const verseSelect = document.getElementById('verse-select');

        const selectedBookId = bookSelect.value;
        const selectedChapter = chapterSelect.value;
        const selectedVerse = verseSelect.value;

        const verseText = bibleAPI.getVerse(this.bibleData, selectedBookId, selectedChapter, selectedVerse);

        if (verseText) {
            const book = bibleAPI.getBookByName(this.bibleData, selectedBookId);
            const reference = bibleAPI.formatArabicReference(book.name_ar || book.name, selectedChapter, selectedVerse);

            this.currentVerse = {
                text: verseText,
                reference,
                bookId: selectedBookId,
                bookName: book.name_ar || book.name,
                chapter: selectedChapter,
                verse: selectedVerse
            };

            document.getElementById('verse-text').value = verseText;
            document.getElementById('verse-reference').value = reference;
            this._fullVerseText = null;
            document.getElementById('restore-verse-btn').disabled = true;
            document.getElementById('use-selection-btn').disabled = true;
            this.showValidationMessage('تم تحميل الآية بنجاح', 'success');
        } else {
            this.showValidationMessage('الآية غير موجودة', 'error');
        }
    }

    setupViewSwitcher() {
        this.viewButtons = {
            quote: document.getElementById('quote-view-btn'),
            game: document.getElementById('game-view-btn'),
            reverse: document.getElementById('reverse-view-btn'),
            scramble: document.getElementById('scramble-view-btn')
        };

        this.viewPanels = {
            quote: document.getElementById('quote-view-panel'),
            game: document.getElementById('game-view-panel'),
            reverse: document.getElementById('reverse-view-panel'),
            scramble: document.getElementById('scramble-view-panel')
        };

        Object.entries(this.viewButtons).forEach(([key, btn]) => {
            if (btn) btn.addEventListener('click', () => this.setActiveView(key));
        });

        this.setActiveView('quote');
    }

    setActiveView(view) {
        if (!this.viewButtons || !this.viewPanels || !this.viewPanels[view]) return;

        this.activeView = view;

        Object.entries(this.viewButtons).forEach(([key, btn]) => {
            if (btn) btn.classList.toggle('active', key === view);
        });

        Object.entries(this.viewPanels).forEach(([key, panel]) => {
            if (panel) panel.classList.toggle('hidden', key !== view);
        });
    }
}

Object.assign(BibleQuoteGenerator.prototype, reverseGameMixin, scrambleGameMixin);
Object.assign(BibleQuoteGenerator.prototype, quoteFeatureMixin, memoryGameMixin);

document.addEventListener('DOMContentLoaded', () => {
    new BibleQuoteGenerator();
});

document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
            case 'Enter':
                e.preventDefault();
                document.getElementById('generate-btn').click();
                break;
            case 's':
                e.preventDefault();
                if (!document.getElementById('download-btn').disabled) {
                    document.getElementById('download-btn').click();
                }
                break;
        }
    }
});
