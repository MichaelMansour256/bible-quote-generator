import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

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
