import { WHOAMI_DEFAULT_POOL, WHOAMI_LEVEL_TO_ARABIC } from '../../data/games/whoami-data.js';
import { createFlipCardGameMixin } from './flip-card-game.js';

// "Who Am I?" (من أنا؟) — flash-card game with difficulty levels.
// Each card shows a single clue about a person from the Bible.
// Clicking the card flips it to reveal that person's name.
// Difficulty levels: سهل (easy) / متوسط (medium) / صعب (hard).
// All shared flip-card machinery (pool cycling, grading, counters, flip
// animation timing) comes from the shared factory — only the card data,
// the element ids, and the wording are defined here.
export const whoamiGameMixin = createFlipCardGameMixin({
    prefix: 'whoami',
    stem: 'Whoami',
    pickStem: 'Person',
    stateProp: 'whoamiGameState',
    poolProp: 'whoamiGamePool',
    usedSetProp: 'whoamiUsedPersons',
    difficultyKeyProp: 'whoamiGameDifficultyKey',
    defaultPool: WHOAMI_DEFAULT_POOL,
    levelMap: WHOAMI_LEVEL_TO_ARABIC,
    itemKey: person => person.name,
    itemProp: 'person',
    idleStatus: 'اقرأ التلميح وقلّب البطاقة، ثم حدد: هل عرفتها؟',
    flippedStatus: person => `الشخصية هي: ${person.name} — اسحب البطاقة يسارًا (عرفتها) أو يمينًا (لم أعرفها).`,
    gradedStatus: knew => knew
        ? 'أحسنت! احتسبت هذه الشخصية ضمن من عرفتهم.'
        : 'لا بأس، ستتعرف عليها في المرة القادمة.',
    loadContent(person) {
        const clueEl = document.getElementById('whoami-game-clue-text');
        const answerEl = document.getElementById('whoami-game-answer');
        const categoryEl = document.getElementById('whoami-game-category');
        if (clueEl) clueEl.textContent = person.clue;
        if (answerEl) answerEl.textContent = person.name;
        if (categoryEl) categoryEl.textContent = person.category;
    }
});
