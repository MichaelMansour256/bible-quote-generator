import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { createFlipCardGameMixin } from '../js/features/games/flip-card-game.js';

// Minimal DOM mock for flip-card-game methods
let flippedState = false;
let gradeButtonsDisabled = true;
let statusText = '';
let nextBtnDisabled = true;

const mockDoc = {
    getElementById(id) {
        if (id === 'test-flip-card') {
            return {
                classList: {
                    contains: (c) => c === 'flipped' && flippedState,
                    add: () => { flippedState = true; },
                    remove: () => { flippedState = false; },
                    toggle: (c) => { flippedState = !flippedState; return flippedState; }
                },
                setAttribute: () => {},
                removeAttribute: () => {}
            };
        }
        if (id === 'test-game-status') return { get textContent() { return statusText; }, set textContent(v) { statusText = v; } };
        if (id === 'test-knew-btn') return { get disabled() { return gradeButtonsDisabled; }, set disabled(v) { gradeButtonsDisabled = v; } };
        if (id === 'test-didnt-btn') return { get disabled() { return gradeButtonsDisabled; }, set disabled(v) { gradeButtonsDisabled = v; } };
        if (id === 'test-next-btn') return { get disabled() { return nextBtnDisabled; }, set disabled(v) { nextBtnDisabled = v; } };
        if (id === 'test-difficulty-select') return { value: 'medium' };
        return null;
    }
};

const makeInstance = (mixin) => Object.assign(Object.create(mixin), {
    testGameState: { person: null, revealed: false, graded: false, seenCount: 0, knewCount: 0, didntCount: 0 },
    testGamePool: [{ name: 'Adam', clue: 'clue', category: 'cat', difficulty: 'easy' }],
    testUsedPersons: new Set(),
    testGameDifficultyKey: 'bible-test-game-difficulty'
});

const mixin = createFlipCardGameMixin({
    prefix: 'test',
    stem: 'Test',
    pickStem: 'Person',
    stateProp: 'testGameState',
    poolProp: 'testGamePool',
    usedSetProp: 'testUsedPersons',
    difficultyKeyProp: 'testGameDifficultyKey',
    defaultPool: [{ name: 'Adam', clue: 'clue', category: 'cat', difficulty: 'easy' }],
    levelMap: { easy: 'easy', medium: 'medium', hard: 'hard' },
    itemKey: p => p.name,
    itemProp: 'person',
    idleStatus: 'idle text',
    flippedStatus: p => 'flipped: ' + p.name,
    gradedStatus: k => k ? 'knew' : 'didnt',
    loadContent: function(p) { this._loaded = p; }
});

test('flipCard enables grade buttons without ReferenceError', () => {
    Object.defineProperty(globalThis, 'document', { value: mockDoc, writable: true, configurable: true });
    Object.defineProperty(globalThis, 'navigator', { value: { vibrate: () => {} }, writable: true, configurable: true });
    // Prevent real timers from firing after test ends
    Object.defineProperty(globalThis, 'setTimeout', { value: () => 999, writable: true, configurable: true });

    // Reset shared state
    flippedState = false;
    gradeButtonsDisabled = true;
    statusText = '';
    nextBtnDisabled = true;

    const inst = makeInstance(mixin);
    inst.testGameState.person = { name: 'Adam', clue: 'clue', category: 'cat', difficulty: 'easy' };
    inst.testGameState.revealed = false;
    inst.testGameState.graded = false;

    // Grade buttons start disabled
    assert.equal(gradeButtonsDisabled, true);

    // Flip the card -- this is where the bug was: flippedStatus(item) with undefined item
    // Before the fix, this threw ReferenceError: item is not defined
    inst.flipTestCard();

    // After flipping, buttons should be enabled
    assert.equal(flippedState, true);
    assert.equal(inst.testGameState.revealed, true);
    assert.equal(gradeButtonsDisabled, false, 'grade buttons should be enabled after flipping');

    // Status text should be set via flippedStatus(item) -- would throw before fix
    assert.equal(statusText, 'flipped: Adam');

    // Grade the card -- should not throw
    inst.gradeTestCard(true);

    assert.equal(inst.testGameState.knewCount, 1);
    assert.equal(gradeButtonsDisabled, true, 'buttons re-disabled after grading');

    delete globalThis.document;
    delete globalThis.navigator;
    delete globalThis.setTimeout;
});

test('flipCard disable path works correctly', () => {
    Object.defineProperty(globalThis, 'document', { value: mockDoc, writable: true, configurable: true });
    Object.defineProperty(globalThis, 'navigator', { value: { vibrate: () => {} }, writable: true, configurable: true });

    flippedState = true;   // card is already flipped
    gradeButtonsDisabled = false;
    statusText = '';
    nextBtnDisabled = true;

    const inst = makeInstance(mixin);
    inst.testGameState.person = { name: 'Adam', clue: 'clue', category: 'cat', difficulty: 'easy' };
    inst.testGameState.revealed = true;
    inst.testGameState.graded = false;

    // Flip back (unflip)
    inst.flipTestCard();

    assert.equal(flippedState, false);
    assert.equal(inst.testGameState.revealed, false);
    assert.equal(gradeButtonsDisabled, true, 'buttons should be disabled after unflipping');
    assert.equal(statusText, 'idle text');

    delete globalThis.document;
    delete globalThis.navigator;
});

