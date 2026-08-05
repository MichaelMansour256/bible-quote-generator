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
        
        // Initialize color combination
        this.selectedBg = 'gradient1';
        this.selectedText = 'white';
        this.selectedFont = 'thuluth-deco';
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
        
        // Load logo image
        this.logoImage.onload = () => {
            this.logoLoaded = true;
        };
        this.logoImage.src = 'logo.svg';
        
        this.initializeEventListeners();
        this.setupSearchFunctionality();
        this.loadBibleData();
        this.setupColorCombinations();
        this.setupFontSelection();
        this.setupViewSwitcher();
        this.loadGamePreferences();
        this.loadReverseGamePreferences();
        this.loadScrambleGamePreferences();
        this.initializeCanvas();
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
        const searchInput = document.getElementById('verse-search');
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
        
        // Clear search on page load
        searchInput.value = '';
        document.getElementById('search-results').innerHTML = '';
        document.getElementById('search-results').style.display = 'none';
    }

    persistReverseGamePreferences() {
        const categorySelect = document.getElementById('reverse-category-select');
        const difficultySelect = document.getElementById('reverse-difficulty-select');
        localStorage.setItem(this.reverseGameCategoryKey, categorySelect.value);
        localStorage.setItem(this.reverseGameDifficultyKey, difficultySelect.value);
    }

    loadReverseGamePreferences() {
        const savedCategory = localStorage.getItem(this.reverseGameCategoryKey) || 'random';
        const savedDifficulty = localStorage.getItem(this.reverseGameDifficultyKey) || 'medium';
        const categorySelect = document.getElementById('reverse-category-select');
        const difficultySelect = document.getElementById('reverse-difficulty-select');
        if (categorySelect) {
            categorySelect.value = savedCategory;
        }
        if (difficultySelect) {
            difficultySelect.value = savedDifficulty;
        }
        this.reverseGameState.category = savedCategory;
        this.reverseGameState.difficulty = savedDifficulty;

        const savedScore = parseInt(localStorage.getItem(this.reverseGameHighScoreKey) || '0', 10) || 0;
        const highScoreEl = document.getElementById('reverse-game-high-score');
        if (highScoreEl) {
            highScoreEl.textContent = `${savedScore}%`;
        }

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
    }

    persistReverseGameState() {
        if (!this.reverseGameState.term) {
            return;
        }

        localStorage.setItem(this.reverseGameStateKey, JSON.stringify(this.reverseGameState));
    }

    persistScrambleGamePreferences() {
        const categorySelect = document.getElementById('scramble-category-select');
        const difficultySelect = document.getElementById('scramble-difficulty-select');
        scrambleViewBtn.classList.toggle('active', isScrambleView);
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
    }

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
    }

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
    }

    onGameBookChange() {
        this.populateGameChapterSelect();
    }

    onGameChapterChange() {
        this.populateGameVerseSelect();
    }

    onGameVerseChange() {
        const gameBookSelect = document.getElementById('game-book-select');
        const gameChapterSelect = document.getElementById('game-chapter-select');
        const gameVerseSelect = document.getElementById('game-verse-select');
        const gameSpecificBtn = document.getElementById('game-specific-btn');

        gameSpecificBtn.disabled = !(gameBookSelect.value && gameChapterSelect.value && gameVerseSelect.value);
    }

    populateBookSelect() {
        const bookSelect = document.getElementById('book-select');
        const books = bibleAPI.getAllBooks(this.bibleData);
        
        // Define canonical Bible book order matching actual API names
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
        
        // Sort books according to canonical order
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

        // Reset chapter and verse selects
        chapterSelect.innerHTML = '<option value="">-- اختر إصحاح --</option>';
        verseSelect.innerHTML = '<option value="">-- اختر آية --</option>';
        chapterSelect.disabled = true;
        verseSelect.disabled = true;
        loadVerseBtn.disabled = true;

        const selectedBookId = bookSelect.value;
        if (!selectedBookId || !this.bibleData) return;

        const book = bibleAPI.getBookByName(this.bibleData, selectedBookId);
        if (!book) return;

        // Populate chapters
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

        // Reset verse select
        verseSelect.innerHTML = '<option value="">-- اختر آية --</option>';
        verseSelect.disabled = true;
        loadVerseBtn.disabled = true;

        const selectedBookId = bookSelect.value;
        const selectedChapter = chapterSelect.value;

        if (!selectedBookId || !selectedChapter || !this.bibleData) return;

        // Get verses for this chapter
        const chapters = bibleAPI.getChaptersForBook(this.bibleData, selectedBookId);
        const chapterData = chapters.find(ch => ch.number === parseInt(selectedChapter));
        
        if (chapterData && chapterData.verses) {
            // Get all verse numbers and sort them numerically
            const verseNumbers = Object.keys(chapterData.verses)
                .map(v => parseInt(v))
                .filter(v => !isNaN(v))
                .sort((a, b) => a - b);
            
            verseNumbers.forEach(verseNum => {
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

        const selectedBookId = bookSelect.value;
        const selectedChapter = chapterSelect.value;
        const selectedVerse = verseSelect.value;

        loadVerseBtn.disabled = !(selectedBookId && selectedChapter && selectedVerse);
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
                reference: reference,
                bookId: selectedBookId,
                bookName: book.name_ar || book.name,
                chapter: selectedChapter,
                verse: selectedVerse
            };
            
            document.getElementById('verse-text').value = verseText;
            document.getElementById('verse-reference').value = reference;
            this.showValidationMessage('تم تحميل الآية بنجاح', 'success');
        } else {
            this.showValidationMessage('الآية غير موجودة', 'error');
        }
    }

    setupSearchFunctionality() {
        const searchInput = document.getElementById('verse-search');
        const searchResults = document.getElementById('search-results');
        const searchLoading = document.getElementById('search-loading');

        const closeSearchResults = () => {
            searchResults.style.display = 'none';
            this.searchActiveIndex = -1;
            this.searchResults = [];
            searchResults.innerHTML = '';
        };

        const runSearch = query => {
            this.performSearch(query);
        };

        searchInput.addEventListener('input', (e) => {
            clearTimeout(this.searchTimeout);
            const query = e.target.value.trim();

            if (query.length < 2 || !this.bibleData) {
                searchLoading.classList.add('hidden');
                closeSearchResults();
                return;
            }

            searchLoading.classList.remove('hidden');
            searchResults.style.display = 'none';
            this.searchTimeout = setTimeout(() => {
                runSearch(query);
            }, 250);
        });

        searchInput.addEventListener('keydown', (e) => {
            if (searchResults.style.display !== 'block' || !this.searchResults.length) {
                if (e.key === 'Escape') {
                    closeSearchResults();
                    searchInput.blur();
                }
                return;
            }

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.searchActiveIndex = (this.searchActiveIndex + 1) % this.searchResults.length;
                this.renderSearchResults();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.searchActiveIndex = this.searchActiveIndex <= 0
                    ? this.searchResults.length - 1
                    : this.searchActiveIndex - 1;
                this.renderSearchResults();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const activeResult = this.searchResults[this.searchActiveIndex] || this.searchResults[0];
                if (activeResult) {
                    this.selectVerse(activeResult);
                    closeSearchResults();
                }
            } else if (e.key === 'Escape') {
                closeSearchResults();
            }
        });

        // Hide search results when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-control')) {
                closeSearchResults();
            }
        });
    }

    performSearch(query) {
        const searchResults = document.getElementById('search-results');
        const searchLoading = document.getElementById('search-loading');
        const results = bibleAPI.searchVerses(this.bibleData, query);

        this.searchResults = results.slice(0, 10);
        this.searchActiveIndex = this.searchResults.length ? 0 : -1;

        if (this.searchResults.length === 0) {
            searchLoading.classList.add('hidden');
            searchResults.innerHTML = '<div class="search-result-item empty">لا توجد نتائج</div>';
            searchResults.style.display = 'block';
            return;
        }

        this.renderSearchResults();
        searchLoading.classList.add('hidden');
        searchResults.style.display = 'block';
    }

    renderSearchResults() {
        const searchResults = document.getElementById('search-results');
        searchResults.innerHTML = '';

        this.searchResults.forEach((result, index) => {
            const item = document.createElement('div');
            item.className = `search-result-item${index === this.searchActiveIndex ? ' active' : ''}`;
            item.setAttribute('role', 'option');
            item.setAttribute('aria-selected', index === this.searchActiveIndex ? 'true' : 'false');
            item.tabIndex = -1;
            item.innerHTML = `
                <div class="reference">${result.reference}</div>
                <div class="text">${result.text.substring(0, 100)}${result.text.length > 100 ? '...' : ''}</div>
            `;
            item.addEventListener('mouseenter', () => {
                this.searchActiveIndex = index;
                this.renderSearchResults();
            });
            item.addEventListener('click', () => {
                this.selectVerse(result);
                searchResults.style.display = 'none';
                this.searchResults = [];
                this.searchActiveIndex = -1;
            });
            searchResults.appendChild(item);
        });
    }

    selectVerse(verseData) {
        document.getElementById('verse-search').value = '';

        if (this.activeView !== 'quote') {
            this.setActiveView('quote');
        }

        this.currentVerse = {
            ...verseData,
            bookId: verseData.bookId || verseData.book || verseData.book_ar || verseData.bookName || '',
            bookName: verseData.bookName || verseData.book_ar || verseData.book || verseData.bookId || ''
        };

        document.getElementById('verse-text').value = verseData.text || '';
        document.getElementById('verse-reference').value = verseData.reference || '';

        const bookSelect = document.getElementById('book-select');
        const chapterSelect = document.getElementById('chapter-select');
        const verseSelect = document.getElementById('verse-select');
        const loadVerseBtn = document.getElementById('load-verse-btn');

        const targetBookName = verseData.book_ar || verseData.bookName || verseData.book || verseData.bookId || '';
        const resolvedBook = bibleAPI.getBookByName(this.bibleData, targetBookName) || bibleAPI.getBookByName(this.bibleData, verseData.book || '');

        if (!resolvedBook) {
            this.showValidationMessage('تعذر تحديد السفر المرتبط بهذه النتيجة.', 'error');
            return;
        }

        const resolvedBookId = resolvedBook.abbreviation || resolvedBook.name;
        bookSelect.value = resolvedBookId;
        this.onBookChange();

        chapterSelect.value = String(verseData.chapter);
        this.onChapterChange();

        verseSelect.value = String(verseData.verse);
        this.onVerseChange();

        loadVerseBtn.disabled = false;
        this.showValidationMessage('تم اختيار الآية بنجاح', 'success');

        const verseSelectionSection = document.querySelector('.verse-selection-section');
        if (verseSelectionSection) {
            verseSelectionSection.classList.add('search-selection-flash');
            verseSelectionSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            window.setTimeout(() => {
                verseSelectionSection.classList.remove('search-selection-flash');
            }, 1200);
        }
    }

    showValidationMessage(message, type) {
        const existingMessage = document.querySelector('.validation-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = `validation-message ${type}`;
        messageDiv.textContent = message;

        const verseTextGroup = document.getElementById('verse-text').closest('.input-group');
        verseTextGroup.appendChild(messageDiv);

        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }

    setupCanvas() {
        // Set canvas size for social media (1080x1080 for Instagram)
        this.canvas.width = 1080;
        this.canvas.height = 1080;
        
        // Draw initial placeholder
        this.drawPlaceholder();
    }

    drawPlaceholder() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Draw gradient background
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#0f1c2e');
        gradient.addColorStop(1, '#1b3557');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Draw placeholder text
        ctx.fillStyle = 'rgba(232, 238, 247, 0.38)';
        ctx.font = '24px Tajawal';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('معاينة الصورة ستظهر هنا', width / 2, height / 2);
    }

    getBackgroundStyle(style) {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;

        switch (style) {
            case 'gradient1':
                // Modern navy gradient - works with white text
                const gradient1 = ctx.createLinearGradient(0, 0, width, height);
                gradient1.addColorStop(0, '#13253c');
                gradient1.addColorStop(0.5, '#1f3653');
                gradient1.addColorStop(1, '#2a4d78');
                return gradient1;
            
            case 'gradient2':
                // Accent gradient - works with white text
                const gradient2 = ctx.createLinearGradient(0, 0, width, height);
                gradient2.addColorStop(0, '#5b8cff');
                gradient2.addColorStop(1, '#7f5af0');
                return gradient2;
            
            case 'gradient3':
                // Warm highlight gradient - works with dark text
                const gradient3 = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width/2);
                gradient3.addColorStop(0, '#f1d7a1');
                gradient3.addColorStop(1, '#d4a855');
                return gradient3;
            
            case 'gradient4':
                // Teal gradient - works with white text
                const gradient4 = ctx.createLinearGradient(width, 0, 0, height);
                gradient4.addColorStop(0, '#24c4b2');
                gradient4.addColorStop(1, '#1aa67a');
                return gradient4;
            
            case 'gradient5':
                // Purple-white gradient - works with white text
                const gradient5 = ctx.createLinearGradient(width, 0, 0, height);
                gradient5.addColorStop(0, '#9b59b6');
                gradient5.addColorStop(0.5, '#8e44ad');
                gradient5.addColorStop(1, '#663399');
                return gradient5;
            
            case 'solid-white':
                // White background - works with gold or dark text
                return '#ffffff';
            
            case 'solid-cream':
                // Cream background - works with gold or dark text
                return '#fffdd0';
            
            case 'solid-lightblue':
                // Light blue background - works with white or gold text
                return '#add8e6';
            
            case 'decorative':
                // Dark decorative pattern - works with white or gold text
                const decorativeGradient = ctx.createLinearGradient(0, 0, width, height);
                decorativeGradient.addColorStop(0, '#08111f');
                decorativeGradient.addColorStop(1, '#152640');
                return decorativeGradient;
            
            default:
                // Default to the modern navy gradient
                const defaultGradient = ctx.createLinearGradient(0, 0, width, height);
                defaultGradient.addColorStop(0, '#13253c');
                defaultGradient.addColorStop(0.5, '#1f3653');
                defaultGradient.addColorStop(1, '#2a4d78');
                return defaultGradient;
        }
    }

    getTextColor(color) {
        switch (color) {
            case 'white':
                return '#ffffff';
            case 'gold':
                return '#ffd700';
            case 'cream':
                return '#f5f5dc';
            case 'black':
                return '#000000';
            case 'darkblue':
                return '#1e3a8a';
            default:
                return '#ffffff';
        }
    }

    wrapText(text, maxWidth, fontSize) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';

        this.ctx.font = `${fontSize}px Amiri`;

        for (let word of words) {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const metrics = this.ctx.measureText(testLine);
            
            if (metrics.width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        
        if (currentLine) {
            lines.push(currentLine);
        }

        return lines;
    }

    generateImage() {
        const verseText = document.getElementById('verse-text').value.trim();
        const verseReference = document.getElementById('verse-reference').value.trim();

        if (!verseText) {
            this.showValidationMessage('الرجاء اختيار آية أولاً', 'error');
            return;
        }

        // Set canvas size for high quality
        this.canvas.width = 1080;
        this.canvas.height = 1080;

        // Get selected color combination
        const backgroundStyle = this.getBackgroundStyle(this.selectedBg);
        const textColor = this.getTextColor(this.selectedText);

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw background
        if (typeof backgroundStyle === 'string') {
            this.ctx.fillStyle = backgroundStyle;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        } else {
            this.ctx.fillStyle = backgroundStyle;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        // Draw decorative border
        this.ctx.strokeStyle = textColor;
        this.ctx.lineWidth = 4;
        this.ctx.strokeRect(40, 40, this.canvas.width - 80, this.canvas.height - 80);

        // Inner border
        this.ctx.strokeStyle = textColor;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(60, 60, this.canvas.width - 120, this.canvas.height - 120);

        // Set text properties
        this.ctx.fillStyle = textColor;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        // Calculate text layout
        const padding = 120;
        const maxWidth = this.canvas.width - (padding * 2);
        const centerY = this.canvas.height / 2;

        // Draw verse text with proper wrapping
        const fontSize = this.calculateFontSize(verseText, maxWidth);
        const lines = this.wrapText(verseText, maxWidth, fontSize);
        
        // Dynamic line height based on font size
        const lineHeight = fontSize * 1.4;
        const totalTextHeight = lines.length * lineHeight;
        const startY = centerY - (totalTextHeight / 2) + (fontSize / 2);

        // Add text shadow for better readability
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 8;
        this.ctx.shadowOffsetX = 2;
        this.ctx.shadowOffsetY = 2;

        lines.forEach((line, index) => {
            const y = startY + (index * lineHeight);
            
            // Set font based on selection and make it bolder
            let fontFamily;
            switch (this.selectedFont) {
                case 'thuluth-deco':
                    fontFamily = 'Thuluth Deco, serif';
                    break;
                case 'amiri':
                    fontFamily = 'Amiri, serif';
                    break;
                case 'aref-ruqaa':
                    fontFamily = 'Aref Ruqaa, serif';
                    break;
                case 'reem-kufi':
                    fontFamily = 'Reem Kufi, sans-serif';
                    break;
                case 'lateef':
                    fontFamily = 'Lateef, serif';
                    break;
                case 'scheherazade':
                    fontFamily = 'Scheherazade, serif';
                    break;
                case 'noto-naskh':
                    fontFamily = 'Noto Naskh Arabic, serif';
                    break;
                case 'markazi-text':
                    fontFamily = 'Markazi Text, serif';
                    break;
                case 'katibeh':
                    fontFamily = 'Katibeh, sans-serif';
                    break;
                case 'mirza':
                    fontFamily = 'Mirza, cursive';
                    break;
                case 'harmattan':
                    fontFamily = 'Harmattan, sans-serif';
                    break;
                case 'diwan-kufi':
                    fontFamily = 'Diwan Kufi, cursive';
                    break;
                default:
                    fontFamily = 'Thuluth Deco, serif';
                    break;
            }
            
            this.ctx.font = `bold ${fontSize}px ${fontFamily}`;
            this.ctx.fillText(line, this.canvas.width / 2, y);
        });

        // Reset shadow for reference
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;

        // Draw verse reference
        if (verseReference) {
            let fontFamily;
            switch (this.selectedFont) {
                case 'thuluth-deco':
                    fontFamily = 'Thuluth Deco, serif';
                    break;
                case 'amiri':
                    fontFamily = 'Amiri, serif';
                    break;
                case 'aref-ruqaa':
                    fontFamily = 'Aref Ruqaa, serif';
                    break;
                case 'reem-kufi':
                    fontFamily = 'Reem Kufi, sans-serif';
                    break;
                case 'lateef':
                    fontFamily = 'Lateef, serif';
                    break;
                case 'scheherazade':
                    fontFamily = 'Scheherazade, serif';
                    break;
                case 'noto-naskh':
                    fontFamily = 'Noto Naskh Arabic, serif';
                    break;
                case 'markazi-text':
                    fontFamily = 'Markazi Text, serif';
                    break;
                case 'katibeh':
                    fontFamily = 'Katibeh, sans-serif';
                    break;
                case 'mirza':
                    fontFamily = 'Mirza, cursive';
                    break;
                case 'harmattan':
                    fontFamily = 'Harmattan, sans-serif';
                    break;
                case 'diwan-kufi':
                    fontFamily = 'Diwan Kufi, cursive';
                    break;
                default:
                    fontFamily = 'Thuluth Deco, serif';
                    break;
            }
            
            this.ctx.font = `bold 60px ${fontFamily}`;
            this.ctx.fillText(verseReference, this.canvas.width / 2, this.canvas.height - 100);
        }

        // Add decorative elements (cross symbols)
        this.ctx.font = '48px Amiri';
        this.ctx.fillText('✝', 100, 100);
        this.ctx.fillText('✝', this.canvas.width - 100, this.canvas.height - 100);

        // Add logo
        this.addLogo(this.ctx, this.canvas.width, this.canvas.height);

        // Enable download button and show success message
        document.getElementById('download-btn').disabled = false;
        this.showSuccessMessage();
    }

    addLogo(ctx, width, height) {
        // Check if logo toggle is enabled
        const logoToggle = document.getElementById('logo-toggle');
        if (!logoToggle.checked) return;
        
        // Only draw logo if image is loaded
        if (!this.logoLoaded) return;
        
        // Save current context state
        ctx.save();
        
        // Determine if background is light or dark
        const isLightBackground = this.isLightBackground(this.selectedBg);
        
        // Set logo properties - slightly left from right corner to avoid frame
        const logoSize = 120;
        const logoX = width - logoSize - 60; // Moved further left from frame (was -20)
        const logoY = 20;
        
        // Apply color filter based on background
        if (isLightBackground) {
            // Dark logo for light backgrounds
            ctx.filter = 'invert(1) brightness(0.5)';
        } else {
            // Normal logo for dark backgrounds
            ctx.filter = 'none';
        }
        
        // Draw the transparent logo image directly (no background)
        ctx.drawImage(
            this.logoImage,
            logoX,
            logoY,
            logoSize,
            logoSize
        );
        
        // Reset filter
        ctx.filter = 'none';
        
        // Restore context state
        ctx.restore();
    }

    isLightBackground(bgStyle) {
        const lightBackgrounds = ['solid-white', 'solid-cream', 'solid-lightblue'];
        return lightBackgrounds.includes(bgStyle);
    }

    calculateFontSize(text, maxWidth) {
        let fontSize = 140; // Much larger base size
        
        // Use the selected font for measurement
        let fontFamily;
        switch (this.selectedFont) {
            case 'thuluth-deco':
                fontFamily = 'Thuluth Deco, serif';
                break;
            case 'amiri':
                fontFamily = 'Amiri, serif';
                break;
            case 'aref-ruqaa':
                fontFamily = 'Aref Ruqaa, serif';
                break;
            case 'reem-kufi':
                fontFamily = 'Reem Kufi, sans-serif';
                break;
            case 'lateef':
                fontFamily = 'Lateef, serif';
                break;
            case 'scheherazade':
                fontFamily = 'Scheherazade, serif';
                break;
            case 'noto-naskh':
                fontFamily = 'Noto Naskh Arabic, serif';
                break;
            case 'markazi-text':
                fontFamily = 'Markazi Text, serif';
                break;
            case 'katibeh':
                fontFamily = 'Katibeh, sans-serif';
                break;
            case 'mirza':
                fontFamily = 'Mirza, cursive';
                break;
            case 'harmattan':
                fontFamily = 'Harmattan, sans-serif';
                break;
            case 'diwan-kufi':
                fontFamily = 'Diwan Kufi, cursive';
                break;
            default:
                fontFamily = 'Thuluth Deco, serif';
                break;
        }
        
        // Apply font-specific safety margins
        let safetyMargin = 0.8; // Default 80% safety margin
        if (['mirza', 'katibeh', 'diwan-kufi'].includes(this.selectedFont)) {
            safetyMargin = 0.75; // Medium for decorative fonts
        }
        
        this.ctx.font = `${fontSize}px ${fontFamily}`;
        
        // More aggressive reduction with font-specific safety margin
        while (this.ctx.measureText(text).width > maxWidth * safetyMargin && fontSize > 50) {
            fontSize -= 3;
            this.ctx.font = `${fontSize}px ${fontFamily}`;
        }
        
        // Ensure minimum readable size (much larger minimum)
        if (fontSize < 50) {
            fontSize = 50;
        }
        
        return fontSize;
    }

    showSuccessMessage() {
        const successMessage = document.getElementById('success-message');
        successMessage.style.display = 'block';
        
        setTimeout(() => {
            successMessage.style.display = 'none';
        }, 3000);
    }

    downloadImage() {
        const link = document.createElement('a');
        const verseReference = document.getElementById('verse-reference').value.trim() || 'bible-verse';
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        
        link.download = `${verseReference}-${timestamp}.png`;
        link.href = this.canvas.toDataURL();
        link.click();
    }
}

Object.assign(BibleQuoteGenerator.prototype, reverseGameMixin, scrambleGameMixin);
Object.assign(BibleQuoteGenerator.prototype, quoteFeatureMixin, memoryGameMixin);

// Initialize the generator when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new BibleQuoteGenerator();
});

