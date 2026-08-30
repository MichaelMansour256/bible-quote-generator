import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Load bible-api.js as a classic script (like <script> in browser)
const apiCode = fs.readFileSync(
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'js/services/bible-api.js'),
    'utf8'
);

globalThis.document = { querySelectorAll: () => [], querySelector: () => null, createElement: () => ({ remove: () => {}, style: {} }) };
globalThis.fetch = () => Promise.resolve({ ok: true, json: async () => ({}) });
// bible-api.js declares `const bibleAPI` at top level.  In a browser classic
// <script> that forms a *global lexical binding* (visible to later scripts, but
// not enumerable on `window`).  vm.runInThisContext behaves the same way, so
// append an explicit assignment to reach the instance via globalThis in Node.
vm.runInThisContext(`${apiCode}\n;\nglobalThis.bibleAPI = bibleAPI;`, { filename: 'bible-api.js' });

const bibleAPI = globalThis.bibleAPI;

const mockBibleData = {
    books: [
        { name: 'John', name_ar: 'يوحنا', abbreviation: 'john', chapters: [
            { chapter: 3, verses: [
                { verse: 16, text: 'كما أحب الله العالم...' },
                { verse: 17, text: 'لأنه لم يرسل الله ابنه...' },
            ]},
            { chapter: 11, verses: [ { verse: 25, text: 'كان يسوع يقول...' } ]},
        ]},
        { name: 'Psalms', name_ar: 'المزامير', abbreviation: 'psalms', chapters: [
            { chapter: 23, verses: [ { verse: 1, text: 'الرب راعي فلا يعوزني شيء...' } ]},
        ]},
        { name: '1 Samuel', name_ar: '1 صموئيل', abbreviation: '1-samuel', chapters: [
            { chapter: 17, verses: [ { verse: 45, text: 'يقول داود للفلسطيني...' } ]},
        ]},
    ],
};

describe('BibleAPI.getBookByName', () => {
    test('finds book by name_ar', () => {
        const book = bibleAPI.getBookByName(mockBibleData, 'يوحنا');
        assert.ok(book);
        assert.equal(book.name_ar, 'يوحنا');
    });

    test('finds book by English name', () => {
        const book = bibleAPI.getBookByName(mockBibleData, 'John');
        assert.ok(book);
        assert.equal(book.name, 'John');
    });

    test('finds book with diacritics normalized', () => {
        const book = bibleAPI.getBookByName(mockBibleData, 'المَزامير');
        assert.ok(book);
        assert.equal(book.name_ar, 'المزامير');
    });

    test('finds book with number prefix (1 صموئيل)', () => {
        const book = bibleAPI.getBookByName(mockBibleData, '1 صموئيل');
        assert.ok(book);
        assert.equal(book.abbreviation, '1-samuel');
    });

    test('returns null for unknown book', () => {
        assert.equal(bibleAPI.getBookByName(mockBibleData, 'Genesis'), null);
    });

    test('handles null/undefined bibleData', () => {
        assert.equal(bibleAPI.getBookByName(null, 'يوحنا'), null);
        assert.equal(bibleAPI.getBookByName(undefined, 'يوحنا'), null);
    });
});

describe('BibleAPI.getChaptersForBook', () => {
    test('returns chapters sorted by number', () => {
        const chapters = bibleAPI.getChaptersForBook(mockBibleData, 'يوحنا');
        assert.equal(chapters.length, 2);
        assert.equal(chapters[0].number, 3);
        assert.equal(chapters[1].number, 11);
    });

    test('returns empty array for unknown book', () => {
        assert.deepEqual(bibleAPI.getChaptersForBook(mockBibleData, 'Genesis'), []);
    });

    test('chapter data includes verses keyed by verse number', () => {
        const chapters = bibleAPI.getChaptersForBook(mockBibleData, 'يوحنا');
        const ch3 = chapters.find(c => c.number === 3);
        assert.ok(ch3);
        assert.ok('16' in ch3.verses);
        assert.ok('17' in ch3.verses);
    });

    test('returns empty array for null bibleData', () => {
        assert.deepEqual(bibleAPI.getChaptersForBook(null, 'يوحنا'), []);
    });
});

