import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
    createBibleTermPools,
    buildTermPool,
    buildWordleWordPool,
    getWordleLetterCount,
    getWordleDisplayLetters,
    normalizeArabicForMatch,
} from '../js/features/games/game-utils.js';

// Set up global bibleDatabase like the browser does via <script> tag
const dbCode = readFileSync(
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'js/core/bible-database.js'),
    'utf8'
);
const fn = new Function(dbCode.replace(/const bibleDatabase/, 'globalThis.bibleDatabase'));
fn();

const pools = createBibleTermPools();

describe('createBibleTermPools', () => {
    test('returns object with all expected pool keys', () => {
        assert.ok(pools.books && Array.isArray(pools.books));
        assert.ok(pools.names && Array.isArray(pools.names));
        assert.ok(pools.places && Array.isArray(pools.places));
        assert.ok(pools.prophets && Array.isArray(pools.prophets));
        assert.ok(pools.kings && Array.isArray(pools.kings));
        assert.ok(pools.women && Array.isArray(pools.women));
        assert.ok(pools.tribes && Array.isArray(pools.tribes));
        assert.ok(pools.feasts && Array.isArray(pools.feasts));
        assert.ok(pools.artifacts && Array.isArray(pools.artifacts));
    });

    test('book names match bibleDatabase (66 books)', () => {
        assert.equal(pools.books.length, 66);
        assert.ok(pools.books.some(b => b.term === 'تكوين'));
        assert.ok(pools.books.some(b => b.term === 'المزامير'));
    });

    test('each pool entry has term, aliases, and difficulty', () => {
        pools.names.slice(0, 5).forEach(entry => {
            assert.ok('term' in entry);
            assert.ok(Array.isArray(entry.aliases));
            assert.ok('difficulty' in entry);
        });
    });
});

describe('buildTermPool', () => {
    test('random category includes entries from all pools', () => {
        const result = buildTermPool(pools, 'random', 'medium');
        const categories = new Set(result.map(e => e.category));
        assert.ok(categories.size > 1);
    });

    test('book category only includes book entries', () => {
        const result = buildTermPool(pools, 'book', 'medium');
        const categories = new Set(result.map(e => e.category));
        assert.deepEqual([...categories], ['اسم سفر']);
    });

    test('name category only includes name entries', () => {
        const result = buildTermPool(pools, 'name', 'medium');
        assert.deepEqual([...new Set(result.map(e => e.category))], ['اسم']);
    });

    test('entry has answers array computed from term + aliases', () => {
        const result = buildTermPool(pools, 'name', 'easy');
        const ibrahim = result.find(e => e.term === 'إبراهيم');
        assert.ok(ibrahim);
        assert.ok(ibrahim.answers && ibrahim.answers.length > 0);
        assert.ok(ibrahim.answers.some(a => a === normalizeArabicForMatch('إبراهيم')));
        assert.ok(ibrahim.answers.some(a => a === normalizeArabicForMatch('أبرام')));
    });

    test('empty pool returns empty array', () => {
        assert.deepEqual(buildTermPool({}, 'random', 'medium'), []);
    });

    test('difficulty filtering actually works', () => {
        const easy = buildTermPool(pools, 'random', 'easy');
        const expert = buildTermPool(pools, 'random', 'expert');
        assert.ok(easy.length > 0);
        assert.ok(expert.length > 0);
    });
});

describe('buildWordleWordPool', () => {
    test('returns only single-word, single-token entries', () => {
        const result = buildWordleWordPool(pools, 'random');
        result.forEach(entry => {
            assert.ok(!/\s/.test(entry.term), `Term should be single-word: "${entry.term}"`);
            assert.ok(!/\d/.test(entry.term), `Term should have no digits: "${entry.term}"`);
        });
    });

    test('deduplicates by normalized form', () => {
        const result = buildWordleWordPool(pools, 'random');
        const normalized = result.map(e => normalizeArabicForMatch(e.term));
        assert.equal(normalized.length, new Set(normalized).size);
    });

    test('filters by category parameter', () => {
        assert.ok(buildWordleWordPool(pools, 'book').length > 0);
        assert.ok(buildWordleWordPool(pools, 'name').length > 0);
        assert.ok(buildWordleWordPool(pools, 'place').length > 0);
    });

    test('each entry has term and category', () => {
        const result = buildWordleWordPool(pools, 'random');
        result.slice(0, 10).forEach(entry => {
            assert.ok('term' in entry);
            assert.ok('category' in entry);
        });
    });
});
