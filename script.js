class BibleQuoteGenerator {
    constructor() {
        this.canvas = document.getElementById('quote-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.bibleData = null;
        this.currentBook = null;
        this.currentChapter = null;
        this.currentVerse = null;
        this.searchTimeout = null;
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
            lastScore: 0
        };
        this.activeView = 'quote';
        
        // Load logo image
        this.logoImage.onload = () => {
            this.logoLoaded = true;
        };
        this.logoImage.src = 'logo.svg';
        
        this.initializeEventListeners();
        this.loadBibleData();
        this.setupColorCombinations();
        this.setupFontSelection();
        this.setupViewSwitcher();
        this.initializeCanvas();
    }

    async loadBibleData() {
        this.bibleData = await bibleAPI.loadBibleData();
        if (this.bibleData) {
            this.populateBookSelect();
            this.populateGameBookSelect();
        }
    }

    setupColorCombinations() {
        const colorOptions = document.querySelectorAll('.color-option');
        
        // Set first option as selected by default
        if (colorOptions.length > 0) {
            colorOptions[0].classList.add('selected');
        }
        
        colorOptions.forEach(option => {
            option.addEventListener('click', () => {
                // Remove selected class from all options
                colorOptions.forEach(opt => opt.classList.remove('selected'));
                
                // Add selected class to clicked option
                option.classList.add('selected');
                
                // Update selected colors
                this.selectedBg = option.dataset.bg;
                this.selectedText = option.dataset.text;
                
                console.log('Selected colors:', this.selectedBg, this.selectedText);
                this.updatePreview(); // Update preview when colors change
            });
        });
    }

    updatePreview() {
        const verseText = document.getElementById('verse-text').value.trim();
        const verseReference = document.getElementById('verse-reference').value.trim();
        
        if (verseText) {
            this.generateImage();
        }
    }

    setupFontSelection() {
        const fontSelect = document.getElementById('font-style');
        
        fontSelect.addEventListener('change', () => {
            this.selectedFont = fontSelect.value;
            console.log('Selected font:', this.selectedFont);
            this.updatePreview(); // Update preview when font changes
        });
    }

    initializeCanvas() {
        // Set initial canvas size
        this.canvas.width = 1080;
        this.canvas.height = 1080;
        this.drawPlaceholder();
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
        const gameVerseDisplay = document.getElementById('game-verse-display');

        gameSpecificBtn.disabled = true;

        generateBtn.addEventListener('click', () => this.generateImage());
        downloadBtn.addEventListener('click', () => this.downloadImage());
        loadVerseBtn.addEventListener('click', () => this.loadSelectedVerse());
        gameStartBtn.addEventListener('click', () => this.startMemorizeGame());
        gameSpecificBtn.addEventListener('click', () => this.startMemorizeGameFromSelection());
        gameCheckBtn.addEventListener('click', () => this.checkMemorizeGameAnswer());
        gameRevealBtn.addEventListener('click', () => this.revealMemorizeGameAnswer());
        gameVerseDisplay.addEventListener('input', () => {
            gameCheckBtn.disabled = !this.gameState.verse || !this.areGameAnswersFilled();
        });

        gameBookSelect.addEventListener('change', () => this.onGameBookChange());
        gameChapterSelect.addEventListener('change', () => this.onGameChapterChange());
        gameVerseSelect.addEventListener('change', () => this.onGameVerseChange());
        
        bookSelect.addEventListener('change', () => this.onBookChange());
        chapterSelect.addEventListener('change', () => this.onChapterChange());
        verseSelect.addEventListener('change', () => this.onVerseChange());
        
        // Search functionality
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            if (query.length > 0) {
                this.performSearch(query);
            } else {
                document.getElementById('search-results').style.display = 'none';
            }
        });
        
        // Clear search on page load
        searchInput.value = '';
        document.getElementById('search-results').innerHTML = '';
        document.getElementById('search-results').style.display = 'none';
    }

    setupViewSwitcher() {
        const quoteViewBtn = document.getElementById('quote-view-btn');
        const gameViewBtn = document.getElementById('game-view-btn');

        quoteViewBtn.addEventListener('click', () => this.setActiveView('quote'));
        gameViewBtn.addEventListener('click', () => this.setActiveView('game'));

        this.setActiveView('quote');
    }

    setActiveView(view) {
        this.activeView = view;

        const quoteViewPanel = document.getElementById('quote-view-panel');
        const gameViewPanel = document.getElementById('game-view-panel');
        const quoteViewBtn = document.getElementById('quote-view-btn');
        const gameViewBtn = document.getElementById('game-view-btn');

        const isQuoteView = view === 'quote';
        quoteViewPanel.classList.toggle('hidden', !isQuoteView);
        gameViewPanel.classList.toggle('hidden', isQuoteView);
        quoteViewBtn.classList.toggle('active', isQuoteView);
        gameViewBtn.classList.toggle('active', !isQuoteView);
    }

    getGameVersePool() {
        const verses = [];

        if (this.currentVerse && this.currentVerse.text && this.currentVerse.reference) {
            verses.push({
                text: this.currentVerse.text,
                reference: this.currentVerse.reference
            });
        }

        if (this.bibleData) {
            const popularVerses = bibleAPI.getPopularVerses(this.bibleData);
            popularVerses.forEach(verse => verses.push(verse));
        }

        if (typeof sampleVerses !== 'undefined') {
            sampleVerses.forEach(verse => verses.push(verse));
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

    normalizeGameText(text) {
        return bibleAPI.removeDiacritics(text)
            .replace(/[\u064B-\u065F\u0670]/g, '')
            .replace(/[\u0640]/g, '')
            .replace(/[\u060C\u061B\u061F\.,!?:;"'()\[\]{}«»ـ]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase();
    }

    escapeHtml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

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

        const wordsToHide = Math.max(2, Math.round(wordIndices.length * 0.35));
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
    }

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
            text: verseText,
            reference: bibleAPI.formatArabicReference(book.name_ar || book.name, chapter, verse)
        };
    }

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
    }

    startMemorizeGame() {
        const verses = this.getGameVersePool();
        if (!verses.length) {
            document.getElementById('game-status').textContent = 'لا توجد آيات متاحة للعبة بعد.';
            return;
        }

        const verse = verses[Math.floor(Math.random() * verses.length)];
        this.startMemorizeGameWithVerse(verse);
    }

    startMemorizeGameWithVerse(verse) {
        const masked = this.buildMaskedVerse(verse.text);
        this.gameState = {
            verse,
            maskedHtml: masked.maskedHtml,
            hiddenIndices: masked.hiddenIndices,
            hiddenWords: masked.hiddenWords,
            lastScore: 0
        };

        document.getElementById('game-reference').textContent = verse.reference;
        document.getElementById('game-hidden-count').textContent = masked.hiddenIndices.length.toString();
        document.getElementById('game-verse-display').innerHTML = masked.maskedHtml;
        document.getElementById('game-check-btn').disabled = true;
        document.getElementById('game-reveal-btn').disabled = false;
        document.getElementById('game-status').textContent = 'تم اختيار آية جديدة. حاول تذكر الكلمات المخفية.';
        this.updateGameScore(0);

        const blankInputs = document.querySelectorAll('#game-verse-display .game-blank');
        blankInputs.forEach(input => {
            input.addEventListener('input', () => {
                document.getElementById('game-check-btn').disabled = !this.areGameAnswersFilled();
            });
        });
    }

    areGameAnswersFilled() {
        const blankInputs = document.querySelectorAll('#game-verse-display .game-blank');
        if (blankInputs.length === 0) {
            return false;
        }

        return Array.from(blankInputs).every(input => input.value.trim().length > 0);
    }

    calculateGameScore(expectedText, userText) {
        const expectedWords = (this.gameState.hiddenWords && this.gameState.hiddenWords.length > 0)
            ? this.gameState.hiddenWords.map(word => this.normalizeGameText(word))
            : this.normalizeGameText(expectedText).split(' ').filter(Boolean);
        const userWords = this.normalizeGameText(userText).split(' ').filter(Boolean);

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
    }

    updateGameScore(score) {
        const safeScore = Math.max(0, Math.min(100, score));
        this.gameState.lastScore = safeScore;
        document.getElementById('game-score').textContent = `${safeScore}%`;
    }

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

        let message = 'محاولة جيدة، واصل التدريب.';
        if (score >= 95) {
            message = 'ممتاز، إجابة شبه كاملة.';
        } else if (score >= 80) {
            message = 'جيد جداً، بقيت تفاصيل بسيطة.';
        } else if (score >= 60) {
            message = 'هناك أجزاء صحيحة، حاول مرة أخرى.';
        }

        document.getElementById('game-status').textContent = `${message} درجتك: ${score}%`;
    }

    getFilledGameAnswerText() {
        const blankInputs = document.querySelectorAll('#game-verse-display .game-blank');
        const words = [];

        blankInputs.forEach((input, index) => {
            words.push(input.value.trim());
        });

        return words.join(' ');
    }

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
        let searchTimeout;

        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();

            if (query.length < 2 || !this.bibleData) {
                searchResults.style.display = 'none';
                return;
            }

            searchTimeout = setTimeout(() => {
                this.performSearch(query);
            }, 300);
        });

        // Hide search results when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.input-group')) {
                searchResults.style.display = 'none';
            }
        });
    }

    performSearch(query) {
        const searchResults = document.getElementById('search-results');
        const results = bibleAPI.searchVerses(this.bibleData, query);

        if (results.length === 0) {
            searchResults.innerHTML = '<div class="search-result-item">لا توجد نتائج</div>';
            searchResults.style.display = 'block';
            return;
        }

        searchResults.innerHTML = '';
        results.slice(0, 10).forEach(result => {
            const item = document.createElement('div');
            item.className = 'search-result-item';
            item.innerHTML = `
                <div class="reference">${result.reference}</div>
                <div class="text">${result.text.substring(0, 100)}${result.text.length > 100 ? '...' : ''}</div>
            `;
            item.addEventListener('click', () => {
                this.selectVerse(result);
                searchResults.style.display = 'none';
            });
            searchResults.appendChild(item);
        });

        searchResults.style.display = 'block';
    }

    selectVerse(verseData) {
        this.currentVerse = verseData;
        document.getElementById('verse-text').value = verseData.text;
        document.getElementById('verse-reference').value = verseData.reference;
        document.getElementById('verse-search').value = '';
        this.showValidationMessage('تم اختيار الآية بنجاح', 'success');
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
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Draw placeholder text
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
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
                // Original good gradient - works with white text
                const gradient1 = ctx.createLinearGradient(0, 0, width, height);
                gradient1.addColorStop(0, '#3498db');
                gradient1.addColorStop(0.5, '#2980b9');
                gradient1.addColorStop(1, '#1e5f8e');
                return gradient1;
            
            case 'gradient2':
                // Blue purple gradient - works with white text
                const gradient2 = ctx.createLinearGradient(0, 0, width, height);
                gradient2.addColorStop(0, '#667eea');
                gradient2.addColorStop(1, '#764ba2');
                return gradient2;
            
            case 'gradient3':
                // Pink gradient - works with white text
                const gradient3 = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width/2);
                gradient3.addColorStop(0, '#ee9ca7');
                gradient3.addColorStop(1, '#ffdde1');
                return gradient3;
            
            case 'gradient4':
                // Sky blue gradient - works with white text
                const gradient4 = ctx.createLinearGradient(width, 0, 0, height);
                gradient4.addColorStop(0, '#2193b0');
                gradient4.addColorStop(1, '#6dd5ed');
                return gradient4;
            
            case 'gradient5':
                // Purple gradient - works with white text
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
                decorativeGradient.addColorStop(0, '#2c3e50');
                decorativeGradient.addColorStop(1, '#34495e');
                return decorativeGradient;
            
            default:
                // Default to the good gradient
                const defaultGradient = ctx.createLinearGradient(0, 0, width, height);
                defaultGradient.addColorStop(0, '#3498db');
                defaultGradient.addColorStop(0.5, '#2980b9');
                defaultGradient.addColorStop(1, '#1e5f8e');
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
