// VerseUp Arena — application shell. Owns the shared app state, the page
// dispatcher (one HTML page per feature, selected via <body data-page>), the
// verse browser, and composition of the shared + feature mixins. Shared
// UI concerns live in js/shared/, features in js/features/.
import { reverseGameMixin } from './features/games/reverse-game.js';
import { scrambleGameMixin } from './features/games/scramble-game.js';
import { quoteFeatureMixin } from './features/quote/quote-feature.js';
import { memoryGameMixin } from './features/games/memory-game.js';
import { whoamiGameMixin } from './features/games/whoami-game.js';
import { wordleGameMixin } from './features/games/wordle-game.js';
import { emojiverseGameMixin } from './features/games/emojiverse-game.js';
import { crosswordGameMixin } from './features/games/crossword-game.js';
import { attachSwipeGrading } from './features/games/game-utils.js';
import { navbarMixin } from './shared/navbar.js';
import { themeMixin } from './shared/theme.js';
import { navigationMixin } from './shared/navigation.js';

class BibleQuoteGenerator {
    constructor() {
        // The quote canvas only exists on the quote page now. Guard against
        // pages that don't contain it so the constructor never throws.
        this.canvas = document.getElementById('quote-canvas');
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        this.bibleData = null;
        this.bibleDataReady = false;
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
        this.scrambleGameStateKey = 'bible-scramble-game-state';
        this.scrambleGameCategoryKey = 'bible-scramble-game-category';
        this.scrambleGameDifficultyKey = 'bible-scramble-game-difficulty';
        this.scrambleGamePool = this.reverseGamePool;
        this.termGameUsedTerms = new Set();
        this.whoamiGameState = {
            person: null,
            category: '',
            difficulty: 'medium',
            revealed: false,
            graded: false,
            seenCount: 0,
            knewCount: 0,
            didntCount: 0
        };
        this.whoamiGameDifficultyKey = 'bible-whoami-game-difficulty';
        this.whoamiGamePool = this.createWhoamiGamePool();
        this.whoamiUsedPersons = new Set();
        this.wordleGameTimer = null;
        this.wordleGameStartTime = null;
        this.wordleGameState = {
            target: null,
            targetLetters: [],
            displayLetters: [],
            length: 5,
            category: 'random',
            displayCategory: '',
            rows: [],
            current: [],
            finished: null,
            lastScore: 0
        };
        this.wordleGameStateKey = 'bible-wordle-game-state';
        this.wordleGameCategoryKey = 'bible-wordle-game-category';
        this.wordleGameLengthKey = 'bible-wordle-game-length';
        this.wordleGamePool = this.createWordlePool();
        this.wordleUsedWords = new Set();
        this.emojiverseGameState = {
            card: null,
            category: '',
            difficulty: 'medium',
            revealed: false,
            graded: false,
            seenCount: 0,
            knewCount: 0,
            didntCount: 0
        };
        this.emojiverseGameDifficultyKey = 'bible-emojiverse-game-difficulty';
        this.emojiverseGamePool = this.createEmojiverseGamePool();
        this.emojiverseUsedCards = new Set();
        this.crosswordGameState = {
            entries: [],
            current: null,
            currentIndex: 0,
            guess: '',
            revealed: false,
            score: 0,
            totalRounds: 1,
            status: '',
            difficulty: 'medium',
            puzzle: null,
            selectedCell: null,
            puzzleTitle: '',
            crosswordSolved: new Map()
        };
        this.crosswordDifficultyKey = 'bible-crossword-difficulty';

        this.logoImage.onload = () => { this.logoLoaded = true; };
        this.logoImage.src = 'assets/icons/logo.svg';

        // Each page sets <body data-page="..."> so this shared app only wires
        // and initializes the feature rendered on the current page.
        this.page = (document.body && document.body.dataset.page) || 'home';

        // Set up the splash first so it can never be blocked by an init error.
        this.setupSplash();

        // Initialise the page feature; any error here must not freeze the app.
        try {
            this.setupNavbar();
            this.initializePage();
            this.setupThemeToggle();
        } catch (error) {
            console.error('VerseUp initialisation error:', error);
        }
    }

