import { EMOJIVERSE_DEFAULT_POOL, EMOJIVERSE_LEVEL_TO_ARABIC } from '../../data/games/emojiverse-data.js';
import { createFlipCardGameMixin } from './flip-card-game.js';

// "EmojiVerse" (إيموجي آية) — emoji flash-card game with difficulty levels.
// The front of each card shows a set of emojis describing a Bible story,
// event, or verse. Clicking the card flips it to reveal the answer plus a
// short story summary.
// Difficulty levels: سهل (easy) / متوسط (medium) / صعب (hard).
// All shared flip-card machinery (pool cycling, grading, counters, flip
// animation timing) comes from the shared factory — only the card data,
// the element ids, and the wording are defined here.
export const emojiverseGameMixin = createFlipCardGameMixin({
    prefix: 'emojiverse',
    stem: 'Emojiverse',
    pickStem: 'Card',
    stateProp: 'emojiverseGameState',
    poolProp: 'emojiverseGamePool',
    usedSetProp: 'emojiverseUsedCards',
    difficultyKeyProp: 'emojiverseGameDifficultyKey',
    defaultPool: EMOJIVERSE_DEFAULT_POOL,
    levelMap: EMOJIVERSE_LEVEL_TO_ARABIC,
    itemKey: card => card.emojis + card.answer,
    itemProp: 'card',
    idleStatus: 'اقرأ الإيموجي وقلّب البطاقة، ثم حدّد: هل عرفتها؟',
    flippedStatus: card => `الإجابة: ${card.answer} — اسحب البطاقة يسارًا (عرفتها) أو يمينًا (لم أعرفها).`,
    gradedStatus: knew => knew
        ? 'أحسنت! احتسبت هذه البطاقة ضمن من عرفتها.'
        : 'لا بأس، ستتعرف على هذه القصة في المرة القادمة.',
    loadContent(card) {
        const emojiEl = document.getElementById('emojiverse-game-emoji');
        const answerEl = document.getElementById('emojiverse-game-answer');
        const storyEl = document.getElementById('emojiverse-game-story');
        const categoryEl = document.getElementById('emojiverse-game-category');
        if (emojiEl) emojiEl.textContent = card.emojis;
        if (answerEl) answerEl.textContent = card.answer;
        if (storyEl) storyEl.textContent = card.story;
        if (categoryEl) categoryEl.textContent = card.category;
    }
});