// Add some sample verses for testing
const sampleVerses = [
    { text: "صالِحٌ هو الرَّبُّ. في يومِ الضَّيقِ، وهو يَعرِفُ المُتَوَكِّلينَ علَيهِ.", reference: "ناحوم ١: ٧" },
    { text: "اِرحَمْنِي يا اللهُ، اِرحَمْنِي، لأنَّ بِكَ تَكَلَّتْ نَفْسِي، وفي ظِلِّ جَنَاحَيْكَ أَحْتَمِي.", reference: "مزمور ٥٧: ١" },
    { text: "الرَّبُّ رَاعِيَّ فَلاَ يُعْوَزُنِي شَيْءٌ.", reference: "مزمور ٢٣: ١" },
    { text: "أَنَا هُوَ الطَّرِيقُ وَالْحَقُّ وَالْحَيَاةُ. لَيْسَ أَحَدٌ يَأْتِي إِلَى الآبِ إِلاَّ بِي.", reference: "يوحنا ١٤: ٦" },
    { text: "لأَنَّهُ هكَذَا أَحَبَّ اللهُ الْعَالَمَ حَتَّى بَذَلَ ابْنَهُ الْوَحِيدَ، لِكَيْ لاَ يَهْلِكَ كُلُّ مَنْ يُؤْمِنُ بِهِ، بَلْ تَكُونُ لَهُ الْحَيَاةُ الأَبَدِيَّةُ.", reference: "يوحنا ٣: ١٦" }
];

// Function to load a random sample verse
function loadRandomVerse() {
    const randomVerse = sampleVerses[Math.floor(Math.random() * sampleVerses.length)];
    document.getElementById('verse-text').value = randomVerse.text;
    document.getElementById('verse-reference').value = randomVerse.reference;
}

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
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
