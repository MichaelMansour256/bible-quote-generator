import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { selectCrosswordEntries, normalizeCrosswordTerm, crosswordGameMixin } from '../js/features/games/crossword-game.js';

describe('crossword new-board flow', () => {
    test('exposes a new-board loader on the game mixin', () => {
        assert.equal(typeof crosswordGameMixin.startNewCrosswordBoard, 'function');
    });

    test('startNewCrosswordBoard flags a loading status and loads a fresh puzzle', async () => {
        let loaded = 0;
        const context = {
            crosswordGameState: { status: 'old status' },
            crosswordAdvanceTimer: 42,
            renderCrosswordPuzzle() {
                this.rendered = (this.rendered || 0) + 1;
            },
            loadCrosswordDictionaryEntries() {
                loaded += 1;
                return 'puzzle-loaded';
            }
        };

        const result = await crosswordGameMixin.startNewCrosswordBoard.call(context);

        assert.equal(result, 'puzzle-loaded');
        assert.equal(loaded, 1);
        assert.equal(context.crosswordGameState.status, 'جارٍ تجهيز لوحة جديدة...');
        assert.equal(context.rendered, 1);
    });
});

describe('crossword dictionary selection', () => {
    test('normalizes Arabic dictionary terms for game use', () => {
        assert.equal(normalizeCrosswordTerm('آبَلَ'), 'آبل');
        assert.equal(normalizeCrosswordTerm(' سِفرُ يُوشَعَ '), 'سفر يوشع');
    });

    test('normalizes underscore joined answers into spaced words', () => {
        assert.equal(normalizeCrosswordTerm('بيت_لحم'), 'بيت لحم');
        // ة folds to ه per the shared Arabic normalization rules.
        assert.equal(normalizeCrosswordTerm('خمسة_الاف'), 'خمسه الاف');
    });

    test('selects unique answer entries from a dictionary payload', () => {
        const dictionary = {
            'آبَلَ': { word: 'آبَلَ' },
            'آبَلِ بَيْتِ مَعْكَةَ': { word: 'آبَلِ بَيْتِ مَعْكَةَ' },
            'موسى': { word: 'موسى' },
            'موسى': { word: 'موسى' },
            '!!!': { word: '!!!' },
            'داود': { word: 'داود' },
            'القدس': { word: 'القدس' }
        };

        const entries = selectCrosswordEntries(dictionary, 4);
        assert.equal(entries.length, 4);
        assert.ok(entries.every(entry => entry.answer.length >= 3));
        assert.ok(entries.every(entry => !entry.answer.includes('!')));
        assert.ok(new Set(entries.map(entry => entry.answer)).size === entries.length);
    });

    test('builds a board with intersecting letters for a real crossword layout', () => {
        const entries = [
            { answer: 'موسى', clue: 'اسم نبي', direction: 'across', row: 2, col: 0 },
            { answer: 'سوى', clue: 'غير', direction: 'down', row: 1, col: 1 }
        ];

        const puzzle = crosswordGameMixin.buildCrosswordPuzzle(entries);
        assert.ok(puzzle.intersections && puzzle.intersections.length >= 1,
            'Expected at least one intersecting letter on the crossword board');
        assert.ok(puzzle.intersections.some(cell => cell.row === 2 && cell.col === 1),
            'Expected the down word to share a letter with the across word at the true intersection cell');
    });
});

