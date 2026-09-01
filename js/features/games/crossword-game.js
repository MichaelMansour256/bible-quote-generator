import { normalizeArabicForMatch } from './game-utils.js';

export function normalizeCrosswordTerm(text = '') {
    return String(text || '')
        .normalize('NFKD')
        .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
        .replace(/[أإآٱ]/g, 'ا')
        .replace(/ى/g, 'ي')
        .replace(/ة/g, 'ه')
        .replace(/ؤ/g, 'و')
        .replace(/ئ/g, 'ي')
        .replace(/[\u061F\u060C\u061B\.,!?:;\-\_\(\)\[\]\{\}"'«»/\\]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

export function selectCrosswordEntries(dictionary = {}, count = 6) {
    const entries = [];
    const seen = new Set();

    const values = Array.isArray(dictionary) ? dictionary : Object.values(dictionary || {});
    values.forEach(item => {
        if (!item) return;

        const rawTerm = item.word || item.term || item.search || item.answer || '';
        const normalized = normalizeCrosswordTerm(rawTerm);
        if (!normalized || normalized.length < 3 || normalized.length > 18) return;
        if (!/[\u0600-\u06FF]/.test(normalized)) return;
        if (!/^[\u0600-\u06FF\s]+$/.test(normalized)) return;
        if (seen.has(normalized)) return;

        seen.add(normalized);
        entries.push({
            answer: normalized,
            clue: (item.definition || item.search || item.word || item.term || '').replace(/\s+/g, ' ').trim(),
            category: 'dictionary'
        });
    });

    if (entries.length > count) {
        const shuffled = [...entries].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    }

    return entries.slice(0, count);
}

export async function loadCrosswordDictionaryData(url = '../js/data/bible-dictionary/bible_dictionary_game.json') {
    if (typeof fetch !== 'function') {
        return [];
    }

    try {
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) return [];
        return await response.json();
    } catch (error) {
        console.warn('Failed to load crossword dictionary data', error);
        return [];
    }
}

const CROSSWORD_LAYOUT = [
    { answer: 'يسوع', clue: 'اسم المخلص في العهد الجديد.', direction: 'across', row: 2, col: 0 },
    { answer: 'يهوذا', clue: 'اسم أحد الحواريين، وهو الذي أسلمه.', direction: 'down', row: 0, col: 2 }
];

export const crosswordGameMixin = {
    getCrosswordEntriesFromSource(payload = []) {
        const fallback = CROSSWORD_LAYOUT.map(item => ({
            answer: item.answer,
            clue: item.clue,
            direction: item.direction,
            row: item.row,
            col: item.col,
            category: 'dictionary'
        }));

        const dictionaryWords = selectCrosswordEntries(payload, 12).filter(entry => entry.answer.length >= 4 && entry.answer.length <= 7);
        const matches = [...dictionaryWords].filter(entry => /يسوع|يهوذا|موسى|مريم|القدس|داود|يوحنا/i.test(entry.answer));

        if (matches.length >= 2) {
            return matches.slice(0, 2).map((entry, index) => ({
                answer: normalizeCrosswordTerm(entry.answer),
                clue: entry.clue || 'كلمة من قاموس الكتاب المقدس.',
                direction: index % 2 === 0 ? 'across' : 'down',
                row: index % 2 === 0 ? 2 : 0,
                col: index % 2 === 0 ? 0 : 2,
                category: entry.category || 'dictionary'
            }));
        }

        return fallback;
    },

    async loadCrosswordDictionaryEntries() {
        const dataUrl = this.getCrosswordDictionaryUrl ? this.getCrosswordDictionaryUrl() : '../js/data/bible-dictionary/bible_dictionary_game.json';
        const payload = await loadCrosswordDictionaryData(dataUrl);
        const selected = this.getCrosswordEntriesFromSource(payload);

        this.crosswordGameState.entries = selected;
        this.crosswordGameState.currentIndex = 0;
        this.crosswordGameState.puzzle = this.buildCrosswordPuzzle(selected);
        this.crosswordGameState.current = selected[0];
        this.renderCrosswordPuzzle();

        return selected;
    },

    getCrosswordDictionaryUrl() {
        const path = window.location.pathname || '';
        return path.includes('/pages/')
            ? '../js/data/bible-dictionary/bible_dictionary_game.json'
            : 'js/data/bible-dictionary/bible_dictionary_game.json';
    },

    buildCrosswordPuzzle(entries = []) {
        const normalizedEntries = (entries || [])
            .map((entry, index) => ({
                ...entry,
                answer: normalizeCrosswordTerm(entry.answer || ''),
                direction: entry.direction === 'down' ? 'down' : 'across',
                row: Number.isInteger(entry.row) ? entry.row : 0,
                col: Number.isInteger(entry.col) ? entry.col : 0,
                index
            }))
            .filter(entry => entry.answer && entry.answer.length > 0);

        const boardSize = Math.max(
            7,
            ...normalizedEntries.map(entry => Math.max(entry.answer.length + 2, 7))
        );
        const board = Array.from({ length: boardSize }, () => Array(boardSize).fill(''));
        const filled = new Map();
        const intersections = [];
        const placedEntries = [];

        const placeWord = (entry) => {
            const letters = Array.from(entry.answer);
            const cells = [];

            for (let charIndex = 0; charIndex < letters.length; charIndex += 1) {
                const row = entry.direction === 'down' ? entry.row + charIndex : entry.row;
                const col = entry.direction === 'down' ? entry.col : entry.col + charIndex;

                if (row < 0 || col < 0 || row >= boardSize || col >= boardSize) {
                    return false;
                }

                if (board[row][col] && board[row][col] !== letters[charIndex]) {
                    return false;
                }

                cells.push({ row, col, char: letters[charIndex] });
            }

            cells.forEach(({ row, col, char }) => {
                if (!board[row][col]) {
                    board[row][col] = char;
                    filled.set(`${row}:${col}`, true);
                    return;
                }

                if (board[row][col] === char) {
                    intersections.push({ row, col, char });
                }
            });

            entry.cells = cells;
            placedEntries.push(entry);
            return true;
        };

        if (normalizedEntries.length) {
            const primary = {
                ...normalizedEntries[0],
                direction: 'across',
                row: Math.floor(boardSize / 2),
                col: Math.floor((boardSize - normalizedEntries[0].answer.length) / 2)
            };

            if (!placeWord(primary)) {
                primary.row = 0;
                primary.col = 0;
                placeWord(primary);
            }
        }

        normalizedEntries.slice(1).forEach((entry) => {
            let placed = false;

            for (const existing of placedEntries) {
                const shared = [];
                const firstLetters = Array.from(existing.answer);
                const secondLetters = Array.from(entry.answer);

                for (let leftIndex = 0; leftIndex < firstLetters.length; leftIndex += 1) {
                    for (let rightIndex = 0; rightIndex < secondLetters.length; rightIndex += 1) {
                        if (firstLetters[leftIndex] === secondLetters[rightIndex]) {
                            shared.push({ firstIndex: leftIndex, secondIndex: rightIndex });
                        }
                    }
                }

                if (!shared.length) continue;

                const { firstIndex, secondIndex } = shared[0];
                const candidate = { ...entry, direction: entry.direction === 'down' ? 'down' : 'across' };

                if (candidate.direction === 'down' && existing.direction === 'across') {
                    candidate.row = existing.row - secondIndex;
                    candidate.col = existing.col + firstIndex;
                } else if (candidate.direction === 'across' && existing.direction === 'down') {
                    candidate.row = existing.row + secondIndex;
                    candidate.col = existing.col - firstIndex;
                } else {
                    candidate.row = Math.floor(boardSize / 2);
                    candidate.col = Math.floor((boardSize - candidate.answer.length) / 2);
                }

                if (placeWord(candidate)) {
                    placed = true;
                    break;
                }
            }

            if (!placed) {
                const fallback = {
                    ...entry,
                    row: 0,
                    col: 0,
                    direction: entry.direction === 'down' ? 'down' : 'across'
                };
                placeWord(fallback);
            }
        });

        const dedupedIntersections = [...new Map(
            intersections.map(item => [`${item.row}:${item.col}`, item])
        ).values()];

        return { board, filled, intersections: dedupedIntersections, entries: normalizedEntries };
    },

    renderCrosswordPuzzle() {
        const boardEl = document.getElementById('crossword-grid');
        const clueEl = document.getElementById('crossword-clue');
        const clueListEl = document.getElementById('crossword-clues');
        const answerInput = document.getElementById('crossword-answer');
        const score = document.getElementById('crossword-game-score');
        const highScore = document.getElementById('crossword-game-high-score');
        const status = document.getElementById('crossword-game-status');

        if (!boardEl) return;

        const puzzle = this.crosswordGameState.puzzle || this.buildCrosswordPuzzle(this.crosswordGameState.entries || []);
        const active = this.crosswordGameState.current || this.crosswordGameState.entries[0];

        boardEl.innerHTML = '';
        boardEl.style.setProperty('--crossword-cols', String(puzzle.board.length));
        boardEl.style.gridTemplateColumns = `repeat(${puzzle.board.length}, minmax(0, 1fr))`;

        for (let row = 0; row < puzzle.board.length; row += 1) {
            for (let col = 0; col < puzzle.board[row].length; col += 1) {
                const cell = document.createElement('div');
                const value = puzzle.board[row][col] || '';
                const filled = !!value;
                cell.className = 'crossword-cell';
                if (!filled) cell.classList.add('crossword-empty');
                if (value) cell.textContent = value;
                boardEl.appendChild(cell);
            }
        }

        if (clueEl && active) clueEl.textContent = active.clue || 'اكتب الاسم الصحيح.';
        if (clueListEl) {
            clueListEl.innerHTML = '';
            (this.crosswordGameState.entries || []).forEach((entry, index) => {
                const item = document.createElement('li');
                if (this.crosswordGameState.currentIndex === index) item.classList.add('active');
                item.textContent = `${index + 1}. ${entry.clue}`;
                item.addEventListener('click', () => {
                    this.crosswordGameState.currentIndex = index;
                    this.crosswordGameState.current = entry;
                    this.crosswordGameState.guess = this.crosswordGameState.guess || '';
                    this.renderCrosswordPuzzle();
                });
                clueListEl.appendChild(item);
            });
        }

        if (answerInput) {
            answerInput.value = this.crosswordGameState.guess || '';
            answerInput.placeholder = active ? `اكتب الإجابة: ${active.answer.length} أحرف` : 'اكتب الإجابة';
        }

        if (score) {
            const total = Math.max(this.crosswordGameState.totalRounds || 1, 1);
            score.textContent = `${Math.round((this.crosswordGameState.score / total) * 100)}%`;
        }
        if (highScore) {
            const stored = parseInt(localStorage.getItem(this.crosswordHighScoreKey) || '0', 10) || 0;
            highScore.textContent = `${stored}%`;
        }
        if (status) {
            status.textContent = this.crosswordGameState.status || 'اكتب كلمة، ثم اضغط تحقق أو Enter. الكلمات تتقاطع مع بعضها في الخلية الوسطية.';
        }
    },

    updateCrosswordHighScore(score) {
        const best = parseInt(localStorage.getItem(this.crosswordHighScoreKey) || '0', 10) || 0;
        if (score > best) {
            localStorage.setItem(this.crosswordHighScoreKey, String(score));
            const highScore = document.getElementById('crossword-game-high-score');
            if (highScore) highScore.textContent = `${score}%`;
        }
    },

    advanceCrosswordPuzzle() {
        if (!this.crosswordGameState.entries || !this.crosswordGameState.entries.length) return;

        const nextIndex = (this.crosswordGameState.currentIndex + 1) % this.crosswordGameState.entries.length;
        this.crosswordGameState.currentIndex = nextIndex;
        this.crosswordGameState.current = this.crosswordGameState.entries[nextIndex];
        this.crosswordGameState.guess = '';
        this.crosswordGameState.status = '';
        this.renderCrosswordPuzzle();
    },

    checkCrosswordAnswer() {
        const entry = this.crosswordGameState.current;
        const answerInput = document.getElementById('crossword-answer');
        if (!entry || !answerInput) return;

        const userAnswer = normalizeCrosswordTerm(answerInput.value);
        const expectedAnswer = normalizeCrosswordTerm(entry.answer);
        if (!userAnswer) {
            this.crosswordGameState.status = 'اكتب الإجابة أولاً.';
            this.renderCrosswordPuzzle();
            return;
        }

        const isCorrect = normalizeArabicForMatch(userAnswer) === normalizeArabicForMatch(expectedAnswer);
        this.crosswordGameState.totalRounds = Math.max(this.crosswordGameState.totalRounds || 1, 1);

        if (isCorrect) {
            this.crosswordGameState.score += 1;
            this.crosswordGameState.guess = expectedAnswer;
            this.crosswordGameState.status = 'صح! الإجابة صحيحة.';
            this.updateCrosswordHighScore(Math.round((this.crosswordGameState.score / Math.max(this.crosswordGameState.totalRounds || 1, 1)) * 100));
            this.renderCrosswordPuzzle();
            setTimeout(() => this.advanceCrosswordPuzzle(), 850);
            return;
        }

        this.crosswordGameState.status = 'الإجابة غير صحيحة. جرّب مرة أخرى.';
        this.renderCrosswordPuzzle();
    },

    revealCrosswordAnswer() {
        const entry = this.crosswordGameState.current;
        if (!entry) return;

        this.crosswordGameState.guess = normalizeCrosswordTerm(entry.answer);
        this.crosswordGameState.status = `الإجابة هي: ${entry.answer}`;
        this.renderCrosswordPuzzle();
        setTimeout(() => this.advanceCrosswordPuzzle(), 1200);
    }
};
