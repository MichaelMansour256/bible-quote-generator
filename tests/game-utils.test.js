import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
    normalizeArabicForMatch,
    normalizeArabicDigits,
    normalizeAnswerText,
} from '../js/features/games/game-utils.js';

describe('normalizeArabicForMatch', () => {
    test('removes diacritics and hamza variants', () => {
        assert.equal(
            normalizeArabicForMatch('الْحَمْدُ لِلَّهِ'),
            normalizeArabicForMatch('الحمد لله')
        );
    });

    test('folds alef variants to bare alef', () => {
        const variants = ['أ', 'إ', 'آ', 'ٱ'].map(normalizeArabicForMatch);
        assert.ok(variants.every(v => v === 'ا'), `Expected all to be 'ا', got: ${JSON.stringify(variants)}`);
    });

        test('folds taa marbuta to ه', () => {
        assert.equal(normalizeArabicForMatch('البلادة'), normalizeArabicForMatch('البلاده'));
        // ة → ه, but ي stays ي (تاء مربوطة ≠ ياء)
        assert.equal(normalizeArabicForMatch('المدينة'), 'المدينه');
    });

    test('handles empty/null/undefined', () => {
        assert.equal(normalizeArabicForMatch(''), '');
        assert.equal(normalizeArabicForMatch(null), '');
        assert.equal(normalizeArabicForMatch(undefined), '');
    });

    test('removes tatweel (Arabic underline)', () => {
        assert.equal(normalizeArabicForMatch('الـ كتاب'), normalizeArabicForMatch('ال كتاب'));
    });
});

describe('normalizeArabicDigits', () => {
    test('converts Arabic-Indic digits to ASCII', () => {
        assert.equal(normalizeArabicDigits('٣:١٦'), '3:16');
        assert.equal(normalizeArabicDigits('الآية ٢٣'), 'الآية 23');
    });

    test('leaves ASCII digits unchanged', () => {
        assert.equal(normalizeArabicDigits('John 3:16'), 'John 3:16');
    });

    test('handles empty/null', () => {
        assert.equal(normalizeArabicDigits(''), '');
        assert.equal(normalizeArabicDigits(null), '');
    });
});

describe('normalizeAnswerText', () => {
    test('removes punctuation and lowercases', () => {
        assert.equal(normalizeAnswerText('الْحَمْدُ!'), normalizeAnswerText('الحمد'));
    });

    test('converts Arabic digits', () => {
        assert.equal(normalizeAnswerText('آية ٣:١٦'), normalizeAnswerText('آية 3:16'));
    });

    test('full chain: digits + diacritics + alef variants removed', () => {
        const input = 'يَسُوعُ ٱلنَّاصِرُ ٣:١٦';
        const result = normalizeAnswerText(input);
        assert.ok(!result.includes('َ') && !result.includes('ُ') && !result.includes('ٱ'));
        assert.ok(!/[٠-٩]/.test(result), `Should not contain Arabic digits: ${result}`);
    });
});
