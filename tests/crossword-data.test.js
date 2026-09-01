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

describe('crossword easy simple-clue set', () => {
    const easySet = JSON.parse(readFileSync(
        path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'js/data/bible-dictionary/crosswords_easy.json'),
        'utf8'
    ));

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

    test('exposes the easy set through the dictionary URL helper', () => {
        const url = crosswordGameMixin.getCrosswordDictionaryUrl('crossword-easy');
        assert.ok(url.endsWith('crosswords_easy.json'), `unexpected easy set url: ${url}`);
        assert.ok(url.includes('bible-dictionary'), `unexpected base directory: ${url}`);
    });

    test('easy set ships simple clue-only puzzles with unique answers', () => {
        assert.ok(easySet.puzzles.length >= 100, 'expected at least 100 easy puzzles');
        for (const puzzle of easySet.puzzles) {
            assert.equal(puzzle.difficulty, 'easy', `${puzzle.title} should be easy`);
            assert.ok(puzzle.words.length >= 3, `${puzzle.title} should have at least 3 words`);
            const answers = puzzle.words.map(w => normalizeCrosswordTerm(w.answer));
            assert.ok(new Set(answers).size === answers.length, `${puzzle.title} has duplicate answers`);
        }
    });

    test('auto-layout places every easy word on the generated board', () => {
        for (const puzzle of easySet.puzzles) {
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
});