describe('BibleAPI.getVerse', () => {
    test('retrieves specific verse text', () => {
        assert.equal(bibleAPI.getVerse(mockBibleData, 'يوحنا', 3, 16), 'كما أحب الله العالم...');
    });

    test('returns null for non-existent verse', () => {
        assert.equal(bibleAPI.getVerse(mockBibleData, 'يوحنا', 3, 999), null);
    });

    test('returns null for non-existent chapter', () => {
        assert.equal(bibleAPI.getVerse(mockBibleData, 'يوحنا', 99, 1), null);
    });

    test('returns null for unknown book', () => {
        assert.equal(bibleAPI.getVerse(mockBibleData, 'Genesis', 1, 1), null);
    });

    test('returns null for null bibleData', () => {
        assert.equal(bibleAPI.getVerse(null, 'يوحنا', 3, 16), null);
    });

    test('handles string chapter/verse arguments', () => {
        assert.equal(bibleAPI.getVerse(mockBibleData, 'يوحنا', '3', '16'), 'كما أحب الله العالم...');
    });
});

describe('BibleAPI.validateReference', () => {
    test('returns true for an existing verse', () => {
        assert.equal(bibleAPI.validateReference(mockBibleData, 'يوحنا', 3, 16), true);
    });

    test('returns false for a non-existent verse', () => {
        assert.equal(bibleAPI.validateReference(mockBibleData, 'يوحنا', 3, 999), false);
    });

    test('returns false for a non-existent chapter', () => {
        assert.equal(bibleAPI.validateReference(mockBibleData, 'يوحنا', 99, 1), false);
    });

    test('returns false for an unknown book', () => {
        assert.equal(bibleAPI.validateReference(mockBibleData, 'Genesis', 1, 1), false);
    });

    test('returns false for null bibleData', () => {
        assert.equal(bibleAPI.validateReference(null, 'يوحنا', 3, 16), false);
    });
});

describe('BibleAPI.getPopularVerses', () => {
    test('returns verse objects with text and reference for matched books', () => {
        const verses = bibleAPI.getPopularVerses(mockBibleData);
        const john = verses.find(v => v.reference === 'يوحنا 3:16');
        assert.ok(john, 'يوحنا 3:16 exists in the mock data and should be returned');
        assert.equal(john.text, 'كما أحب الله العالم...');
    });

    test('skips references missing from the data set', () => {
        const verses = bibleAPI.getPopularVerses(mockBibleData);
        assert.ok(Array.isArray(verses));
        assert.ok(!verses.some(v => v.reference === 'ناحوم 1:7'), 'ناحوم is not in the mock data');
    });

    test('returns empty array for null bibleData', () => {
        assert.deepEqual(bibleAPI.getPopularVerses(null), []);
    });
});

describe('BibleAPI.loadBibleData', () => {
    test('fetches data on the first call and serves it from cache afterwards', async () => {
        bibleAPI.cache.clear(); // isolate from any earlier calls on the shared instance
        const expected = { books: [] };
        let fetchCalls = 0;
        const originalFetch = globalThis.fetch;
        globalThis.fetch = () => {
            fetchCalls += 1;
            return Promise.resolve({ ok: true, json: async () => expected });
        };

        try {
            const first = await bibleAPI.loadBibleData();
            const second = await bibleAPI.loadBibleData();
            assert.equal(first, expected);
            assert.equal(second, expected);
            assert.equal(fetchCalls, 1, 'fetch should only run once (subsequent calls hit the cache)');
        } finally {
            globalThis.fetch = originalFetch;
        }
    });

    test('returns null when the fetch fails', async () => {
        bibleAPI.cache.clear(); // otherwise the previously cached payload would be served instead
        const originalFetch = globalThis.fetch;
        globalThis.fetch = () => Promise.reject(new Error('network down'));

        try {
            const result = await bibleAPI.loadBibleData();
            assert.equal(result, null);
        } finally {
            globalThis.fetch = originalFetch;
        }
    });
});
