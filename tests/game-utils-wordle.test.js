import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
    getWordleLetterCount,
    getWordleDisplayLetters,
    evaluateWordleGuess,
    normalizeArabicForMatch,
} from '../js/features/games/game-utils.js';

describe('getWordleLetterCount', () => {
    test('counts letters after normalization', () => {
        assert.equal(getWordleLetterCount('موسى'), 4);
        assert.equal(getWordleLetterCount('الله'), 4);
        assert.equal(getWordleLetterCount('يوحنا'), 4);
        assert.equal(getWordleLetterCount('الملك'), 5);
    });

    test('ignores whitespace', () => {
        assert.equal(getWordleLetterCount('  موسى  '), 4);
    });

    test('folds alef variants', () => {
        assert.equal(getWordleLetterCount('أ'), 1);
        assert.equal(getWordleLetterCount('إ'), 1);
        assert.equal(getWordleLetterCount('آ'), 1);
    });

    test('handles empty/null', () => {
        assert.equal(getWordleLetterCount(''), 0);
        assert.equal(getWordleLetterCount(null), 0);
    });
});

describe('getWordleDisplayLetters', () => {
    test('returns individual letters', () => {
        assert.deepEqual(getWordleDisplayLetters('موسى'), ['م', 'و', 'س', 'ى']);
    });

    test('removes diacritics', () => {
        assert.deepEqual(getWordleDisplayLetters('الْحَمْدُ'), Array.from('الحمد'));
    });

    test('ignores whitespace', () => {
        assert.deepEqual(getWordleDisplayLetters('  موسى  '), ['م', 'و', 'س', 'ى']);
    });
});

describe('evaluateWordleGuess', () => {
    test('all correct when guess matches target', () => {
        const target = Array.from(normalizeArabicForMatch('موسى'));
        const guess = Array.from(normalizeArabicForMatch('موسى'));
        assert.deepEqual(evaluateWordleGuess(guess, target), ['correct', 'correct', 'correct', 'correct']);
    });

        test('all absent when no letters match', () => {
        const target = Array.from(normalizeArabicForMatch('موسى'));
        const guess = Array.from(normalizeArabicForMatch('دهرب'));
        assert.deepEqual(evaluateWordleGuess(guess, target), ['absent', 'absent', 'absent', 'absent']);
    });

    test('duplicate letters - present with limited supply', () => {
        // target: AAB, guess: BAA → B is present (in target at pos 2),
        // A at pos 1 is correct, A at pos 2 is present (one A remains)
        const target = ['ا', 'ا', 'ب'];
        const guess = ['ب', 'ا', 'ا'];
        assert.deepEqual(evaluateWordleGuess(guess, target), ['present', 'correct', 'present']);
    });

    test('present marker for letters in wrong position', () => {
        // target: ABAC, guess: DAAA → D is absent,
        // first A is present (one A remains after pos 3 is correct),
        // second A is absent (no As remaining), last A is correct
        const target = ['ا', 'ب', 'ج', 'ا'];
        const guess = ['د', 'ا', 'ا', 'ا'];
        assert.deepEqual(evaluateWordleGuess(guess, target), ['absent', 'present', 'absent', 'correct']);
    });

    test('handles different lengths gracefully', () => {
        const target = ['م', 'و', 'س', 'ى'];
        const guess = ['م', 'و'];
        const result = evaluateWordleGuess(guess, target);
        assert.equal(result.length, 2);
        assert.equal(result[0], 'correct');
        assert.equal(result[1], 'correct');
    });

    test('handles empty arrays', () => {
        assert.deepEqual(evaluateWordleGuess([], []), []);
        assert.deepEqual(evaluateWordleGuess(null, null), []);
    });
});
