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

export function scoreCrosswordWordPair(first = '', second = '') {
    const a = normalizeCrosswordTerm(first);
    const b = normalizeCrosswordTerm(second);
    if (!a || !b) return 0;

    const letterMap = new Map();
    for (let i = 0; i < a.length; i += 1) {
        const letter = a[i];
        if (!letterMap.has(letter)) {
            letterMap.set(letter, []);
        }
        letterMap.get(letter).push(i);
    }

    let score = 0;
    const sharedLetters = new Set();

    for (let i = 0; i < b.length; i += 1) {
        const letter = b[i];
        if (!letterMap.has(letter)) continue;

        sharedLetters.add(letter);
        const closestIndex = letterMap.get(letter).reduce((best, index) => {
            const diff = Math.abs(index - i);
            return diff < best.diff ? { diff, index } : best;
        }, { diff: Number.POSITIVE_INFINITY, index: -1 });

        score += 18;
        score += Math.max(0, 8 - closestIndex.diff);
    }

    if (sharedLetters.size > 0) {
        score += sharedLetters.size * 4;
    }

    const lengthGap = Math.abs(a.length - b.length);
    score += Math.max(0, 10 - lengthGap * 2);
    score += Math.min(12, Math.max(0, 7 - Math.abs(a.length - 5) - Math.abs(b.length - 5)));
    return score;
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

    if (entries.length <= count) {
        return entries.slice(0, count);
    }

    const scored = entries.map(entry => {
        const pairScores = entries
            .filter(other => other.answer !== entry.answer)
            .map(other => scoreCrosswordWordPair(entry.answer, other.answer));
        return {
            entry,
            score: pairScores.reduce((sum, value) => sum + value, 0) + entry.answer.length * 2
        };
    });

    return scored
        .sort((a, b) => b.score - a.score)
        .map(({ entry }) => entry)
        .slice(0, count);
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

        const dictionaryWords = selectCrosswordEntries(payload, 16)
            .filter(entry => entry.answer.length >= 4 && entry.answer.length <= 8);

        if (dictionaryWords.length < 3) {
            return fallback;
        }

        const ordered = dictionaryWords
            .map(entry => ({
                ...entry,
                pairScore: dictionaryWords
                    .filter(other => other.answer !== entry.answer)
                    .reduce((sum, other) => sum + scoreCrosswordWordPair(entry.answer, other.answer), 0)
            }))
            .sort((a, b) => b.pairScore - a.pairScore)
            .map(({ answer, clue, category, pairScore }) => ({
                answer: normalizeCrosswordTerm(answer),
                clue: clue || 'كلمة من قاموس الكتاب المقدس.',
                direction: 'across',
                row: 0,
                col: 0,
                category: category || 'dictionary',
                candidateScore: pairScore
            }));

        return ordered.slice(0, 5);
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
            .filter(entry => entry.answer && entry.answer.length > 0)
            .sort((a, b) => b.answer.length - a.answer.length);

        const boardSize = Math.max(9, Math.min(15, Math.max(...normalizedEntries.map(entry => entry.answer.length + 4), 9)));
        const board = Array.from({ length: boardSize }, () => Array(boardSize).fill(null));
        const filled = new Map();
        const intersections = [];
        const placedEntries = [];
        const clueNumbers = new Map();
        let nextClueNumber = 1;

        const canPlace = (entry) => {
            const cells = [];
            let intersectionCount = 0;

            for (let charIndex = 0; charIndex < entry.answer.length; charIndex += 1) {
                const row = entry.direction === 'down' ? entry.row + charIndex : entry.row;
                const col = entry.direction === 'down' ? entry.col : entry.col + charIndex;

                if (row < 0 || col < 0 || row >= boardSize || col >= boardSize) {
                    return null;
                }

                const current = board[row][col];
                if (current && current !== entry.answer[charIndex]) {
                    return null;
                }
                if (current === entry.answer[charIndex]) {
                    intersectionCount += 1;
                }
                cells.push({ row, col, char: entry.answer[charIndex] });
            }

            return { cells, intersectionCount };
        };

        const placeWord = (entry) => {
            const placement = canPlace(entry);
            if (!placement) return false;

            const startCell = placement.cells[0];
            const startKey = `${startCell.row}:${startCell.col}`;
            if (!clueNumbers.has(startKey)) {
                clueNumbers.set(startKey, nextClueNumber);
                nextClueNumber += 1;
            }
            entry.number = clueNumbers.get(startKey);

            placement.cells.forEach(({ row, col, char }) => {
                if (!board[row][col]) {
                    board[row][col] = char;
                    filled.set(`${row}:${col}`, true);
                    return;
                }
                if (board[row][col] === char) {
                    intersections.push({ row, col, char, answer: entry.answer });
                }
            });

            entry.cells = placement.cells;
            placedEntries.push(entry);
            return true;
        };

        const findBestPlacement = (entry) => {
            let best = null;

            for (const existing of placedEntries) {
                for (let existingIndex = 0; existingIndex < existing.answer.length; existingIndex += 1) {
                    for (let currentIndex = 0; currentIndex < entry.answer.length; currentIndex += 1) {
                        if (existing.answer[existingIndex] !== entry.answer[currentIndex]) continue;

                        const coreScore = scoreCrosswordWordPair(existing.answer, entry.answer);
                        const downCandidate = {
                            ...entry,
                            direction: 'down',
                            row: existing.row - currentIndex,
                            col: existing.col + existingIndex
                        };
                        const acrossCandidate = {
                            ...entry,
                            direction: 'across',
                            row: existing.row + existingIndex,
                            col: existing.col - currentIndex
                        };

                        [downCandidate, acrossCandidate].forEach((candidate) => {
                            const placement = canPlace(candidate);
                            if (!placement) return;
                            const score = placement.intersectionCount * 25 + coreScore + 8;
                            if (!best || score > best.score) {
                                best = { candidate, score, placement };
                            }
                        });
                    }
                }
            }

            return best;
        };

        if (normalizedEntries.length) {
            const primary = {
                ...normalizedEntries[0],
                direction: normalizedEntries[0].direction === 'down' ? 'down' : 'across',
                row: (normalizedEntries[0].row !== 0 || normalizedEntries[0].col !== 0)
                    ? normalizedEntries[0].row
                    : Math.floor(boardSize / 2),
                col: (normalizedEntries[0].row !== 0 || normalizedEntries[0].col !== 0)
                    ? normalizedEntries[0].col
                    : Math.floor((boardSize - normalizedEntries[0].answer.length) / 2)
            };
            placeWord(primary);
        }

        for (let i = 1; i < normalizedEntries.length; i += 1) {
            const entry = { ...normalizedEntries[i], row: 0, col: 0, direction: normalizedEntries[i].direction === 'down' ? 'down' : 'across' };
            const bestPlacement = findBestPlacement(entry);

            if (bestPlacement) {
                const chosen = { ...entry, ...bestPlacement.candidate };
                if (placeWord(chosen)) continue;
            }

            let fallbackPlaced = false;
            const directions = ['across', 'down'];
            for (const direction of directions) {
                for (let row = 0; row < boardSize; row += 1) {
                    for (let col = 0; col < boardSize; col += 1) {
                        const candidate = { ...entry, direction, row, col };
                        if (placeWord(candidate)) {
                            fallbackPlaced = true;
                            break;
                        }
                    }
                    if (fallbackPlaced) break;
                }
                if (fallbackPlaced) break;
            }

            if (!fallbackPlaced && placedEntries.length) {
                const fallback = {
                    ...entry,
                    direction: placedEntries[0].direction || 'across',
                    row: placedEntries[0].row,
                    col: placedEntries[0].col + 1
                };
                placeWord(fallback);
            }
        }

        const dedupedIntersections = [...new Map(
            intersections.map(item => [`${item.row}:${item.col}`, item])
        ).values()];

        return { board, filled, intersections: dedupedIntersections, entries: normalizedEntries, clueNumbers: Array.from(clueNumbers.entries()) };
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
        const clueMap = new Map((puzzle.clueNumbers || []).map(([key, number]) => [key, number]));

        boardEl.innerHTML = '';
        boardEl.style.setProperty('--crossword-cols', String(puzzle.board.length));
        boardEl.style.gridTemplateColumns = `repeat(${puzzle.board.length}, minmax(0, 1fr))`;

        for (let row = 0; row < puzzle.board.length; row += 1) {
            for (let col = 0; col < puzzle.board[row].length; col += 1) {
                const cell = document.createElement('div');
                const value = puzzle.board[row][col];
                const filled = !!value;
                cell.className = 'crossword-cell';
                if (!filled) cell.classList.add('crossword-black');
                if (value) {
                    cell.textContent = value;
                }

                const clueNumber = clueMap.get(`${row}:${col}`);
                if (clueNumber) {
                    const num = document.createElement('span');
                    num.className = 'crossword-clue-number';
                    num.textContent = String(clueNumber);
                    cell.appendChild(num);
                }
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
