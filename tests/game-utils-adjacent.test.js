import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { getAdjacentBibleVerse } from '../js/features/games/game-utils.js';

// Small Bible fixture that mirrors the raw API payload shape
// (books → chapters → array of { verse, text }).
function makeBibleData() {
    return {
        books: [
            {
                id: 'gen',
                name: 'تكوين',
                name_ar: 'تكوين',
                abbreviation: 'Gen',
                chapters: [
                    {
                        number: 1,
                        verses: [
                            { verse: 1, text: 'فِي الْبَدْءِ خَلَقَ اللهُ' },
                            { verse: 2, text: 'وَكَانَتِ الأَرْضُ خَرِبَةً' },
                            { verse: 3, text: 'وَقَالَ اللهُ لِيَكُنْ نُورٌ' }
                        ]
                    },
                    {
                        number: 2,
                        verses: [
                            { verse: 1, text: 'أُكْمِلَتِ السَّمَاوَاتُ' },
                            { verse: 2, text: 'وَاسْتَرَاحَ اللهُ' }
                        ]
                    }
                ]
            },
            {
                id: 'ex',
                name: 'خروج',
                name_ar: 'خروج',
                abbreviation: 'Ex',
                chapters: [
                    {
                        number: 1,
                        verses: [
                            { verse: 1, text: 'وَهَذِهِ أَسْمَاءُ بَنِي إِسْرَائِيلَ' },
                            { verse: 2, text: 'رَأُوبَيْنُ شِمْعُونُ' }
                        ]
                    }
                ]
            }
        ]
    };
}

const genVerse = (chapter, verse) => ({
    bookId: 'Gen',
    bookName: 'تكوين',
    chapter,
    verse
});

describe('getAdjacentBibleVerse — forward (+1)', () => {
    test('same chapter: returns the next verse', () => {
        const next = getAdjacentBibleVerse(makeBibleData(), genVerse(1, 1), 1);
        assert.ok(next);
        assert.equal(next.verse, 2);
        assert.equal(next.chapter, 1);
        assert.equal(next.bookId, 'Gen');
        assert.equal(next.text, 'وَكَانَتِ الأَرْضُ خَرِبَةً');
    });

    test('chapter end: jumps to the first verse of the next chapter', () => {
        const next = getAdjacentBibleVerse(makeBibleData(), genVerse(1, 3), 1);
        assert.ok(next);
        assert.equal(next.chapter, 2);
        assert.equal(next.verse, 1);
        assert.equal(next.reference, 'تكوين 2:1');
    });

    test('book end: jumps to the first verse of the next book', () => {
        const next = getAdjacentBibleVerse(makeBibleData(), genVerse(2, 2), 1);
        assert.ok(next);
        assert.equal(next.bookId, 'Ex');
        assert.equal(next.chapter, 1);
        assert.equal(next.verse, 1);
    });

    test('very last verse of the Bible: returns null', () => {
        const next = getAdjacentBibleVerse(
            makeBibleData(),
            { bookId: 'Ex', bookName: 'خروج', chapter: 1, verse: 2 },
            1
        );
        assert.equal(next, null);
    });
});

describe('getAdjacentBibleVerse — backward (-1)', () => {
    test('same chapter: returns the previous verse', () => {
        const prev = getAdjacentBibleVerse(makeBibleData(), genVerse(1, 2), -1);
        assert.ok(prev);
        assert.equal(prev.chapter, 1);
        assert.equal(prev.verse, 1);
    });

    test('chapter start: jumps to the last verse of the previous chapter', () => {
        const prev = getAdjacentBibleVerse(makeBibleData(), genVerse(2, 1), -1);
        assert.ok(prev);
        assert.equal(prev.chapter, 1);
        assert.equal(prev.verse, 3);
    });

    test('book start: jumps to the last verse of the previous book', () => {
        const prev = getAdjacentBibleVerse(makeBibleData(), { bookId: 'Ex', bookName: 'خروج', chapter: 1, verse: 1 }, -1);
        assert.ok(prev);
        assert.equal(prev.bookId, 'Gen');
        assert.equal(prev.chapter, 2);
        assert.equal(prev.verse, 2);
    });

    test('very first verse of the Bible: returns null', () => {
        const prev = getAdjacentBibleVerse(makeBibleData(), genVerse(1, 1), -1);
        assert.equal(prev, null);
    });
});