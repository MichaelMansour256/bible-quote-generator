import { buzz } from './game-utils.js';

// Factory for the two flash-card games ("من أنا؟" / "إيموجي آية"). Both share
// the same loop: pick a card from a difficulty-filtered pool (with per-session
// cycling), show the clue, flip to reveal, self-grade via عرفتها / لم أعرفها
// buttons or swipe, then auto-advance to the next card. `config` supplies the
// parts that genuinely differ between the two games:
//   - prefix:     element-id prefix ("whoami" / "emojiverse")
//   - stem:       mixin method stem ("Whoami" / "Emojiverse")
//   - pickStem:   pick-method suffix ("Person" / "Card")
//   - stateProp / poolProp / usedSetProp / difficultyKeyProp:
//                 instance property names used by the game
//   - defaultPool: bundled card data
//   - levelMap:    easy/medium/hard → Arabic level name
//   - itemKey:     unique key per card, used for the show-each-card-once cycle
//   - itemProp:    state field holding the active card ("person" / "card")
//   - idleStatus:  status text while the clue side is showing
//   - flippedStatus(item) / gradedStatus(knew): status text builders
//   - loadContent(item): fills the card DOM with the new card's content
export function createFlipCardGameMixin({
    prefix,
    stem,
    pickStem,
    stateProp,
    poolProp,
    usedSetProp,
    difficultyKeyProp,
    defaultPool,
    levelMap,
    itemKey,
    itemProp,
    idleStatus,
    flippedStatus,
    gradedStatus,
    loadContent
}) {
    const nextTimerProp = `${prefix}NextTimer`;

    return {
        [`create${stem}GamePool`]() {
            return defaultPool.slice();
        },

        [`get${stem}Difficulty`](difficulty) {
            const normalized = (difficulty || 'medium').toLowerCase().trim() || 'medium';
            return levelMap[normalized] || 'متوسط';
        },

        [`build${stem}GamePool`](difficulty = 'medium') {
            const sourcePool = this[poolProp] && this[poolProp].length
                ? this[poolProp]
                : this[`create${stem}GamePool`]();
            const targetLevel = this[`get${stem}Difficulty`](difficulty);
            const filtered = sourcePool.filter(item => item.difficulty === targetLevel);
            return filtered.length > 0 ? filtered : sourcePool;
        },

        [`pick${stem}${pickStem}`]() {
            const select = document.getElementById(`${prefix}-difficulty-select`);
            const difficulty = (select && select.value) || 'medium';
            const pool = this[`build${stem}GamePool`](difficulty);
            if (!pool.length) return null;

            if (!this[usedSetProp]) this[usedSetProp] = new Set();
            const available = pool.filter(item => !this[usedSetProp].has(itemKey(item)));
            const eligible = available.length > 0 ? available : pool;

            // Once every card in this level has been shown, start a new cycle.
            if (available.length === 0) this[usedSetProp].clear();

            const item = eligible[Math.floor(Math.random() * eligible.length)];
            this[usedSetProp].add(itemKey(item));
            this[stateProp].poolSize = pool.length;
            return item;
        },

        [`persist${stem}GamePreferences`]() {
            const difficultySelect = document.getElementById(`${prefix}-difficulty-select`);
            if (difficultySelect) {
                localStorage.setItem(this[difficultyKeyProp], difficultySelect.value);
            }
        },

        [`load${stem}GamePreferences`]() {
            const savedDifficulty = localStorage.getItem(this[difficultyKeyProp]) || 'medium';
            const difficultySelect = document.getElementById(`${prefix}-difficulty-select`);
            if (difficultySelect) difficultySelect.value = savedDifficulty;
            if (this[stateProp]) this[stateProp].difficulty = savedDifficulty;
        },

        [`set${stem}GradeButtons`](enabled) {
            const knewBtn = document.getElementById(`${prefix}-knew-btn`);
            const didntBtn = document.getElementById(`${prefix}-didnt-btn`);
            if (knewBtn) knewBtn.disabled = !enabled;
            if (didntBtn) didntBtn.disabled = !enabled;
        },

        [`reset${stem}Flip`]() {
            const card = document.getElementById(`${prefix}-flip-card`);
            if (card) {
                card.classList.remove('flipped');
                card.removeAttribute('aria-pressed');
            }
            if (this[stateProp]) {
                this[stateProp].revealed = false;
                this[stateProp].graded = false;
            }
            this[`set${stem}GradeButtons`](false);
        },

        [`grade${stem}Card`](knew) {
            if (!this[stateProp] || !this[stateProp][itemProp]) return;
            if (!this[stateProp].revealed || this[stateProp].graded) return;

            this[stateProp].graded = true;
            if (knew) this[stateProp].knewCount += 1;
            else this[stateProp].didntCount += 1;
            buzz(20);

            this[`update${stem}Counters`]();
            this[`set${stem}GradeButtons`](false);

            const statusEl = document.getElementById(`${prefix}-game-status`);
            if (statusEl) {
                statusEl.textContent = gradedStatus(knew);
            }

            // Grading immediately moves to the next card — no "new card" click needed.
            this[`next${stem}Card`]();
        },

        [`update${stem}Counters`]() {
            const st = this[stateProp];
            const countEl = document.getElementById(`${prefix}-game-count`);
            const knewEl = document.getElementById(`${prefix}-game-knew`);
            const didntEl = document.getElementById(`${prefix}-game-didnt`);
            const scoreEl = document.getElementById(`${prefix}-game-score`);

            const answered = st.knewCount + st.didntCount;
            const score = answered ? Math.round((st.knewCount / answered) * 100) : 0;

            if (countEl) countEl.textContent = String(st.seenCount);
            if (knewEl) knewEl.textContent = String(st.knewCount);
            if (didntEl) didntEl.textContent = String(st.didntCount);
            if (scoreEl) scoreEl.textContent = `${score}%`;
        },

        [`start${stem}Game`]() {
            if (!this[stateProp]) this[stateProp] = {};
            this[stateProp].seenCount = 0;
            this[stateProp].knewCount = 0;
            this[stateProp].didntCount = 0;
            this[stateProp].graded = false;
            if (this[usedSetProp]) this[usedSetProp].clear();
            this[`set${stem}GradeButtons`](false);
            this[`update${stem}Counters`]();
            this[`next${stem}Card`]();
        },

        [`next${stem}Card`]() {
            if (this[nextTimerProp]) {
                clearTimeout(this[nextTimerProp]);
                this[nextTimerProp] = null;
            }

            const item = this[`pick${stem}${pickStem}`]();
            if (!item) return;

            this[stateProp][itemProp] = item;
            this[stateProp].seenCount += 1;
            this[`update${stem}Counters`]();

            const nextBtn = document.getElementById(`${prefix}-next-btn`);
            if (nextBtn) nextBtn.disabled = true;

            // If the card is showing the previous answer, flip it back to the clue
            // first and wait for the animation to finish before swapping in the new
            // content — otherwise the next answer flashes on the back mid-flip.
            const card = document.getElementById(`${prefix}-flip-card`);
            const wasFlipped = card && card.classList.contains('flipped');
            this[`reset${stem}Flip`]();

            if (wasFlipped) {
                this[nextTimerProp] = setTimeout(() => {
                    this[nextTimerProp] = null;
                    this[`load${stem}CardContent`]();
                }, 600);
            } else {
                this[`load${stem}CardContent`]();
            }
        },

        [`load${stem}CardContent`]() {
            const item = this[stateProp][itemProp];
            if (!item) return;

            loadContent.call(this, item);

            const statusEl = document.getElementById(`${prefix}-game-status`);
            if (statusEl) statusEl.textContent = idleStatus;

            // The card is ready — allow skipping it with "بطاقة جديدة".
            const nextBtn = document.getElementById(`${prefix}-next-btn`);
            if (nextBtn) nextBtn.disabled = false;
        },

        [`flip${stem}Card`]() {
            if (!this[stateProp] || !this[stateProp][itemProp]) return;

            const card = document.getElementById(`${prefix}-flip-card`);
            if (!card) return;

            card.classList.toggle('flipped');
            const flipped = card.classList.contains('flipped');
            this[stateProp].revealed = flipped;

            const statusEl = document.getElementById(`${prefix}-game-status`);
            if (flipped) {
                card.setAttribute('aria-pressed', 'true');
                const item = this[stateProp][itemProp];
                if (statusEl) statusEl.textContent = flippedStatus(item);
                this[`set${stem}GradeButtons`](true);
            } else {
                card.removeAttribute('aria-pressed');
                if (statusEl) statusEl.textContent = idleStatus;
                this[`set${stem}GradeButtons`](false);
            }
        }
    };
}
