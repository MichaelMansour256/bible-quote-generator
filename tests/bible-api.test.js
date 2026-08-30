import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Load bible-api.js as a classic script (like <script> in browser)
const apiCode = fs.readFileSync(
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'js/core/bible-api.js'),
    'utf8'
);

globalThis.document = { querySelectorAll: () => [], querySelector: () => null };
globalThis.fetch = () => Promise.resolve({ ok: true, json: async () => ({}) });
vm.runInThisContext(apiCode, { filename: 'bible-api.js' });

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
