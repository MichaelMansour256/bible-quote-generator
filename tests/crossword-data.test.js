import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { selectCrosswordEntries, normalizeCrosswordTerm, crosswordGameMixin } from '../js/features/games/crossword-game.js';

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
            { answer: 'سوى', clue: 'غير', direction: 'down', row: 0, col: 1 }
        ];

        const puzzle = crosswordGameMixin.buildCrosswordPuzzle(entries);
        assert.ok(puzzle.intersections && puzzle.intersections.length >= 1,
            'Expected at least one intersecting letter on the crossword board');
        assert.ok(puzzle.intersections.some(cell => cell.row === 2 && cell.col === 1),
            'Expected the second word to intersect the first at a shared letter');
    });
});