    // Lazy-loads the full Arabic Bible dataset the first time a view that needs
    // it (quote / memory game) is opened. Reverse, scrambled and "Who am I?"
    // games use their own bundled pools and never trigger this fetch.
    async ensureBibleDataLoaded() {
        if (this.bibleData) return this.bibleData;

        this.bibleData = await bibleAPI.loadBibleData();
        if (this.bibleData && !this.bibleDataReady) {
            // Only populate the controls that actually exist on this page.
            if (document.getElementById('book-select')) this.populateBookSelect();
            if (document.getElementById('game-book-select')) this.populateGameBookSelect();
            if (typeof this.buildGameVersePool === 'function') this.buildGameVersePool();
            if (typeof this.restorePendingGameState === 'function' && document.getElementById('game-verse-display')) {
                this.restorePendingGameState();
            }
            // Once the full Bible is available the memory game can resolve the
            // next verse for its button (a restored round may need re-preview).
            if (typeof this.updateNextVersePreview === 'function' && document.getElementById('game-next-reference')) {
                this.updateNextVersePreview();
            }
            this.bibleDataReady = true;
        }
        return this.bibleData;
    }


    // Shows the branded splash screen on first open and fades it out once the
    // page has finished loading (or after a short safety timeout).
    setupSplash() {
        const splash = document.getElementById('splash');
        if (!splash) return;

        const startedAt = Date.now();
        const MIN_DISPLAY = 800; // keep the splash visible briefly for the branded intro

        const hideSplash = () => {
            const delay = Math.max(0, MIN_DISPLAY - (Date.now() - startedAt));
            const finalHide = () => {
                splash.classList.add('splash-hidden');
                setTimeout(() => {
                    if (splash.parentNode) splash.parentNode.removeChild(splash);
                }, 400);
            };

            if (delay > 0) {
                setTimeout(finalHide, delay);
            } else {
                finalHide();
            }
        };

        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            hideSplash();
        } else {
            window.addEventListener('load', hideSplash, { once: true });
            window.addEventListener('pageshow', hideSplash, { once: true });
            setTimeout(hideSplash, 1800); // guaranteed safety fallback
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

        const whoamiStartBtn = document.getElementById('whoami-start-btn');
        const whoamiNextBtn = document.getElementById('whoami-next-btn');
        const whoamiFlipCard = document.getElementById('whoami-flip-card');
        const whoamiDifficultySelect = document.getElementById('whoami-difficulty-select');
        const whoamiKnewBtn = document.getElementById('whoami-knew-btn');
        const whoamiDidntBtn = document.getElementById('whoami-didnt-btn');

        whoamiStartBtn.addEventListener('click', () => this.startWhoamiGame());
        whoamiNextBtn.addEventListener('click', () => this.nextWhoamiCard());
        whoamiFlipCard.addEventListener('click', () => this.flipWhoamiCard());
        whoamiFlipCard.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.flipWhoamiCard();
            }
        });
        whoamiKnewBtn.addEventListener('click', () => this.gradeWhoamiCard(true));
        whoamiDidntBtn.addEventListener('click', () => this.gradeWhoamiCard(false));
        whoamiDifficultySelect.addEventListener('change', () => {
            this.whoamiGameState.difficulty = whoamiDifficultySelect.value;
            this.persistWhoamiGamePreferences();
            if (this.whoamiUsedPersons) this.whoamiUsedPersons.clear();
            // Restart cleanly when switching levels (score is per-level).
            this.whoamiGameState.knewCount = 0;
            this.whoamiGameState.didntCount = 0;
            this.whoamiGameState.graded = false;
            this.resetWhoamiFlip();
            this.updateWhoamiCounters();
        });

        bookSelect.addEventListener('change', () => this.onBookChange());
        chapterSelect.addEventListener('change', () => this.onChapterChange());
        verseSelect.addEventListener('change', () => this.onVerseChange());

        document.getElementById('verse-search').value = '';
        document.getElementById('search-results').innerHTML = '';
        document.getElementById('search-results').style.display = 'none';
    }

    // Wire up only the controls present on the current page, based on
    // <body data-page="..."> set on each separate HTML page.
    initializePage() {
        switch (this.page) {
            case 'quote':
                this.wireQuoteControls();
                this.setupSearchFunctionality();
                this.setupColorCombinations();
                this.setupFontSelection();
                this.setupVerseTextSelection();
                this.initializeCanvas();
                this.ensureBibleDataLoaded();
                break;
            case 'memory':
                this.wireMemorizeControls();
                this.loadGamePreferences();
                this.ensureBibleDataLoaded();
                break;
            case 'reverse':
                this.wireReverseControls();
                this.loadReverseGamePreferences();
                // First word is ready immediately — no start button needed.
                this.startReverseGame();
                break;
            case 'scramble':
                this.wireScrambleControls();
                this.loadScrambleGamePreferences();
                // First word is ready immediately — no start button needed.
                this.startScrambleGame();
                break;
            case 'whoami':
                this.wireWhoamiControls();
                this.loadWhoamiGamePreferences();
                // First card is ready immediately — no start button needed.
                this.startWhoamiGame();
                break;
            case 'wordle':
                this.wireWordleControls();
                this.warmWordleDictionary();
                this.loadWordleGamePreferences();
                // Fresh visitors get a word immediately; returning players
                // resume the round saved from their last visit.
                if (!this.wordleGameState.target) this.startWordleGame();
                break;
            case 'emojiverse':
                this.wireEmojiverseControls();
                this.loadEmojiverseGamePreferences();
                // First card is ready immediately — no start button needed.
                this.startEmojiverseGame();
                break;
            case 'crossword':
                this.wireCrosswordControls();
                this.loadCrosswordGamePreferences();
                this.loadCrosswordDictionaryEntries();
                break;
            default:
                // 'home' page needs no feature wiring, but its launcher cards
                // should navigate to the matching feature pages (shared
                // navigation mixin).
                this.wireHomeCardNavigation();
                break;
        }
    }

    wireQuoteControls() {
        const generateBtn = document.getElementById('generate-btn');
        const downloadBtn = document.getElementById('download-btn');
        const loadVerseBtn = document.getElementById('load-verse-btn');
        const bookSelect = document.getElementById('book-select');
        const chapterSelect = document.getElementById('chapter-select');
        const verseSelect = document.getElementById('verse-select');
        const quotePrevBtn = document.getElementById('quote-prev-btn');
        const quoteNextBtn = document.getElementById('quote-next-btn');

        if (generateBtn) generateBtn.addEventListener('click', () => this.generateImage());
        if (downloadBtn) downloadBtn.addEventListener('click', () => this.downloadImage());
        if (loadVerseBtn) loadVerseBtn.addEventListener('click', () => this.loadSelectedVerse());
        if (bookSelect) bookSelect.addEventListener('change', () => this.onBookChange());
        if (chapterSelect) chapterSelect.addEventListener('change', () => this.onChapterChange());
        if (verseSelect) verseSelect.addEventListener('change', () => this.onVerseChange());
        if (quotePrevBtn) quotePrevBtn.addEventListener('click', () => this.loadAdjacentQuoteVerse(-1));
        if (quoteNextBtn) quoteNextBtn.addEventListener('click', () => this.loadAdjacentQuoteVerse(1));

        const searchInput = document.getElementById('verse-search');
        if (searchInput) searchInput.value = '';
        const searchResults = document.getElementById('search-results');
        if (searchResults) {
            searchResults.innerHTML = '';
            searchResults.style.display = 'none';
        }
    }

    wireMemorizeControls() {
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

        if (gameSpecificBtn) gameSpecificBtn.disabled = true;
        if (gameNextBtn) gameNextBtn.disabled = true;

        if (gameStartBtn) gameStartBtn.addEventListener('click', () => this.startMemorizeGame());
        if (gameSpecificBtn) gameSpecificBtn.addEventListener('click', () => this.startMemorizeGameFromSelection());
        if (gameNextBtn) gameNextBtn.addEventListener('click', () => this.startNextMemorizeGame());
        if (gameCheckBtn) gameCheckBtn.addEventListener('click', () => this.checkMemorizeGameAnswer());
        if (gameRevealBtn) gameRevealBtn.addEventListener('click', () => this.revealMemorizeGameAnswer());
        if (gameVerseDisplay) gameVerseDisplay.addEventListener('input', () => {
            if (gameCheckBtn) gameCheckBtn.disabled = !this.gameState.verse || !this.areGameAnswersFilled();
        });
        // Word-bank chips: tap a word to fill the first empty blank.
        const gameWordChips = document.getElementById('game-word-chips');
        if (gameWordChips) gameWordChips.addEventListener('click', (event) => {
            const chip = event.target.closest('.memory-chip');
            if (!chip) return;
            if (this.fillGameBlankFromChip(chip.textContent)) this.syncMemoryChipStates();
        });
        if (gameDifficultySelect) gameDifficultySelect.addEventListener('change', () => {
            this.gameDifficulty = gameDifficultySelect.value;
            this.persistGamePreferences();
            this.refreshGamePreviewForCurrentVerse();
        });
        if (gameBookSelect) gameBookSelect.addEventListener('change', () => this.onGameBookChange());
        if (gameChapterSelect) gameChapterSelect.addEventListener('change', () => this.onGameChapterChange());
        if (gameVerseSelect) gameVerseSelect.addEventListener('change', () => this.onGameVerseChange());
    }

    wireReverseControls() {
        const reverseNextBtn = document.getElementById('reverse-next-btn');
        const reverseCheckBtn = document.getElementById('reverse-check-btn');
        const reverseRevealBtn = document.getElementById('reverse-reveal-btn');
        const reverseAnswer = document.getElementById('reverse-game-answer');
        const reverseCategorySelect = document.getElementById('reverse-category-select');
        const reverseDifficultySelect = document.getElementById('reverse-difficulty-select');

        if (reverseNextBtn) reverseNextBtn.disabled = true;
        if (reverseCheckBtn) reverseCheckBtn.disabled = true;

        if (reverseNextBtn) reverseNextBtn.addEventListener('click', () => this.startReverseGame());
        if (reverseCheckBtn) reverseCheckBtn.addEventListener('click', () => this.checkReverseGameAnswer());
        if (reverseRevealBtn) reverseRevealBtn.addEventListener('click', () => this.revealReverseGameAnswer());
        if (reverseAnswer) reverseAnswer.addEventListener('input', () => {
            if (reverseCheckBtn) reverseCheckBtn.disabled = !this.reverseGameState.term || reverseAnswer.value.trim().length === 0;
            // Live auto-check: the moment the typed answer matches, jump ahead.
            if (this.reverseGameState.term && reverseAnswer.value.trim()) this.maybeAutoCheckReverseAnswer();
        });
        if (reverseAnswer) reverseAnswer.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && reverseCheckBtn && !reverseCheckBtn.disabled) this.checkReverseGameAnswer();
        });
        if (reverseCategorySelect) reverseCategorySelect.addEventListener('change', () => {
            this.reverseGameState.category = reverseCategorySelect.value;
            this.persistReverseGamePreferences();
        });
        if (reverseDifficultySelect) reverseDifficultySelect.addEventListener('change', () => {
            this.reverseGameState.difficulty = reverseDifficultySelect.value;
            this.persistReverseGamePreferences();
        });
    }

    wireScrambleControls() {
        const scrambleNextBtn = document.getElementById('scramble-next-btn');
        const scrambleCheckBtn = document.getElementById('scramble-check-btn');
        const scrambleRevealBtn = document.getElementById('scramble-reveal-btn');
        const scrambleAnswer = document.getElementById('scramble-game-answer');
        const scrambleCategorySelect = document.getElementById('scramble-category-select');
        const scrambleDifficultySelect = document.getElementById('scramble-difficulty-select');

        if (scrambleNextBtn) scrambleNextBtn.disabled = true;
        if (scrambleCheckBtn) scrambleCheckBtn.disabled = true;

        if (scrambleNextBtn) scrambleNextBtn.addEventListener('click', () => this.startScrambleGame());
        if (scrambleCheckBtn) scrambleCheckBtn.addEventListener('click', () => this.checkScrambleGameAnswer());
        if (scrambleRevealBtn) scrambleRevealBtn.addEventListener('click', () => this.revealScrambleGameAnswer());
        if (scrambleAnswer) scrambleAnswer.addEventListener('input', () => {
            if (scrambleCheckBtn) scrambleCheckBtn.disabled = !this.scrambleGameState.term || scrambleAnswer.value.trim().length === 0;
            this.syncScrambleTileStates();
            // Live auto-check: the moment the answer matches, jump ahead.
            if (this.scrambleGameState.term && scrambleAnswer.value.trim()) this.maybeAutoCheckScrambleAnswer();
        });
        if (scrambleAnswer) scrambleAnswer.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && scrambleCheckBtn && !scrambleCheckBtn.disabled) this.checkScrambleGameAnswer();
        });
        // Tap-to-build letter tiles (no OS keyboard needed on phones).
        const scrambleTiles = document.getElementById('scramble-tiles');
        if (scrambleTiles) scrambleTiles.addEventListener('click', (event) => {
            const tileEl = event.target.closest('.scramble-tile');
            if (tileEl) this.handleScrambleTileClick(tileEl);
        });
        const scrambleBackspace = document.getElementById('scramble-backspace');
        if (scrambleBackspace) scrambleBackspace.addEventListener('click', () => this.scrambleBackspace());
        if (scrambleCategorySelect) scrambleCategorySelect.addEventListener('change', () => {
            this.scrambleGameState.category = scrambleCategorySelect.value;
            this.persistScrambleGamePreferences();
        });
        if (scrambleDifficultySelect) scrambleDifficultySelect.addEventListener('change', () => {
            this.scrambleGameState.difficulty = scrambleDifficultySelect.value;
            this.persistScrambleGamePreferences();
        });
    }

    wireWordleControls() {
        const wordleNextBtn = document.getElementById('wordle-next-btn');
        const wordleRevealBtn = document.getElementById('wordle-reveal-btn');
        const wordleCategorySelect = document.getElementById('wordle-category-select');
        const wordleLengthSelect = document.getElementById('wordle-length-select');

        if (wordleNextBtn) wordleNextBtn.disabled = true;
        if (wordleRevealBtn) wordleRevealBtn.disabled = true;

        if (wordleNextBtn) wordleNextBtn.addEventListener('click', () => this.startWordleGame());
        if (wordleRevealBtn) wordleRevealBtn.addEventListener('click', () => this.revealWordleAnswer());
        // In-board replay: one tap right where the round just ended.
        const wordleAgainBtn = document.getElementById('wordle-again-btn');
        if (wordleAgainBtn) wordleAgainBtn.addEventListener('click', () => this.startWordleGame());

        if (wordleCategorySelect) wordleCategorySelect.addEventListener('change', () => {
            this.wordleGameState.category = wordleCategorySelect.value;
            this.persistWordleGamePreferences();
        });
        if (wordleLengthSelect) wordleLengthSelect.addEventListener('change', () => {
            this.wordleGameState.length = parseInt(wordleLengthSelect.value, 10) || 5;
            this.persistWordleGamePreferences();
            // A different word length starts a fresh round immediately.
            this.startWordleGame();
        });

        this.buildWordleKeyboard();

        // Physical keyboard support: Arabic-layout letters, Enter, Backspace.
        // Skips keystrokes while a form control has focus, and lets buttons
        // keep their native Enter/Space activation.
        if (!this.wordleKeyHandler) {
            this.wordleKeyHandler = (event) => {
                const active = document.activeElement;
                const tag = active ? active.tagName : '';
                if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
                if (tag === 'BUTTON' && (event.key === 'Enter' || event.key === ' ')) return;
                this.handleWordleKey(event.key);
            };
            document.addEventListener('keydown', this.wordleKeyHandler);
        }
    }

    wireWhoamiControls() {
        const whoamiNextBtn = document.getElementById('whoami-next-btn');
        const whoamiFlipCard = document.getElementById('whoami-flip-card');
        const whoamiDifficultySelect = document.getElementById('whoami-difficulty-select');
        const whoamiKnewBtn = document.getElementById('whoami-knew-btn');
        const whoamiDidntBtn = document.getElementById('whoami-didnt-btn');

        if (whoamiNextBtn) whoamiNextBtn.addEventListener('click', () => this.nextWhoamiCard());
        if (whoamiFlipCard) {
            whoamiFlipCard.addEventListener('click', () => this.flipWhoamiCard());
            whoamiFlipCard.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.flipWhoamiCard();
                }
            });
            // Phone gesture (RTL): swipe left = knew it, swipe right = didn't.
            attachSwipeGrading(whoamiFlipCard, {
                onSwipeLeft: () => this.gradeWhoamiCard(true),
                onSwipeRight: () => this.gradeWhoamiCard(false)
            });
        }
        if (whoamiKnewBtn) whoamiKnewBtn.addEventListener('click', () => this.gradeWhoamiCard(true));
        if (whoamiDidntBtn) whoamiDidntBtn.addEventListener('click', () => this.gradeWhoamiCard(false));
        if (whoamiDifficultySelect) whoamiDifficultySelect.addEventListener('change', () => {
            this.whoamiGameState.difficulty = whoamiDifficultySelect.value;
            this.persistWhoamiGamePreferences();
            // Restart cleanly when switching levels (score is per-level) and
            // show the first card of the new level right away.
            this.startWhoamiGame();
        });
    }

    // EmojiVerse (إيموجي آية) — emoji flash-card game controls.
    wireEmojiverseControls() {
        const nextBtn = document.getElementById('emojiverse-next-btn');
        const flipCard = document.getElementById('emojiverse-flip-card');
        const difficultySelect = document.getElementById('emojiverse-difficulty-select');
        const knewBtn = document.getElementById('emojiverse-knew-btn');
        const didntBtn = document.getElementById('emojiverse-didnt-btn');

        if (nextBtn) nextBtn.addEventListener('click', () => this.nextEmojiverseCard());
        if (flipCard) {
            flipCard.addEventListener('click', () => this.flipEmojiverseCard());
            flipCard.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.flipEmojiverseCard();
                }
            });
            // Phone gesture (RTL): swipe left = knew it, swipe right = didn't.
            attachSwipeGrading(flipCard, {
                onSwipeLeft: () => this.gradeEmojiverseCard(true),
                onSwipeRight: () => this.gradeEmojiverseCard(false)
            });
        }
        if (knewBtn) knewBtn.addEventListener('click', () => this.gradeEmojiverseCard(true));
        if (didntBtn) didntBtn.addEventListener('click', () => this.gradeEmojiverseCard(false));
        if (difficultySelect) difficultySelect.addEventListener('change', () => {
            this.emojiverseGameState.difficulty = difficultySelect.value;
            this.persistEmojiverseGamePreferences();
            // Restart cleanly when switching levels (score is per-level) and
            // show the first card of the new level right away.
            this.startEmojiverseGame();
        });
    }

    wireCrosswordControls() {
        const nextBtn = document.getElementById('crossword-next-btn');
        const checkBtn = document.getElementById('crossword-check-btn');
        const revealBtn = document.getElementById('crossword-reveal-btn');
        const answerInput = document.getElementById('crossword-answer');
        const difficultySelect = document.getElementById('crossword-difficulty-select');

        // "New Board" loads a whole fresh puzzle, not just the next clue —
        // switching clues is already possible by clicking a clue or a cell.
        if (nextBtn) nextBtn.addEventListener('click', () => this.startNewCrosswordBoard());
        if (checkBtn) checkBtn.addEventListener('click', () => this.checkCrosswordAnswer());
        if (revealBtn) revealBtn.addEventListener('click', () => this.revealCrosswordAnswer());
        if (answerInput) {
            answerInput.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    this.checkCrosswordAnswer();
                }
            });
            answerInput.addEventListener('input', () => {
                const active = this.crosswordGameState.current || (this.crosswordGameState.entries || [])[0];
                if (active && active.answer) {
                    answerInput.value = answerInput.value.slice(0, active.answer.length);
                }
                this.crosswordGameState.guess = answerInput.value;
                this.updateCrosswordTypedLetters();
            });
        }
        if (difficultySelect) {
            difficultySelect.addEventListener('change', () => {
                this.crosswordGameState.difficulty = difficultySelect.value;
                localStorage.setItem(this.crosswordDifficultyKey, difficultySelect.value);
                // Rebuild the whole board for the selected difficulty level.
                this.startNewCrosswordBoard();
            });
        }
    }

    loadCrosswordGamePreferences() {
        const saved = localStorage.getItem(this.crosswordDifficultyKey);
        if (!saved) return;
        const select = document.getElementById('crossword-difficulty-select');
        // Only apply saved values that still exist as dropdown options so a
        // stale localStorage entry can never leave the dropdown blank.
        if (select && Array.from(select.options).some(option => option.value === saved)) {
            select.value = saved;
            this.crosswordGameState.difficulty = saved;
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
            // Re-evaluate the prev/next verse buttons for the newly loaded verse.
            this.updateQuoteAdjacentButtons();
        } else {
            this.showValidationMessage('الآية غير موجودة', 'error');
        }
    }


}

// Compose the shared app-shell mixins (navigation, navbar, theme) and every
// page-feature mixin onto the prototype — the same composition pattern the
// monolith used, now spread across shared/ and features/ modules.
Object.assign(
    BibleQuoteGenerator.prototype,
    navigationMixin,
    navbarMixin,
    themeMixin,
    reverseGameMixin,
    scrambleGameMixin,
    wordleGameMixin,
    quoteFeatureMixin,
    memoryGameMixin,
    whoamiGameMixin,
    emojiverseGameMixin,
    crosswordGameMixin
);

document.addEventListener('DOMContentLoaded', () => {
    new BibleQuoteGenerator();
});

document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        const generateBtn = document.getElementById('generate-btn');
        const downloadBtn = document.getElementById('download-btn');
        switch (e.key) {
            case 'Enter':
                if (!generateBtn) break;
                e.preventDefault();
                generateBtn.click();
                break;
            case 's':
                if (!downloadBtn || downloadBtn.disabled) break;
                e.preventDefault();
                downloadBtn.click();
                break;
        }
    }
});
