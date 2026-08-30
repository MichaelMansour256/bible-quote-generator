import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const apiCode = fs.readFileSync(
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'js/core/bible-api.js'),
    'utf8'
);

globalThis.document = { querySelectorAll: () => [], querySelector: () => null };
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
    ],
};

describe('BibleAPI.normalizeSearchText', () => {
    test('normalizes Arabic text for search', () => {
        assert.equal(
            bibleAPI.normalizeSearchText('يُوحَنَّا'),
            bibleAPI.normalizeSearchText('يوحنا')
        );
    });

    test('converts Arabic digits to ASCII', () => {
        assert.equal(bibleAPI.normalizeSearchText('يوحنا ٣:١٦'), bibleAPI.normalizeSearchText('يوحنا 3:16'));
    });

    test('removes punctuation', () => {
        assert.equal(bibleAPI.normalizeSearchText('يوحنا، 3:16'), bibleAPI.normalizeSearchText('يوحنا 3:16'));
    });
});

describe('BibleAPI.parseExactReference', () => {
    test('parses book chapter:verse format', () => {
        assert.deepEqual(bibleAPI.parseExactReference('يوحنا 3:16'), { bookName: 'يوحنا', chapter: 3, verse: 16 });
    });

    test('parses book chapter-verse format', () => {
        assert.deepEqual(bibleAPI.parseExactReference('يوحنا 3-16'), { bookName: 'يوحنا', chapter: 3, verse: 16 });
    });

    test('returns null for plain book name', () => {
        assert.equal(bibleAPI.parseExactReference('يوحنا'), null);
    });

    test('normalizes digits before parsing', () => {
        assert.deepEqual(bibleAPI.parseExactReference('يوحنا ٣:١٦'), { bookName: 'يوحنا', chapter: 3, verse: 16 });
    });
});

describe('BibleAPI.parseChapterQuery', () => {
    test('parses book + chapter prefix', () => {
        assert.deepEqual(bibleAPI.parseChapterQuery('يوحنا 3'), { bookName: 'يوحنا', chapterPrefix: '3' });
    });

    test('returns null for full verse reference', () => {
        assert.equal(bibleAPI.parseChapterQuery('يوحنا 3:16'), null);
    });

    test('returns null for plain text', () => {
        assert.equal(bibleAPI.parseChapterQuery('الله'), null);
    });
});

describe('BibleAPI.searchVerses', () => {
    test('exact verse reference: book chapter:verse', () => {
        const results = bibleAPI.searchVerses(mockBibleData, 'يوحنا 3:16');
        assert.equal(results.length, 1);
        assert.equal(results[0].text, 'كما أحب الله العالم...');
        assert.equal(results[0].book_ar, 'يوحنا');
    });

    test('exact verse reference with Arabic digits', () => {
        const results = bibleAPI.searchVerses(mockBibleData, 'يوحنا ٣:١٦');
        assert.equal(results.length, 1);
    });

    test('book+chapter prefix returns chapter results', () => {
        const results = bibleAPI.searchVerses(mockBibleData, 'يوحنا 3');
        assert.equal(results.length, 1);
        assert.equal(results[0].chapter, 3);
        assert.equal(results[0].isChapterResult, true);
    });

    test('book name only returns all chapters', () => {
        const results = bibleAPI.searchVerses(mockBibleData, 'يوحنا');
        assert.equal(results.length, 2);
        assert.ok(results.every(r => r.isChapterResult));
    });

    test('full-text search across verses', () => {
        const results = bibleAPI.searchVerses(mockBibleData, 'الرب راعي');
        assert.ok(results.length > 0);
        assert.ok(results.some(r => r.text.includes('الرب راعي')));
    });

    test('returns empty array for empty query', () => {
        assert.deepEqual(bibleAPI.searchVerses(mockBibleData, ''), []);
    });

    test('returns empty array for null bibleData', () => {
        assert.deepEqual(bibleAPI.searchVerses(null, 'يوحنا'), []);
    });
});

describe('BibleAPI.getAllBooks', () => {
    test('returns book list with id, name, chapter count', () => {
        const books = bibleAPI.getAllBooks(mockBibleData);
        assert.equal(books.length, 2);
        const john = books.find(b => b.id === 'john');
        assert.ok(john);
        assert.equal(john.name, 'يوحنا');
        assert.equal(john.chapters, 2);
    });
});

describe('BibleAPI formatArabicNumber / formatArabicReference', () => {
    test('converts digits correctly', () => {
        assert.equal(bibleAPI.formatArabicNumber(0), '٠');
        assert.equal(bibleAPI.formatArabicNumber(7), '٧');
        assert.equal(bibleAPI.formatArabicNumber(16), '١٦');
    });

    test('formats reference with Arabic numbers', () => {
        assert.equal(bibleAPI.formatArabicReference('يوحنا', 3, 16), 'يوحنا ٣: ١٦');
    });
});
