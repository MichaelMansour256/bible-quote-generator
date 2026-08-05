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
        this.loadGamePreferences();
        this.loadReverseGamePreferences();
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

        gameSpecificBtn.disabled = true;
        gameNextBtn.disabled = true;
        reverseNextBtn.disabled = true;

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

    createReverseGamePool() {
        const books = [
            { term: 'التكوين', aliases: ['سفر التكوين', 'تكوين'], difficulty: 'easy' },
            { term: 'الخروج', aliases: ['سفر الخروج', 'خروج'], difficulty: 'easy' },
            { term: 'اللاويين', aliases: ['سفر اللاويين', 'لاويين'], difficulty: 'easy' },
            { term: 'العدد', aliases: ['سفر العدد', 'عدد'], difficulty: 'easy' },
            { term: 'التثنية', aliases: ['سفر التثنية', 'تثنية'], difficulty: 'easy' },
            { term: 'يشوع', aliases: ['سفر يشوع'], difficulty: 'easy' },
            { term: 'القضاة', aliases: ['سفر القضاة'], difficulty: 'easy' },
            { term: 'راعوث', aliases: ['سفر راعوث'], difficulty: 'easy' },
            { term: 'صموئيل الأول', aliases: ['صموئيل 1', '1 صموئيل', 'صموئيل الاول'], difficulty: 'medium' },
            { term: 'صموئيل الثاني', aliases: ['صموئيل 2', '2 صموئيل', 'صموئيل الثاني'], difficulty: 'medium' },
            { term: 'الملوك الأول', aliases: ['ملوك 1', '1 ملوك', 'الملوك الاول'], difficulty: 'medium' },
            { term: 'الملوك الثاني', aliases: ['ملوك 2', '2 ملوك', 'الملوك الثاني'], difficulty: 'medium' },
            { term: 'أخبار الأيام الأول', aliases: ['أخبار الأيام 1', '1 أخبار الأيام', 'أخبار الأيام الاول'], difficulty: 'hard' },
            { term: 'أخبار الأيام الثاني', aliases: ['أخبار الأيام 2', '2 أخبار الأيام', 'أخبار الأيام الثاني'], difficulty: 'hard' },
            { term: 'مراثي إرميا', aliases: ['مراثي', 'مراثي النبي إرميا'], difficulty: 'hard' },
            { term: 'كورنثوس الأولى', aliases: ['1 كورنثوس', 'كورنثوس 1', 'كورنثوس الاولى'], difficulty: 'medium' },
            { term: 'كورنثوس الثانية', aliases: ['2 كورنثوس', 'كورنثوس 2', 'كورنثوس الثانية'], difficulty: 'medium' },
            { term: 'تسالونيكي الأولى', aliases: ['1 تسالونيكي', 'تسالونيكي 1', 'تسالونيكي الاولى'], difficulty: 'hard' },
            { term: 'تسالونيكي الثانية', aliases: ['2 تسالونيكي', 'تسالونيكي 2', 'تسالونيكي الثانية'], difficulty: 'hard' },
            { term: 'تيموثاوس الأولى', aliases: ['1 تيموثاوس', 'تيموثاوس 1', 'تيموثاوس الاولى'], difficulty: 'hard' },
            { term: 'تيموثاوس الثانية', aliases: ['2 تيموثاوس', 'تيموثاوس 2', 'تيموثاوس الثانية'], difficulty: 'hard' },
            { term: 'رؤيا يوحنا', aliases: ['الرؤيا', 'سفر الرؤيا', 'سفر رؤيا يوحنا'], difficulty: 'medium' }
        ];

        const names = [
            { term: 'إبراهيم', aliases: ['أبرام', 'إبراهام'], difficulty: 'easy' },
            { term: 'إسحاق', aliases: ['اسحق'], difficulty: 'easy' },
            { term: 'يعقوب', aliases: ['إسرائيل'], difficulty: 'easy' },
            { term: 'يوسف', aliases: ['يوسف الصديق'], difficulty: 'easy' },
            { term: 'موسى', aliases: ['موسى النبي'], difficulty: 'easy' },
            { term: 'هارون', aliases: ['هارون الكاهن'], difficulty: 'easy' },
            { term: 'داود', aliases: ['داود الملك'], difficulty: 'easy' },
            { term: 'سليمان', aliases: ['سليمان الحكيم'], difficulty: 'easy' },
            { term: 'يوشع', aliases: ['يشوع بن نون'], difficulty: 'medium' },
            { term: 'صموئيل', aliases: ['صموئيل النبي'], difficulty: 'medium' },
            { term: 'إيليا', aliases: ['إيليا التشبي'], difficulty: 'medium' },
            { term: 'إليشع', aliases: ['أليشع'], difficulty: 'medium' },
            { term: 'إشعياء', aliases: ['النبي إشعياء'], difficulty: 'medium' },
            { term: 'إرميا', aliases: ['النبي إرميا'], difficulty: 'medium' },
            { term: 'حزقيال', aliases: ['النبي حزقيال'], difficulty: 'medium' },
            { term: 'دانيال', aliases: ['النبي دانيال'], difficulty: 'medium' },
            { term: 'عزرا', aliases: ['الكاتب عزرا'], difficulty: 'medium' },
            { term: 'نحميا', aliases: ['القائد نحميا'], difficulty: 'medium' },
            { term: 'أستير', aliases: ['الملكة أستير'], difficulty: 'medium' },
            { term: 'مريم المجدلية', aliases: ['مجدلية', 'مريم من المجدل'], difficulty: 'hard' },
            { term: 'مريم العذراء', aliases: ['العذراء مريم', 'مريم أم يسوع'], difficulty: 'hard' },
            { term: 'يوحنا المعمدان', aliases: ['يوحنا المعمداني', 'يحيى'], difficulty: 'hard' },
            { term: 'برنابا', aliases: ['يوسف برنابا'], difficulty: 'hard' },
            { term: 'تيموثاوس', aliases: ['الابن تيموثاوس'], difficulty: 'hard' },
            { term: 'مردخاي', aliases: ['مردخاي اليهودي'], difficulty: 'hard' },
            { term: 'أبيجايل', aliases: ['أبيجايل الحكيمة'], difficulty: 'hard' },
            { term: 'راحيل', aliases: ['راحيل زوجة يعقوب'], difficulty: 'hard' },
            { term: 'ليئة', aliases: ['ليئة زوجة يعقوب'], difficulty: 'hard' },
            { term: 'دبورة', aliases: ['دبورة النبية'], difficulty: 'hard' },
            { term: 'إبراهيم الخليل', aliases: ['خليل الله'], difficulty: 'expert' },
            { term: 'إسحاق بن إبراهيم', aliases: ['ابن الموعد'], difficulty: 'expert' }
        ];

        const places = [
            { term: 'أورشليم', aliases: ['القدس'], difficulty: 'easy' },
            { term: 'بيت لحم', aliases: ['بيت لحم اليهودية'], difficulty: 'easy' },
            { term: 'الناصرة', aliases: ['ناصرة الجليل'], difficulty: 'easy' },
            { term: 'الجليل', aliases: ['الجليل الأعلى'], difficulty: 'easy' },
            { term: 'أريحا', aliases: ['مدينة أريحا'], difficulty: 'easy' },
            { term: 'السامرة', aliases: ['أرض السامرة'], difficulty: 'easy' },
            { term: 'بيت إيل', aliases: ['بيت ايل'], difficulty: 'medium' },
            { term: 'بيت عنيا', aliases: ['بيت عنيا قرب أورشليم'], difficulty: 'medium' },
            { term: 'بيت صيدا', aliases: ['بيت صيدا الجليل'], difficulty: 'medium' },
            { term: 'كفرناحوم', aliases: ['كفر ناحوم'], difficulty: 'medium' },
            { term: 'أورشليم الجديدة', aliases: ['المدينة المقدسة', 'المدينة الجديدة'], difficulty: 'hard' },
            { term: 'بيت فاجي', aliases: ['بيت فاجي وبيت عنيا'], difficulty: 'hard' },
            { term: 'قانا الجليل', aliases: ['قانا'], difficulty: 'hard' },
            { term: 'النهر الأردن', aliases: ['الأردن', 'نهر الأردن'], difficulty: 'hard' },
            { term: 'بحر الجليل', aliases: ['بحيرة الجليل'], difficulty: 'hard' },
            { term: 'بحر الميت', aliases: ['البحر الميت'], difficulty: 'hard' },
            { term: 'جبل الزيتون', aliases: ['جبل الزيتون الشرقي'], difficulty: 'hard' },
            { term: 'جبل الكرمل', aliases: ['الكرمل'], difficulty: 'hard' },
            { term: 'جبل سيناء', aliases: ['سيناء'], difficulty: 'expert' },
            { term: 'جبل حوريب', aliases: ['حوريب'], difficulty: 'expert' },
            { term: 'أنطاكية', aliases: ['أنطاكية السورية'], difficulty: 'expert' },
            { term: 'أفسس', aliases: ['مدينة أفسس'], difficulty: 'expert' },
            { term: 'كورنثوس', aliases: ['كورنثوس اليونانية'], difficulty: 'expert' }
        ];

        return { books, names, places };
    }

    normalizeReverseGameText(text) {
        return this.normalizeArabicForMatch(text).replace(/\s+/g, ' ').trim();
    }

    normalizeReverseGameDigits(text) {
        return String(text || '').replace(/[٠-٩]/g, digit => '٠١٢٣٤٥٦٧٨٩'.indexOf(digit).toString());
    }

    getReverseAnswerVariants(text) {
        const normalized = this.normalizeReverseGameText(this.normalizeReverseGameDigits(text));
        const variants = new Set([normalized]);

        if (normalized.startsWith('ال') && normalized.length > 2) {
            variants.add(normalized.slice(2));
        }

        if (normalized.startsWith('سفر ')) {
            variants.add(normalized.replace(/^سفر\s+/, ''));
        }

        if (normalized.startsWith('كتاب ')) {
            variants.add(normalized.replace(/^كتاب\s+/, ''));
        }

        const words = normalized.split(' ');
        if (words.length > 1 && words[0] === 'ال') {
            variants.add(words.slice(1).join(' '));
        }

        return Array.from(variants).filter(Boolean);
    }

    reverseCharacters(text) {
        return Array.from(String(text || '').replace(/\s+/g, ' ').trim()).reverse().join('');
    }

    getReverseDifficultyRank(difficulty) {
        switch (difficulty) {
            case 'easy':
                return 0;
            case 'hard':
                return 2;
            case 'expert':
                return 3;
            case 'medium':
            default:
                return 1;
        }
    }

    matchesReverseDifficulty(entry, difficulty) {
        const rank = this.getReverseDifficultyRank(difficulty);
        const wordCount = entry.term.split(/\s+/).filter(Boolean).length;

        if (difficulty === 'easy') {
            return entry.difficulty === 'easy' || wordCount === 1;
        }

        if (difficulty === 'medium') {
            return this.getReverseDifficultyRank(entry.difficulty) <= 1;
        }

        if (difficulty === 'hard') {
            return this.getReverseDifficultyRank(entry.difficulty) >= 1 && wordCount >= 2;
        }

        return entry.difficulty === 'expert' || wordCount >= 3 || entry.term.length >= 10;
    }

    pickReverseGameTerm() {
        const category = document.getElementById('reverse-category-select').value || 'random';
        const difficulty = document.getElementById('reverse-difficulty-select').value || 'medium';
        const pool = this.buildReverseGamePool(category, difficulty);
        if (!pool.length) {
            return null;
        }

        return pool[Math.floor(Math.random() * pool.length)];
    }

    buildReverseGamePool(category, difficulty = 'medium') {
        const terms = [];
        const sourcePool = this.reverseGamePool || this.createReverseGamePool();

        const pushEntries = (entries, label) => {
            entries
                .filter(entry => this.matchesReverseDifficulty(entry, difficulty))
                .forEach(entry => {
                    const answers = new Set([
                        ...this.getReverseAnswerVariants(entry.term),
                        ...(entry.aliases || []).flatMap(alias => this.getReverseAnswerVariants(alias))
                    ]);

                    terms.push({
                        term: entry.term,
                        category: label,
                        difficulty: entry.difficulty || difficulty,
                        answers: Array.from(answers)
                    });
                });
        };

        if (category === 'book' || category === 'random') {
            pushEntries(sourcePool.books, 'اسم سفر');
        }

        if (category === 'name' || category === 'random') {
            pushEntries(sourcePool.names, 'اسم');
        }

        if (category === 'place' || category === 'random') {
            pushEntries(sourcePool.places, 'مكان');
        }

        return terms;
    }

    startReverseGame() {
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
        document.getElementById('reverse-next-btn').disabled = true;
        document.getElementById('reverse-game-status').textContent = 'اقرأ الكلمة المعكوسة واكتب الإجابة الصحيحة.';
        document.getElementById('reverse-game-score').textContent = '0%';
        this.startReverseGameTimer();
        this.persistReverseGameState();
    }

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
    }

    stopReverseGameTimer() {
        if (this.reverseGameTimer) {
            clearInterval(this.reverseGameTimer);
            this.reverseGameTimer = null;
        }
    }

    updateReverseHighScore(score) {
        const currentBest = parseInt(localStorage.getItem(this.reverseGameHighScoreKey) || '0', 10) || 0;
        if (score > currentBest) {
            localStorage.setItem(this.reverseGameHighScoreKey, String(score));
            document.getElementById('reverse-game-high-score').textContent = `${score}%`;
        }
    }

    checkReverseGameAnswer() {
        if (!this.reverseGameState.term) {
            this.showValidationMessage('ابدأ لعبة الكلمات المعكوسة أولاً.', 'error');
            return;
        }

        const userAnswer = this.normalizeReverseGameText(document.getElementById('reverse-game-answer').value);
        const expectedAnswers = this.reverseGameState.answers && this.reverseGameState.answers.length
            ? this.reverseGameState.answers
            : this.getReverseAnswerVariants(this.reverseGameState.term);

        const score = expectedAnswers.some(answer => userAnswer === answer) ? 100 : 0;
        this.reverseGameState.lastScore = score;
        document.getElementById('reverse-game-status').textContent = score === 100
            ? 'إجابة صحيحة. أحسنت.'
            : 'إجابة غير صحيحة. جرّب مرة أخرى.';
        document.getElementById('reverse-game-score').textContent = `${score}%`;
        this.updateReverseHighScore(score);
        this.persistReverseGameState();
        this.stopReverseGameTimer();
        document.getElementById('reverse-check-btn').disabled = true;
        document.getElementById('reverse-next-btn').disabled = false;
    }

    revealReverseGameAnswer() {
        if (!this.reverseGameState.term) {
            return;
        }

        document.getElementById('reverse-game-answer').value = this.reverseGameState.term;
        document.getElementById('reverse-game-status').textContent = 'تم إظهار الإجابة الصحيحة.';
        document.getElementById('reverse-reveal-btn').disabled = true;
        this.stopReverseGameTimer();
    }

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
    }

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
    }

    persistGamePreferences() {
        localStorage.setItem(this.gameDifficultyKey, this.gameDifficulty);
    }

    persistGameState() {
        if (!this.gameState.verse) {
            return;
        }

        localStorage.setItem(this.gameStateKey, JSON.stringify({
            verse: this.gameState.verse,
            lastScore: this.gameState.lastScore
        }));
    }

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
    }

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
    }

    setupViewSwitcher() {
        const quoteViewBtn = document.getElementById('quote-view-btn');
        const gameViewBtn = document.getElementById('game-view-btn');
        const reverseViewBtn = document.getElementById('reverse-view-btn');

        quoteViewBtn.addEventListener('click', () => this.setActiveView('quote'));
        gameViewBtn.addEventListener('click', () => this.setActiveView('game'));
        reverseViewBtn.addEventListener('click', () => this.setActiveView('reverse'));

        this.setActiveView('quote');
    }

    setActiveView(view) {
        this.activeView = view;

        const quoteViewPanel = document.getElementById('quote-view-panel');
        const gameViewPanel = document.getElementById('game-view-panel');
        const reverseViewPanel = document.getElementById('reverse-view-panel');
        const quoteViewBtn = document.getElementById('quote-view-btn');
        const gameViewBtn = document.getElementById('game-view-btn');
        const reverseViewBtn = document.getElementById('reverse-view-btn');

        const isQuoteView = view === 'quote';
        const isGameView = view === 'game';
        const isReverseView = view === 'reverse';
        quoteViewPanel.classList.toggle('hidden', !isQuoteView);
        gameViewPanel.classList.toggle('hidden', !isGameView);
        reverseViewPanel.classList.toggle('hidden', !isReverseView);
        quoteViewBtn.classList.toggle('active', isQuoteView);
        gameViewBtn.classList.toggle('active', isGameView);
        reverseViewBtn.classList.toggle('active', isReverseView);
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

    normalizeGameText(text) {
        return this.normalizeArabicForMatch(text)
            .replace(/[\u060C\u061B\u061F\.,!?:;"'()\[\]{}«»ـ]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase();
    }

    normalizeArabicForMatch(text) {
        return String(text || '')
            .normalize('NFKD')
            .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
            .replace(/[أإآٱ]/g, 'ا')
            .replace(/ى/g, 'ي')
            .replace(/ة/g, 'ه')
            .replace(/ؤ/g, 'و')
            .replace(/ئ/g, 'ي');
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
            bookId,
            bookName: book.name_ar || book.name,
            chapter: parseInt(chapter),
            verse: parseInt(verse),
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
    }

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
    }

    startNextMemorizeGame() {
        if (this.gameState.nextVerse) {
            this.startMemorizeGameWithVerse(this.gameState.nextVerse);
            return;
        }

        this.startMemorizeGame();
    }

    refreshGamePreviewForCurrentVerse() {
        if (this.gameState.verse) {
            this.startMemorizeGameWithVerse(this.gameState.verse);
        }
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
    }

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
    }

    stopGameTimer() {
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
            this.gameTimer = null;
        }
    }

    updateHighScore(score) {
        const currentBest = parseInt(localStorage.getItem(this.gameHighScoreKey) || '0', 10) || 0;
        if (score > currentBest) {
            localStorage.setItem(this.gameHighScoreKey, String(score));
            document.getElementById('game-high-score').textContent = `${score}%`;
        }
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
        this.stopGameTimer();
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
        if (!this.currentVerse.bookId) {
            this.currentVerse.bookId = verseData.book || verseData.book_ar || verseData.bookName || '';
        }
        if (!this.currentVerse.bookName) {
            this.currentVerse.bookName = verseData.book_ar || verseData.book || verseData.bookName || '';
        }
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
