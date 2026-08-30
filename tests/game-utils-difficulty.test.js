import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
    getDifficultyRank,
    matchesDifficulty,
} from '../js/features/games/game-utils.js';

// Set up global bibleDatabase like the browser does via <script> tag
const dbCode = readFileSync(
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'js/core/bible-database.js'),
    'utf8'
);
const fn = new Function(dbCode.replace(/const bibleDatabase/, 'globalThis.bibleDatabase'));
fn();

describe('getDifficultyRank', () => {
    test('returns correct ranks', () => {
        assert.equal(getDifficultyRank('easy'), 0);
        assert.equal(getDifficultyRank('medium'), 1);
        assert.equal(getDifficultyRank('hard'), 2);
        assert.equal(getDifficultyRank('expert'), 3);
    });

    test('defaults to medium rank for unknown values', () => {
        assert.equal(getDifficultyRank('unknown'), 1);
        assert.equal(getDifficultyRank(''), 1);
    });
});

describe('matchesDifficulty', () => {
    const mockEntries = [
        { term: 'موسى', difficulty: 'easy' },
        { term: 'الملك داود', difficulty: 'medium' },
        { term: 'يوشع بن نون', difficulty: 'medium' },
        { term: 'مريم المجدلية', difficulty: 'hard' },
        { term: 'إبراهيم الخليل', difficulty: 'expert' },
    ];

    test('easy includes single-word entries of any difficulty', () => {
        const result = mockEntries.filter(e => matchesDifficulty(e, 'easy'));
        assert.ok(result.some(e => e.term === 'موسى'));
        assert.equal(
            result.length,
            mockEntries.filter(e => e.term.split(/\s+/).filter(Boolean).length === 1).length
        );
    });

    test('medium includes ranks 0-1', () => {
        const result = mockEntries.filter(e => matchesDifficulty(e, 'medium'));
        assert.ok(result.some(e => e.term === 'موسى'));
        assert.ok(result.some(e => e.term === 'الملك داود'));
        assert.ok(!result.some(e => e.term === 'مريم المجدلية'));
        assert.ok(!result.some(e => e.term === 'إبراهيم الخليل'));
    });

    test('hard requires rank >= 1 AND wordCount >= 2', () => {
        const result = mockEntries.filter(e => matchesDifficulty(e, 'hard'));
        assert.ok(!result.some(e => e.term === 'موسى'));
        assert.ok(result.some(e => e.term === 'الملك داود'));
        assert.ok(result.some(e => e.term === 'مريم المجدلية'));
        assert.ok(result.some(e => e.term === 'إبراهيم الخليل'));
    });

    test('hard excludes single-word entries regardless of tagged difficulty', () => {
        assert.ok(!matchesDifficulty({ term: 'قاس', difficulty: 'hard' }, 'hard'));
    });

        test('expert includes 3+ word terms and expert-tagged terms', () => {
        const result = mockEntries.filter(e => matchesDifficulty(e, 'expert'));
        assert.ok(result.some(e => e.term === 'يوشع بن نون'));
        assert.ok(result.some(e => e.term === 'إبراهيم الخليل'));
    });

    test('expert can include long 2-word terms via term.length >= 10 rule', () => {
        const result = mockEntries.filter(e => matchesDifficulty(e, 'expert'));
        // 'الملك داود' is 10 chars incl. space, included via the length rule
        assert.ok(result.some(e => e.term === 'الملك داود'));
    });
});
