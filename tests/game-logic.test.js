import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
    normalizeAnswerText,
    getAnswerVariants,
    reverseCharacters,
    scrambleText,
    createBibleTermPools,
    buildTermPool,
} from '../js/features/games/game-utils.js';

const dbCode = readFileSync(
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'js/data/bible-database.js'),
    'utf8'
);
const fn = new Function(dbCode.replace(/const bibleDatabase/, 'globalThis.bibleDatabase'));
fn();

describe('Reverse game answer matching logic', () => {
    test('reversed characters of a word form the clue', () => {
        assert.equal(reverseCharacters('يوحنا'), 'انحوي');
    });

    test('answer variants include bare word without ال prefix', () => {
        const variants = getAnswerVariants('الله');
        const userTypes = normalizeAnswerText('الله');
        assert.ok(variants.includes(userTypes));
        const userTypesWithoutAl = normalizeAnswerText('له');
        assert.ok(variants.includes(userTypesWithoutAl));
    });

    test('matching is normalization-aware', () => {
        const normalized = normalizeAnswerText('الْمَلَكُ داودُ');
        assert.equal(normalizeAnswerText('المَلَك داود'), normalized);
        assert.notEqual(normalized, normalizeAnswerText('الملك داود ٣:١٦'));
    });
});

describe('Scramble game answer matching logic', () => {
    test('answer matching uses normalized comparison', () => {
        const variants = getAnswerVariants('يوحنا');
        const userAnswer = normalizeAnswerText('يوحنا');
        assert.ok(variants.some(v => v === userAnswer));
    });

    test('scrambled text contains same characters', () => {
        const original = 'يوحنا ثلاثة';
        const scrambled = scrambleText(original);
        const origChars = Array.from(original.replace(/\s+/g, '')).sort();
        const scrmChars = Array.from(scrambled.replace(/\s+/g, '')).sort();
        assert.deepEqual(scrmChars, origChars);
    });
});

describe('Reverse/Scramble game pool building', () => {
    test('buildTermPool random/easy returns entries with answers', () => {
        const result = buildTermPool(createBibleTermPools(), 'random', 'easy');
        assert.ok(result.length > 0);
        result.forEach(entry => {
            assert.ok(entry.answers && entry.answers.length > 0);
        });
    });

    test('pool entries for multi-word terms include answer variants', () => {
        const result = buildTermPool(createBibleTermPools(), 'name', 'medium');
        const multiWord = result.find(e => e.term.includes(' '));
        if (multiWord) {
            assert.ok(multiWord.answers.length > 0);
            multiWord.answers.forEach(answer => {
                assert.equal(answer, normalizeAnswerText(answer));
            });
        }
    });
});
