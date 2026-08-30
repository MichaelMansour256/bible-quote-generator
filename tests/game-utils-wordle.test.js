import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
    buildWordleDictionary,
    evaluateWordleGuess,
    getArabicStemVariants,
    getWordleDisplayLetters,
    getWordleLetterCount,
    isWordleGuessValid,
    normalizeArabicForMatch,
    WORDLE_COMMON_ARABIC_WORDS,
} from '../js/features/games/game-utils.js';
import { wordleGameMixin } from '../js/features/games/wordle-game.js';

// Set up global bibleDatabase like the browser does via <script> tag.
const dbCode = readFileSync(
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'js/core/bible-database.js'),
    'utf8'
);
const fn = new Function(dbCode.replace(/const bibleDatabase/, 'globalThis.bibleDatabase'));
fn();

describe('getWordleLetterCount', () => {
    test('counts letters after normalization', () => {
        assert.equal(getWordleLetterCount('موسى'), 4);
        assert.equal(getWordleLetterCount('الله'), 4);
        assert.equal(getWordleLetterCount('يوحنا'), 5);
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
describe('getArabicStemVariants', () => {
    test('strips the definite article', () => {
        assert.deepEqual(getArabicStemVariants('المسيح'), ['مسيح']);
    });

    test('strips stacked clitic prefixes', () => {
        const light = getArabicStemVariants('والنور');
        assert.ok(light.includes('النور'));
        assert.ok(light.includes('نور'));
        const byFaith = getArabicStemVariants('بالايمان');
        assert.ok(byFaith.includes('الايمان'));
        assert.ok(byFaith.includes('ايمان'));
        const withBy = getArabicStemVariants('وبالخير');
        assert.ok(withBy.includes('بالخير'));
        assert.ok(withBy.includes('الخير'));
        assert.ok(withBy.includes('خير'));
    });

    test('leaves unprefixed words alone', () => {
        assert.deepEqual(getArabicStemVariants('من'), []);
    });

    test('variant output is at least two letters', () => {
        getArabicStemVariants('بيت').forEach(variant => {
            assert.ok(variant.length >= 2, `variant too short: "${variant}"`);
        });
        assert.deepEqual(getArabicStemVariants('بيت'), ['يت']);
    });

    test('returns empty for null/empty input', () => {
        assert.deepEqual(getArabicStemVariants(''), []);
        assert.deepEqual(getArabicStemVariants(null), []);
        assert.deepEqual(getArabicStemVariants(undefined), []);
    });
});

describe('buildWordleDictionary', () => {
    test('includes normalized Bible verse words with stem variants', () => {
        const dictionary = buildWordleDictionary({
            bibleText: ['أَنَا هُوَ الطَّرِيقُ وَالْحَقُّ وَالْحَيَاةُ.'],
            poolTerms: ['موسى', 'المزامير', 'إبراهيم']
        });
        assert.ok(dictionary.has('انا'));       // أ → ا
        assert.ok(dictionary.has('هو'));
        assert.ok(dictionary.has('الطريق'));    // article kept as-is
        assert.ok(dictionary.has('طريق'));      // article stripped
        assert.ok(dictionary.has('الحق'));
        assert.ok(dictionary.has('حق'));
        assert.ok(dictionary.has('الحياه'));    // ة → ه
        assert.ok(dictionary.has('حياه'));
        assert.ok(dictionary.has('موسي'));      // ى → ي
        assert.ok(dictionary.has('المزامير'));
        assert.ok(dictionary.has('مزامير'));
        assert.ok(dictionary.has('ابراهيم'));
    });

    test('bundled common-word baseline is always present', () => {
        const dictionary = buildWordleDictionary();
        WORDLE_COMMON_ARABIC_WORDS.forEach(word => {
            const normalized = normalizeArabicForMatch(word);
            assert.ok(dictionary.has(normalized), `missing base word: ${normalized}`);
        });
    });

    test('never contains empty, single-letter, or non-Arabic tokens', () => {
        const dictionary = buildWordleDictionary({
            bibleText: ['a b c ١٢٣ — - بيت', 'و'],
            poolTerms: ['x', 'المسيح']
        });
        assert.ok(!dictionary.has(''));
        assert.ok(!dictionary.has('a'));
        assert.ok(!dictionary.has('١٢٣'));
        assert.ok(dictionary.has('بيت'));
        for (const word of dictionary) {
            assert.ok(word.length >= 2, `token too short: "${word}"`);
            assert.ok(/^[\u0621-\u064A]+$/.test(word), `non-Arabic token: "${word}"`);
        }
    });
});

describe('isWordleGuessValid', () => {
    const dictionary = buildWordleDictionary({
        bibleText: ['الرب راعي لا يعوزني شيء'],
        poolTerms: ['موسى']
    });

    test('accepts words that exist in the dictionary', () => {
        assert.ok(isWordleGuessValid(dictionary, 'الرب'));
        assert.ok(isWordleGuessValid(dictionary, 'راعي'));
        assert.ok(isWordleGuessValid(dictionary, 'يعوزني'));
        assert.ok(isWordleGuessValid(dictionary, 'موسي')); // ى → ي
    });

    test('rejects gibberish letter strings', () => {
        assert.equal(isWordleGuessValid(dictionary, 'لتفق'), false);
        assert.equal(isWordleGuessValid(dictionary, 'صقشرت'), false);
        assert.equal(isWordleGuessValid(dictionary, 'بشكلم'), false);
    });

    test('treats a missing or empty dictionary as invalid', () => {
        assert.equal(isWordleGuessValid(null, 'الرب'), false);
        assert.equal(isWordleGuessValid(new Set(), 'الرب'), false);
        assert.equal(isWordleGuessValid(dictionary, ''), false);
    });
});

describe('wordleGameMixin dictionary helpers', () => {
    test('collectWordleBibleText reads the bundled popular verses', () => {
        const instance = Object.assign(Object.create(wordleGameMixin), { bibleData: null });
        const texts = instance.collectWordleBibleText();
        assert.ok(texts.length > 0);
        assert.ok(texts.some(t => t.includes('الله')));
    });

    test('collectWordleBibleText merges the fetched full Bible', () => {
        const instance = Object.assign(Object.create(wordleGameMixin), {
            bibleData: {
                books: [{
                    chapters: [{
                        verses: [{ verse: 1, text: 'فِي الْبَدْءِ خَلَقَ اللهُ السَّمَاوَاتِ وَالأَرْضَ.' }]
                    }]
                }]
            }
        });
        const texts = instance.collectWordleBibleText();
        assert.ok(texts.some(t => t.includes('السَّمَاوَاتِ')));
    });

    test('builds a cached dictionary and rejects gibberish', () => {
        const instance = Object.assign(Object.create(wordleGameMixin), { bibleData: null });
        const dictionary = instance.buildWordleDictionary();
        assert.ok(dictionary.size > 0);
        assert.equal(instance.wordleDictionary, dictionary); // cached
        assert.ok(dictionary.has('موسي'));                   // from the term pools
        assert.equal(isWordleGuessValid(dictionary, 'هقسنير'), false);
    });
});