describe('crossword Arabic puzzle set (bible_crossword_ar)', () => {
    const dataDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'js/data/bible-dictionary');
    const arSet = JSON.parse(readFileSync(path.join(dataDir, 'bible_crossword_ar.json'), 'utf8'));

    // Same mapping the game applies inside applyCrosswordPuzzle.
    const mapPuzzleWords = (puzzle) => {
        const seen = new Set();
        const entries = [];
        puzzle.words.forEach(word => {
            const answer = normalizeCrosswordTerm(word.answer);
            if (!answer || seen.has(answer)) return;
            seen.add(answer);
            entries.push({
                answer,
                clue: word.clue || word.answer,
                direction: word.direction === 'down' ? 'down' : 'across',
                row: Number.isInteger(word.row) ? word.row : 0,
                col: Number.isInteger(word.col) ? word.col : 0
            });
        });
        return entries;
    };

    test('exposes the Arabic set through the dictionary URL helper', () => {
        const url = crosswordGameMixin.getCrosswordDictionaryUrl('crossword');
        assert.ok(url.endsWith('bible_crossword_ar.json'), `unexpected crossword set url: ${url}`);
        assert.ok(url.includes('bible-dictionary'), `unexpected base directory: ${url}`);
    });

    test('ships clue-only puzzles for every supported difficulty level', () => {
        const levels = new Set(['easy', 'medium', 'hard']);
        const perLevel = new Map();
        assert.ok(arSet.puzzles.length >= 500, 'expected a large Arabic puzzle pool');
        for (const puzzle of arSet.puzzles) {
            assert.ok(levels.has(puzzle.difficulty), `${puzzle.title} has unknown difficulty "${puzzle.difficulty}"`);
            perLevel.set(puzzle.difficulty, (perLevel.get(puzzle.difficulty) || 0) + 1);
            assert.ok(Array.isArray(puzzle.words) && puzzle.words.length >= 3, `${puzzle.title} should have at least 3 words`);
            const answers = puzzle.words.map(w => normalizeCrosswordTerm(w.answer));
            assert.ok(new Set(answers).size === answers.length, `${puzzle.title} has duplicate answers`);
        }
        for (const level of levels) {
            assert.ok(perLevel.get(level) > 0, `no puzzles tagged "${level}" in the Arabic set`);
        }
    });

    test('auto-layout places every word of every puzzle on the generated board', () => {
        for (const puzzle of arSet.puzzles) {
            const entries = mapPuzzleWords(puzzle);
            const board = crosswordGameMixin.buildCrosswordPuzzle(entries);
            const size = board.board.length;
            for (const entry of board.entries) {
                assert.ok(Array.isArray(entry.cells) && entry.cells.length === entry.answer.length,
                    `${puzzle.title}: word "${entry.answer}" was not fully placed`);
                for (const cell of entry.cells) {
                    assert.ok(cell.row >= 0 && cell.col >= 0 && cell.row < size && cell.col < size,
                        `${puzzle.title}: cell of "${entry.answer}" is outside the board`);
                    assert.equal(board.board[cell.row][cell.col], cell.char,
                        `${puzzle.title}: board letter mismatch for "${entry.answer}"`);
                }
            }
        }
    });

    // Runs loadCrosswordDictionaryEntries against a stubbed fetch so the
    // difficulty filtering itself is exercised, not just the raw data.
    const loadWithStubbedFetch = async (difficulty) => {
        const applied = [];
        const context = {
            crosswordGameState: { difficulty },
            getCrosswordDictionaryUrl(type) {
                assert.equal(type, 'crossword', 'the game must request the crossword puzzle set');
                return path.join(dataDir, 'bible_crossword_ar.json');
            },
            applyCrosswordPuzzle(puzzle) {
                applied.push(puzzle);
                return puzzle.words;
            },
            loadCrosswordFromFallback() {
                applied.push(null);
                return [];
            }
        };
        const originalFetch = globalThis.fetch;
        globalThis.fetch = async () => ({ ok: true, json: async () => arSet });
        try {
            await crosswordGameMixin.loadCrosswordDictionaryEntries.call(context);
        } finally {
            globalThis.fetch = originalFetch;
        }
        return applied;
    };

    test('picks a puzzle matching the selected difficulty level', async () => {
        for (const difficulty of ['easy', 'medium', 'hard']) {
            const applied = await loadWithStubbedFetch(difficulty);
            assert.equal(applied.length, 1, `expected one applied puzzle for "${difficulty}"`);
            assert.equal(applied[0].difficulty, difficulty, `expected a "${difficulty}" puzzle`);
        }
    });

    test('maps the expert level onto the hardest available puzzles', async () => {
        const applied = await loadWithStubbedFetch('expert');
        assert.equal(applied.length, 1);
        assert.equal(applied[0].difficulty, 'hard', 'expert should fall back to the hard level');
    });
});
