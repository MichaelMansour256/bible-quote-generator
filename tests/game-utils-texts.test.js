import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
    getAnswerVariants,
    reverseCharacters,
    scrambleWord,
    scrambleText,
    normalizeAnswerText,
} from '../js/features/games/game-utils.js';

describe('getAnswerVariants', () => {
    test('returns the base normalized form', () => {
        const variants = getAnswerVariants('الملك داود');
        assert.ok(variants.includes(normalizeAnswerText('الملك داود')));
    });

    test('strips ال definite article prefix', () => {
        const variants = getAnswerVariants('الله');
        assert.ok(variants.some(v => v === normalizeAnswerText('الله')));
        assert.ok(variants.some(v => v === normalizeAnswerText('له')));
    });

    test('strips سفر prefix', () => {
        const variants = getAnswerVariants('سفر تكوين');
        assert.ok(variants.some(v => v === normalizeAnswerText('تكوين')));
    });

    test('strips كتاب prefix', () => {
        const variants = getAnswerVariants('كتاب تكوين');
        assert.ok(variants.some(v => v === normalizeAnswerText('تكوين')));
    });

    test('deduplicates variants', () => {
        const variants = getAnswerVariants('الله');
        assert.equal(variants.length, new Set(variants).size);
    });

    test('handles null/undefined input', () => {
        assert.deepEqual(getAnswerVariants(null), ['']);
    });
});

describe('reverseCharacters', () => {
    test('reverses the character order', () => {
        assert.equal(reverseCharacters('abc'), 'cba');
    });

    test('reverses Arabic text correctly using Array.from', () => {
        assert.equal(reverseCharacters('يوحنا'), 'انحوي');
    });

    test('normalizes whitespace before reversing', () => {
        assert.equal(reverseCharacters('a  b'), 'b  a');
    });

    test('handles empty/null/undefined', () => {
        assert.equal(reverseCharacters(''), '');
        assert.equal(reverseCharacters(null), '');
        assert.equal(reverseCharacters(undefined), '');
    });
});

describe('scrambleWord', () => {
    test('preserves single character', () => {
        assert.equal(scrambleWord('a'), 'a');
    });

    test('preserves two-character word', () => {
        assert.equal(scrambleWord('ab'), 'ab');
    });

    test('returns same character set for longer words', () => {
        const word = 'الله';
        const scrambled = scrambleWord(word);
        assert.equal(scrambled.length, word.length);
        assert.deepEqual(
            Array.from(scrambled).sort(),
            Array.from(word).sort()
        );
    });

    test('attempts to produce a different arrangement for long words', () => {
        let differentCount = 0;
        for (let i = 0; i < 20; i++) {
            if (scrambleWord('الملكوت') !== 'الملكوت') differentCount++;
        }
        assert.ok(differentCount > 0);
    });

    test('handles empty/null', () => {
        assert.equal(scrambleWord(''), '');
        assert.equal(scrambleWord(null), '');
    });
});

describe('scrambleText', () => {
    test('scrambles each word but preserves word count', () => {
        const text = 'يوحنا ثلاثة عشرة';
        const scrambled = scrambleText(text);
        assert.equal(scrambled.split(' ').length, text.split(' ').length);
    });

    test('each scrambled word has same characters as original', () => {
        const text = 'يوحنا ثلاثة';
        const scrambled = scrambleText(text);
        const origWords = text.split(' ');
        const scrmWords = scrambled.split(' ');
        origWords.forEach((word, i) => {
            if (word.length > 0) {
                assert.deepEqual(
                    Array.from(scrmWords[i]).sort(),
                    Array.from(word).sort()
                );
            }
        });
    });

    test('handles empty/null', () => {
        assert.equal(scrambleText(''), '');
        assert.equal(scrambleText(null), '');
    });
});
