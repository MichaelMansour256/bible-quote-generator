import { normalizeArabicForMatch } from './game-utils.js';

export function normalizeCrosswordTerm(text = '') {
    return String(text || '')
        .replace(/[أإ]/g, 'ا')
        .normalize('NFKD')
        .replace(/ا\u0653/g, 'آ')
        .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
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

export async function loadCrosswordPuzzleDatabase(url = '../js/data/bible-dictionary/bible_crossword_1000.json') {
    if (typeof fetch !== 'function') {
        return null;
    }

    try {
        const response = await fetch(url, { cache: 'force-cache' });
        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        console.warn('Failed to load crossword puzzle database', error);
        return null;
    }
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
    async loadCrosswordDictionaryEntries() {
        const puzzleDataUrl = this.getCrosswordDictionaryUrl ? this.getCrosswordDictionaryUrl('crossword') : '../js/data/bible-dictionary/bible_crossword_1000.json';
        const database = await loadCrosswordPuzzleDatabase(puzzleDataUrl);

        if (!database || !database.puzzles || !database.puzzles.length) {
            console.warn('No prebuilt crossword puzzles available, using fallback');
            return this.loadCrosswordFromFallback();
        }

        const difficulty = this.crosswordGameState.difficulty || 'medium';
        const puzzlesByDifficulty = database.puzzles.filter(p => p.difficulty === difficulty);
        const selectedPuzzle = puzzlesByDifficulty.length > 0
            ? puzzlesByDifficulty[Math.floor(Math.random() * puzzlesByDifficulty.length)]
            : database.puzzles[Math.floor(Math.random() * database.puzzles.length)];

        if (!selectedPuzzle || !selectedPuzzle.words) {
            console.warn('Selected puzzle is invalid, using fallback');
            return this.loadCrosswordFromFallback();
        }

        const entries = selectedPuzzle.words.map(word => ({
            number: word.number,
            answer: normalizeCrosswordTerm(word.answer),
            clue: word.clue || word.display || word.answer,
            direction: word.direction === 'down' ? 'down' : 'across',
            row: Number.isInteger(word.row) ? word.row : 0,
            col: Number.isInteger(word.col) ? word.col : 0,
            source_id: word.source_id,
            display: word.display,
            category: 'dictionary'
        }));

        const puzzle = this.buildCrosswordPuzzle(entries);
        clearTimeout(this.crosswordAdvanceTimer);
        this.crosswordGameState.puzzle = puzzle;
        this.crosswordGameState.entries = (puzzle.entries && puzzle.entries.length) ? puzzle.entries : entries;
        this.crosswordGameState.currentIndex = 0;
        this.crosswordGameState.current = this.crosswordGameState.entries[0];
        this.crosswordGameState.guess = '';
        this.crosswordGameState.status = '';
        this.crosswordGameState.selectedCell = null;
        this.crosswordGameState.crosswordSolved = new Map();
        this.crosswordGameState.score = 0;
        this.crosswordGameState.totalRounds = Math.max(1, this.crosswordGameState.entries.length);
        this.crosswordGameState.puzzleTitle = selectedPuzzle.title;
        this.renderCrosswordPuzzle();

        return entries;
    },

    async loadCrosswordFromFallback() {
        const fallback = CROSSWORD_LAYOUT.map(item => ({
            answer: item.answer,
            clue: item.clue,
            direction: item.direction,
            row: item.row,
            col: item.col,
            category: 'dictionary'
        }));

        const puzzle = this.buildCrosswordPuzzle(fallback);
        clearTimeout(this.crosswordAdvanceTimer);
        this.crosswordGameState.puzzle = puzzle;
        this.crosswordGameState.entries = (puzzle.entries && puzzle.entries.length) ? puzzle.entries : fallback;
        this.crosswordGameState.currentIndex = 0;
        this.crosswordGameState.current = this.crosswordGameState.entries[0];
        this.crosswordGameState.guess = '';
        this.crosswordGameState.status = '';
        this.crosswordGameState.selectedCell = null;
        this.crosswordGameState.crosswordSolved = new Map();
        this.crosswordGameState.score = 0;
        this.crosswordGameState.totalRounds = Math.max(1, this.crosswordGameState.entries.length);
        this.renderCrosswordPuzzle();
        return fallback;
    },

    // Loads a completely fresh board (a new random puzzle for the current
    // difficulty) instead of just hopping to another clue on the same board.
    startNewCrosswordBoard() {
        clearTimeout(this.crosswordAdvanceTimer);
        if (this.crosswordGameState) {
            this.crosswordGameState.status = 'جارٍ تجهيز لوحة جديدة...';
            this.renderCrosswordPuzzle();
        }
        return this.loadCrosswordDictionaryEntries();
    },

    getCrosswordEntriesFromSource(payload = []) {
        const fallback = CROSSWORD_LAYOUT.map(item => ({
            answer: item.answer,
            clue: item.clue,
            direction: item.direction,
            row: item.row,
            col: item.col,
            category: 'dictionary'
        }));

        const dictionaryWords = selectCrosswordEntries(payload, 12)
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

    getCrosswordDictionaryUrl(type = 'dictionary') {
        const path = window.location.pathname || '';
        const baseUrl = path.includes('/pages/') ? '../js/data/bible-dictionary/' : 'js/data/bible-dictionary/';
        return type === 'crossword' ? `${baseUrl}bible_crossword_1000.json` : `${baseUrl}bible_dictionary_game.json`;
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
        const solutionMap = new Map();
        const placedEntries = [];
        const clueNumbers = new Map();
        const intersections = [];
        let nextClueNumber = 1;

        const placeWord = (entry, sourceEntry = null) => {
            const cells = [];
            const foundIntersections = [];

            for (let charIndex = 0; charIndex < entry.answer.length; charIndex += 1) {
                const row = entry.direction === 'down' ? entry.row + charIndex : entry.row;
                const col = entry.direction === 'down' ? entry.col : entry.col + charIndex;

                if (row < 0 || col < 0 || row >= boardSize || col >= boardSize) {
                    return false;
                }

                const current = board[row][col];
                if (current !== null && current !== entry.answer[charIndex]) {
                    return false;
                }

                if (current === entry.answer[charIndex]) {
                    foundIntersections.push({ row, col, char: entry.answer[charIndex], answer: entry.answer });
                }

                cells.push({ row, col, char: entry.answer[charIndex] });
            }

            const startCell = cells[0];
            const startKey = `${startCell.row}:${startCell.col}`;
            if (!clueNumbers.has(startKey)) {
                clueNumbers.set(startKey, nextClueNumber);
                nextClueNumber += 1;
            }
            entry.number = clueNumbers.get(startKey);

            cells.forEach(({ row, col, char }) => {
                board[row][col] = board[row][col] || char;
                solutionMap.set(`${row}:${col}`, char);
            });

            foundIntersections.forEach(item => intersections.push(item));
            entry.cells = cells;
            if (sourceEntry) {
                sourceEntry.cells = cells;
                sourceEntry.number = entry.number;
            }
            placedEntries.push(entry);
            return true;
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
            placeWord(primary, normalizedEntries[0]);
        }

        for (let i = 1; i < normalizedEntries.length; i += 1) {
            const entry = {
                ...normalizedEntries[i],
                row: Number.isInteger(normalizedEntries[i].row) ? normalizedEntries[i].row : 0,
                col: Number.isInteger(normalizedEntries[i].col) ? normalizedEntries[i].col : 0,
                direction: normalizedEntries[i].direction === 'down' ? 'down' : 'across'
            };
            let placed = false;
            let bestCandidate = null;

            for (const existing of placedEntries) {
                for (let existingIndex = 0; existingIndex < existing.answer.length; existingIndex += 1) {
                    for (let currentIndex = 0; currentIndex < entry.answer.length; currentIndex += 1) {
                        if (existing.answer[existingIndex] !== entry.answer[currentIndex]) continue;

                        const acrossCandidate = {
                            ...entry,
                            direction: 'across',
                            row: existing.row + existingIndex,
                            col: existing.col - currentIndex
                        };
                        const downCandidate = {
                            ...entry,
                            direction: 'down',
                            row: existing.row - currentIndex,
                            col: existing.col + existingIndex
                        };

                        [acrossCandidate, downCandidate].forEach(candidate => {
                            const cells = [];
                            let overlapCount = 0;
                            let valid = true;

                            for (let charIndex = 0; charIndex < candidate.answer.length; charIndex += 1) {
                                const row = candidate.direction === 'down' ? candidate.row + charIndex : candidate.row;
                                const col = candidate.direction === 'down' ? candidate.col : candidate.col + charIndex;
                                if (row < 0 || col < 0 || row >= boardSize || col >= boardSize) {
                                    valid = false;
                                    break;
                                }
                                const current = board[row][col];
                                if (current !== null && current !== candidate.answer[charIndex]) {
                                    valid = false;
                                    break;
                                }
                                if (current === candidate.answer[charIndex]) {
                                    overlapCount += 1;
                                }
                                cells.push({ row, col, char: candidate.answer[charIndex] });
                            }

                            if (valid && (overlapCount > 0 || !bestCandidate)) {
                                const score = overlapCount * 100 + candidate.answer.length;
                                if (!bestCandidate || score > bestCandidate.score) {
                                    bestCandidate = { candidate, score, overlapCount };
                                }
                            }
                        });
                    }
                }
            }

            if (bestCandidate) {
                placed = placeWord(bestCandidate.candidate, normalizedEntries[i]);
            }

            if (!placed) {
                const fallbackDirections = ['across', 'down'];
                for (const direction of fallbackDirections) {
                    for (let row = 0; row < boardSize; row += 1) {
                        for (let col = 0; col < boardSize; col += 1) {
                            const candidate = { ...entry, direction, row, col };
                            if (placeWord(candidate, normalizedEntries[i])) {
                                placed = true;
                                break;
                            }
                        }
                        if (placed) break;
                    }
                    if (placed) break;
                }
            }
        }

        const dedupedIntersections = [...new Map(
            intersections.map(item => [`${item.row}:${item.col}:${item.char}`, item])
        ).values()];

        return {
            board,
            solutionMap,
            filled: solutionMap,
            intersections: dedupedIntersections,
            entries: normalizedEntries,
            clueNumbers: Array.from(clueNumbers.entries())
        };
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
        const guess = (this.crosswordGameState.guess || '').slice(0, active ? active.answer.length : 0);
        const selectedCell = this.crosswordGameState.selectedCell || null;
        const solvedMap = this.crosswordGameState.crosswordSolved || new Map();

        boardEl.innerHTML = '';
        this.crosswordCellElements = new Map();
        boardEl.style.setProperty('--crossword-cols', String(puzzle.board.length));
        boardEl.style.gridTemplateColumns = `repeat(${puzzle.board.length}, minmax(0, 1fr))`;

        for (let row = 0; row < puzzle.board.length; row += 1) {
            for (let col = 0; col < puzzle.board[row].length; col += 1) {
                const cell = document.createElement('div');
                const isBlocked = puzzle.board[row][col] === null || puzzle.board[row][col] === undefined;
                cell.className = 'crossword-cell';

                if (isBlocked) {
                    cell.classList.add('crossword-black');
                } else {
                    cell.classList.add('crossword-empty');
                    const cellKey = `${row}:${col}`;
                    const solvedLetter = solvedMap.get(cellKey) || '';
                    const activeCellIndex = (active && active.cells) ? active.cells.findIndex(item => item.row === row && item.col === col) : -1;
                    const userLetter = solvedLetter || (activeCellIndex >= 0 ? guess[activeCellIndex] || '' : '');

                    if (solvedLetter) {
                        cell.textContent = solvedLetter;
                        cell.classList.remove('crossword-empty');
                        cell.classList.add('crossword-filled', 'crossword-solved');
                    } else if (userLetter) {
                        cell.textContent = userLetter;
                        cell.classList.remove('crossword-empty');
                        cell.classList.add('crossword-filled');
                    }

                    if (selectedCell && selectedCell.row === row && selectedCell.col === col) {
                        cell.classList.add('crossword-selected');
                    }

                    if (active && active.cells && active.cells.some(item => item.row === row && item.col === col)) {
                        cell.classList.add('crossword-in-word');
                    }

                    const clueNumber = clueMap.get(cellKey);
                    if (clueNumber) {
                        const num = document.createElement('span');
                        num.className = 'crossword-clue-number';
                        num.textContent = String(clueNumber);
                        cell.appendChild(num);
                    }

                    cell.addEventListener('click', () => {
                        const targetEntry = (this.crosswordGameState.entries || []).find(entry => {
                            if (!entry.cells) return false;
                            return entry.cells.some(item => item.row === row && item.col === col);
                        }) || active;

                        if (!targetEntry) return;

                        this.crosswordGameState.current = targetEntry;
                        this.crosswordGameState.currentIndex = (this.crosswordGameState.entries || []).indexOf(targetEntry);
                        this.crosswordGameState.selectedCell = { row, col };
                        this.renderCrosswordPuzzle();
                    });
                }

                this.crosswordCellElements.set(`${row}:${col}`, cell);
                boardEl.appendChild(cell);
            }
        }

        if (clueEl && active) clueEl.textContent = active.clue || 'اكتب الاسم الصحيح.';
        if (clueListEl) {
            clueListEl.innerHTML = '';
            const acrossEntries = (this.crosswordGameState.entries || []).filter(entry => entry.direction === 'across');
            const downEntries = (this.crosswordGameState.entries || []).filter(entry => entry.direction === 'down');

            const renderSection = (title, entries) => {
                if (!entries.length) return;
                const section = document.createElement('div');
                section.className = 'crossword-clue-section';
                const heading = document.createElement('h3');
                heading.textContent = title;
                section.appendChild(heading);

                const list = document.createElement('ul');
                entries.forEach((entry, index) => {
                    const item = document.createElement('li');
                    const actualIndex = (this.crosswordGameState.entries || []).indexOf(entry);
                    if (this.crosswordGameState.currentIndex === actualIndex) item.classList.add('active');
                    item.textContent = `${entry.number || actualIndex + 1}. ${entry.clue}`;
                    item.addEventListener('click', () => {
                        this.crosswordGameState.currentIndex = actualIndex;
                        this.crosswordGameState.current = entry;
                        this.crosswordGameState.selectedCell = entry.cells ? entry.cells[0] : null;
                        this.renderCrosswordPuzzle();
                    });
                    list.appendChild(item);
                });
                section.appendChild(list);
                clueListEl.appendChild(section);
            };

            renderSection('Across', acrossEntries);
            renderSection('Down', downEntries);
        }

        if (answerInput) {
            answerInput.value = this.crosswordGameState.guess || '';
            answerInput.placeholder = active ? `اكتب الإجابة: ${active.answer.length} أحرف` : 'اكتب الإجابة';
        }

        if (score) {
            const total = Math.max(this.crosswordGameState.totalRounds || 1, 1);
            score.textContent = `${Math.max(0, Math.min(100, Math.round((this.crosswordGameState.score / total) * 100)))}%`;
        }
        if (highScore) {
            const stored = parseInt(localStorage.getItem(this.crosswordHighScoreKey) || '0', 10) || 0;
            highScore.textContent = `${stored}%`;
        }
        if (status) {
            status.textContent = this.crosswordGameState.status || 'اكتب كلمة، ثم اضغط تحقق أو Enter. الكلمات تتقاطع مع بعضها في الخلية الوسطية.';
        }
    },

    updateCrosswordTypedLetters() {
        const puzzle = this.crosswordGameState.puzzle;
        if (!puzzle || !this.crosswordCellElements) return;
        const entries = this.crosswordGameState.entries || [];
        const active = this.crosswordGameState.current || entries[0];
        if (!active || !active.cells) return;
        const guess = (this.crosswordGameState.guess || '').slice(0, active.answer.length);
        const solvedMap = this.crosswordGameState.crosswordSolved || new Map();
        active.cells.forEach((cell, index) => {
            const el = this.crosswordCellElements.get(`${cell.row}:${cell.col}`);
            if (!el) return;
            // Solved letters (from a correct check or reveal) stay on the board.
            if (solvedMap.has(`${cell.row}:${cell.col}`)) return;
            const letter = guess[index] || '';
            el.textContent = letter;
            el.classList.toggle('crossword-filled', Boolean(letter));
            el.classList.toggle('crossword-empty', !letter);
        });
    },

    updateCrosswordHighScore(score) {
        const best = parseInt(localStorage.getItem(this.crosswordHighScoreKey) || '0', 10) || 0;
        if (score > best) {
            localStorage.setItem(this.crosswordHighScoreKey, String(score));
            const highScore = document.getElementById('crossword-game-high-score');
            if (highScore) highScore.textContent = `${Math.min(100, score)}%`;
        }
    },

    advanceCrosswordPuzzle() {
        if (!this.crosswordGameState.entries || !this.crosswordGameState.entries.length) return;
        clearTimeout(this.crosswordAdvanceTimer);

        const nextIndex = (this.crosswordGameState.currentIndex + 1) % this.crosswordGameState.entries.length;
        this.crosswordGameState.currentIndex = nextIndex;
        this.crosswordGameState.current = this.crosswordGameState.entries[nextIndex];
        this.crosswordGameState.guess = '';
        this.crosswordGameState.status = '';
        this.crosswordGameState.selectedCell = null;
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
            // Lock the correct letters onto the board so they survive word changes.
            const solvedMap = this.crosswordGameState.crosswordSolved || new Map();
            if (entry.cells) {
                entry.cells.forEach((cell, index) => {
                    solvedMap.set(`${cell.row}:${cell.col}`, expectedAnswer[index] || '');
                });
            }
            this.crosswordGameState.crosswordSolved = solvedMap;
            this.crosswordGameState.score += 1;
            this.crosswordGameState.guess = expectedAnswer;
            this.crosswordGameState.status = 'صح! الإجابة صحيحة.';
            this.updateCrosswordHighScore(Math.round((this.crosswordGameState.score / Math.max(this.crosswordGameState.totalRounds || 1, 1)) * 100));
            this.renderCrosswordPuzzle();
            clearTimeout(this.crosswordAdvanceTimer);
            this.crosswordAdvanceTimer = setTimeout(() => this.advanceCrosswordPuzzle(), 850);
            return;
        }

        this.crosswordGameState.status = 'الإجابة غير صحيحة. جرّب مرة أخرى.';
        this.renderCrosswordPuzzle();
    },

    revealCrosswordAnswer() {
        const entry = this.crosswordGameState.current;
        if (!entry) return;

        // Revealed answers also stay locked on the board.
        const solvedMap = this.crosswordGameState.crosswordSolved || new Map();
        if (entry.cells) {
            entry.cells.forEach((cell, index) => {
                solvedMap.set(`${cell.row}:${cell.col}`, entry.answer[index] || '');
            });
        }
        this.crosswordGameState.crosswordSolved = solvedMap;
        this.crosswordGameState.guess = normalizeCrosswordTerm(entry.answer);
        this.crosswordGameState.status = `الإجابة هي: ${entry.answer}`;
        this.renderCrosswordPuzzle();
        clearTimeout(this.crosswordAdvanceTimer);
        this.crosswordAdvanceTimer = setTimeout(() => this.advanceCrosswordPuzzle(), 1200);
    }
};
