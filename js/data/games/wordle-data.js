// "HolyWordle" — game data: attempt limits, allowed word lengths and the
// on-screen Arabic keyboard rows. Content only; game logic lives in
// wordle-game.js.

export const WORDLE_MAX_ATTEMPTS = 6;
export const WORDLE_ALLOWED_LENGTHS = [4, 5, 6, 7];

// On-screen keyboard keys in the SAME left-to-right order as a normal physical
// Arabic keyboard (row 1 = ض/ص/ث/ق/ف/غ/ع/ه/خ/ح, row 2 = ش/س/…, row 3 = ئ/ء/…).
// The keyboard container renders these rows LTR so letter positions match the
// physical keyboard — Backspace and Enter land on the right-hand side too.
// (The word board above stays RTL since Arabic words are written right-to-left.)
export const WORDLE_KEY_ROWS = [
    ['ض', 'ص', 'ث', 'ق', 'ف', 'غ', 'ع', 'ه', 'خ', 'ح', 'ج'],
    ['ش', 'س', 'ي', 'ب', 'ل', 'ا', 'ت', 'ن', 'م', 'ك', 'ط'],
    ['ذ', 'ئ', 'ء', 'ؤ', 'ر', 'ى', 'ة', 'و', 'ز', 'ظ', 'د']
];
