import { reverseCharacters } from './game-utils.js';
import { createWordGameMixin } from './word-game.js';

// "الكلمات المعكوسة" — read the word with its characters reversed, then type
// the original term. All shared machinery (pool cycling, timer, time-bonus
// scoring, live auto-check, persistence) comes from the shared word-game
// factory; only the clue transform and the game-specific wording differ
// from the scramble game.
export const reverseGameMixin = createWordGameMixin({
    prefix: 'reverse',
    stem: 'Reverse',
    clueTransform: term => reverseCharacters(term),
    notStartedStatus: 'ابدأ لعبة الكلمات المعكوسة أولاً.',
    readyStatus: 'اقرأ الكلمة المعكوسة واكتب الإجابة الصحيحة.'
});

