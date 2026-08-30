import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { memoryGameMixin } from '../js/features/games/memory-game.js';
import { normalizeGameText } from '../js/features/games/game-utils.js';

const makeInstance = (gameState) => Object.assign(Object.create(memoryGameMixin), { gameState });

describe('memoryGameMixin.calculateGameScore', () => {
    test('perfect answers score 100 even with attached punctuation', () => {
        const inst = makeInstance({ hiddenWords: ['يُعْوِزُنِي', 'شَيْءٌ.'] });
        assert.equal(inst.calculateGameScore('irrelevant', 'يُعْوِزُنِي شَيْءٌ.'), 100);
        // User typing without the period must still match.
        assert.equal(inst.calculateGameScore('irrelevant', 'يُعْوِزُنِي شَيْء'), 100);
    });

    test('partial answers score proportionally', () => {
        const inst = makeInstance({ hiddenWords: ['يُعْوِزُنِي', 'شَيْءٌ.'] });
        assert.equal(inst.calculateGameScore('irrelevant', 'يُعْوِزُنِي'), 50);
        assert.equal(inst.calculateGameScore('irrelevant', ''), 0);
    });

    test('normalization-insensitive: alef variants, taa marbuta, hamza', () => {
        const inst = makeInstance({ hiddenWords: ['السَّمَاوَاتِ', 'الْأَرْضَ', 'مَرْيَمُ'] });
        assert.equal(inst.calculateGameScore('irrelevant', 'السماوات الأرض مريم'), 100);
    });

    test('falls back to full expected text when no words are hidden', () => {
        const inst = makeInstance({ hiddenWords: [] });
        assert.equal(inst.calculateGameScore('رَبِّي وَإِلَهِي', 'رَبِّي'), 50);
    });
});

describe('memoryGameMixin.buildMemoryChipWords', () => {
    // The game compares chips to blank values through normalizeGameText, so the
    // tests use the same normalizer (strips diacritics AND punctuation).
    const norm = (chip) => normalizeGameText(chip);

    test('includes every hidden answer word exactly once', () => {
        const inst = makeInstance({
            verse: { text: 'الرَّبُّ رَاعِيَّ فَلاَ يُعْوِزُنِي شَيْءٌ.' },
            hiddenWords: ['فَلاَ', 'شَيْءٌ.']
        });
        const chips = inst.buildMemoryChipWords();
        const normalizedChips = chips.map(norm);
        assert.equal(normalizedChips.filter(w => w === 'فلا').length, 1);
        assert.equal(normalizedChips.filter(w => w === 'شيء').length, 1);
    });

    test('adds decoy words so the bank is bigger than the answers', () => {
        const inst = makeInstance({
            verse: { text: 'الرَّبُّ رَاعِيَّ فَلاَ يُعْوِزُنِي شَيْءٌ.' },
            hiddenWords: ['فَلاَ', 'شَيْءٌ.']
        });
        const chips = inst.buildMemoryChipWords();
        assert.ok(chips.length > 2, `expected decoys, got only ${chips.length} chips`);
        const answers = new Set(['فلا', 'شيء']);
        const decoys = chips.map(norm).filter(w => !answers.has(w));
        assert.ok(decoys.length > 0, 'expected at least one decoy chip');
    });

    test('never includes a decoy that is actually an answer', () => {
        const inst = makeInstance({
            verse: { text: 'وَالأَرْضُ وَالسَّمَاوَاتُ' },
            hiddenWords: ['السَّمَاوَاتُ']
        });
        const chips = inst.buildMemoryChipWords();
        const normalizedChips = chips.map(norm);
        assert.equal(normalizedChips.filter(w => w === 'السماوات').length, 1);
        // Everything except the single answer is a decoy (never the answer).
        assert.ok(normalizedChips.filter(w => w !== 'السماوات').length >= 1);
    });

    test('uses fallback decoys when the verse has no spare words', () => {
        const inst = makeInstance({
            verse: { text: 'فَلاَ شَيْءٌ.' },
            hiddenWords: ['فَلاَ', 'شَيْءٌ.']
        });
        const chips = inst.buildMemoryChipWords();
        const normalizedChips = chips.map(norm);
        assert.equal(normalizedChips.filter(w => w === 'فلا').length, 1);
        assert.equal(normalizedChips.filter(w => w === 'شيء').length, 1);
        assert.ok(chips.length > 2, 'fallback decoy words should appear');
    });
});