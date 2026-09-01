import { normalizeCrosswordTerm, crosswordGameMixin } from './js/features/games/crossword-game.js';

console.log('normalize =>', normalizeCrosswordTerm('آبَلَ'));

const entries = [
  { answer: 'موسى', clue: 'اسم نبي', direction: 'across', row: 2, col: 0 },
  { answer: 'سوى', clue: 'غير', direction: 'down', row: 1, col: 1 }
];

const puzzle = crosswordGameMixin.buildCrosswordPuzzle(entries);
console.log('intersections =>', JSON.stringify(puzzle.intersections));
console.log('board =>', JSON.stringify(puzzle.board.map(row => row.map(v => v ?? '#').join(' '))));
