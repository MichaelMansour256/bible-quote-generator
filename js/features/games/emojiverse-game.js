import { buzz } from './game-utils.js';

// "EmojiVerse" (إيموجي آية) — emoji flash-card game with difficulty levels.
// The front of each card shows a set of emojis describing a Bible story,
// event, or verse. Clicking the card flips it to reveal the answer plus a
// short story summary.
// Difficulty levels: سهل (easy) / متوسط (medium) / صعب (hard).

// ============================================================
//   Level 1 — سهل (Easy) — well-known stories everyone knows
// ============================================================
const EMOJIVERSE_EASY_POOL = [
    { emojis: '🍎🐍🌳', answer: 'آدم وحواء', story: 'أكلا من شجرة المعرفة في جنة عدن فأُخرجا منها إلى الأرض (تكوين 3).', category: 'قصة', difficulty: 'سهل' },
    { emojis: '🚢🌧️🕊️', answer: 'نوح والطوفان', story: 'بنى نوح السفينة وأنقذ عائلته والحيوانات من مياه الطوفان (تكوين 6–9).', category: 'قصة', difficulty: 'سهل' },
    { emojis: '🌊➗🚶', answer: 'انشقاق البحر الأحمر', story: 'مدّ موسى يده فانشق البحر وعبر شعب الله على اليابسة (خروج 14).', category: 'حدث', difficulty: 'سهل' },
    { emojis: '👶🧺💧', answer: 'موسى في السلة', story: 'وضعته أمه في سلة على النيل فجمعته ابنة فرعون وربّته (خروج 2).', category: 'قصة', difficulty: 'سهل' },
    { emojis: '⛰️📜🪨', answer: 'الوصايا العشر', story: 'أعطى الله موسى الألواح الحجرية على جبل سيناء (خروج 20).', category: 'حدث', difficulty: 'سهل' },
    { emojis: '🐑🩸🚪', answer: 'ليلة عيد الفصح', story: 'دهن إسرائيل الأبواب بدم الحمل ليمرّ الملاك عنهم في مصر (خروج 12).', category: 'حدث', difficulty: 'سهل' },
    { emojis: '👦🪨🎯', answer: 'داود وجليات', story: 'قتل داود العملاق الفلستي بحجر من مقلاعه (1 صموئيل 17).', category: 'قصة', difficulty: 'سهل' },
    { emojis: '🦁🕳️🙏', answer: 'دانيال في جب الأسود', story: 'أُلقي في جب الأسود لصلاته فأغلق الله أفواه الأسود (دانيال 6).', category: 'قصة', difficulty: 'سهل' },
    { emojis: '🐋🌊🙏', answer: 'يونان والحوت', story: 'ابتلعه الحوت ثلاثة أيام بعد هروبه من دعوة الله إلى نينوى (يونان 1–2).', category: 'قصة', difficulty: 'سهل' },
    { emojis: '🐂🔥⚡', answer: 'نار من السماء على الكرمل', story: 'احترقت ذبيحة إيليا المبللة أمام أنبياء البعل (1 ملوك 18).', category: 'حدث', difficulty: 'سهل' },
    { emojis: '🌟👶👑', answer: 'ميلاد يسوع', story: 'وُلد في بيت لحم وسجّدت له المجوس القادمون من الشرق (متى 2 / لوقا 2).', category: 'حدث', difficulty: 'سهل' },
    { emojis: '🍞🐟🍞', answer: 'معجزة الأرغفة والسمك', story: 'أطعم يسوع خمسة آلاف رجل بخمسة أرغف وسمكتين (يوحنا 6).', category: 'معجزة', difficulty: 'سهل' },
    { emojis: '⚰️🌅✨', answer: 'قيامة يسوع', story: 'قام من الموت في اليوم الثالث فوجده القبر فارغًا (متى 28).', category: 'حدث', difficulty: 'سهل' },
    { emojis: '🐑🩸😭', answer: 'قابيل وهابيل', story: 'قتل قابيل أخاه هابيل لأن هديّة هابيل قُبلت وهديّته لم تُقبل (تكوين 4).', category: 'قصة', difficulty: 'سهل' },
    { emojis: '👵🤰🎉', answer: 'ضحك سارة', story: 'وُلد إسحاق لسارة في تسعينها فضحكت فرحًا وقالت: ضحك لي الله (تكوين 21).', category: 'قصة', difficulty: 'سهل' },
    { emojis: '💪✂️👁️', answer: 'شمشون ودليلة', story: 'حلقته دليلة فذهبت قوته التي كانت مرتبطة بنذره (قضاة 16).', category: 'قصة', difficulty: 'سهل' },
    { emojis: '1️⃣🐑99️⃣', answer: 'الخروف الضال', story: 'يترك الراعي تسعين وتسعة ليجد الواحد الضال فيفرح بعودته (لوقا 15).', category: 'مثل', difficulty: 'سهل' },
    { emojis: '🏠🌊🏠', answer: 'البيت على الصخر', story: 'بنى الحكيم بيته على الصخر فلم يسقط عند نزول المطر (متى 7).', category: 'مثل', difficulty: 'سهل' },
    { emojis: '♾️❤️🎁', answer: 'آية يوحنا 3:16', story: 'أعطى الله ابنه الوحيد لكي لا يهلك كل من آمن به بل تكون له الحياة الأبدية (يوحنا 3:16).', category: 'آية', difficulty: 'سهل' },
    { emojis: '🐑🌿💧', answer: 'المزمور 23', story: 'الرب راعيَّ فلا يعوزني شيء — في مراعٍ خضراء يرقدني (مزمور 23:1–2).', category: 'آية', difficulty: 'سهل' },
    { emojis: '🪜☁️😇', answer: 'سلّم يعقوب', story: 'رأى سلّمًا من الأرض إلى السماء وملاكة يصعدون ويهبطون عليه (تكوين 28).', category: 'قصة', difficulty: 'سهل' },
    { emojis: '🧱🗣️🌍', answer: 'برج بابل', story: 'خلط الله لغة البناة فتوقّف بناء البرج وتشتّتوا (تكوين 11).', category: 'قصة', difficulty: 'سهل' },
    { emojis: '🌈☁️🕊️', answer: 'عهد قوس القزح', story: 'وعد الله بعد الطوفان ألا يمسح الأرض بالطوفان مرة أخرى (تكوين 9).', category: 'حدث', difficulty: 'سهل' },
    { emojis: '☁️☀️🔥', answer: 'العمود السحابي والناري', story: 'قاد الله إسرائيل في البرية سحابًا في النهار ونارًا في الليل (خروج 13).', category: 'حدث', difficulty: 'سهل' }
];

// ============================================================
//   Level 2 — متوسط (Medium) — familiar but needs more thought
// ============================================================
const EMOJIVERSE_MEDIUM_POOL = [
    { emojis: '🧱🏰✨', answer: 'بناء هيكل سليمان', story: 'بنى سليمان بيت الرب في أورشليم بلا فأس ولا مطرقة في البناء (1 ملوك 6).', category: 'حدث', difficulty: 'متوسط' },
    { emojis: '💧🍷🥂', answer: 'تحول الماء إلى خمر', story: 'أول معجزات يسوع في عرس قانا الجليل (يوحنا 2).', category: 'معجزة', difficulty: 'متوسط' },
    { emojis: '🛶🌊😴', answer: 'يسوع يهدئ البحر', story: 'نام في المؤخرة ثم نهض وأمّن الريح والموج فصار هدوء عظيم (مرقس 4).', category: 'معجزة', difficulty: 'متوسط' },
    { emojis: '🏜️🍞⬇️', answer: 'المنّ من السماء', story: 'أنزل الله خبز المنّ كل صباح على إسرائيل في البرية (خروج 16).', category: 'معجزة', difficulty: 'متوسط' },
    { emojis: '📯🔊🧱', answer: 'سقوط أسوار أريحا', story: 'دار إسرائيل حول السور سبع مرات فسقط عند الصيحة والبوق (يشوع 6).', category: 'حدث', difficulty: 'متوسط' },
    { emojis: '👑💍✡️', answer: 'أستير ملكة فارس', story: 'مجازفتها أمام الملك أنقذت اليهود من مؤامرة هامان (أستير 4–7).', category: 'قصة', difficulty: 'متوسط' },
    { emojis: '🧍🧍🧍🔥', answer: 'الشدر وميشاخ وعبد نغو', story: 'لم يصبهم في الأتون شيء سوى سقوط أقيالهم (دانيال 3).', category: 'قصة', difficulty: 'متوسط' },
    { emojis: '🌊🚶‍♂️👀', answer: 'بطرس يمشي على الماء', story: 'مشى على الماء نحو يسوع حتى خاف من الريح فشبّد وصرخ (متى 14).', category: 'معجزة', difficulty: 'متوسط' },
    { emojis: '🕊️⬇️🔊', answer: 'معمودية يسوع', story: 'نزل الروح القدس كحمامة وسمع الآب قائلًا: هذا ابني المحبوب (متى 3).', category: 'حدث', difficulty: 'متوسط' },
    { emojis: '🏛️💰🧹', answer: 'تطهير الهيكل', story: 'أخرج يسوع الباعة والمصرفين من هيكل أبيه (يوحنا 2).', category: 'حدث', difficulty: 'متوسط' },
    { emojis: '🧵🏠🛏️', answer: 'المشلول من السقف', story: 'نقب أصدقاؤه السقف وخفضوه إلى يسوع فشُفي من إيمانهم (مرقس 2).', category: 'قصة', difficulty: 'متوسط' },
    { emojis: '🌳🥀☀️', answer: 'لعن شجرة التين', story: 'جفّت الشجرة من الجذور بكلمة واحدة من يسوع (متى 21).', category: 'معجزة', difficulty: 'متوسط' },
    { emojis: '🌾👑👶', answer: 'راعوث', story: 'جمعت سنابل حقول بوعز وصارت زوجة له وجدّة داود (راعوث 1–4).', category: 'قصة', difficulty: 'متوسط' },
    { emojis: '🐎🔥🌪️', answer: 'صعود إيليا', story: 'صعد إيليا إلى السماء بعربة نارية وخيول نارية (2 ملوك 2).', category: 'حدث', difficulty: 'متوسط' },
    { emojis: '🚿👣🧺', answer: 'غسل الأرجل', story: 'غسل يسوع أرجل تلاميذه في العشاء الأخير مثالًا للتواضع (يوحنا 13).', category: 'حدث', difficulty: 'متوسط' },
    { emojis: '⛲🚶‍♀️💧', answer: 'المرأة السامرية', story: 'عرض يسوع عليها الماء الحي عند بئر يعقوب في ظهرة السامرة (يوحنا 4).', category: 'قصة', difficulty: 'متوسط' },
    { emojis: '🐟💰⛵', answer: 'البلال في فم السمكة', story: 'وجد بطرس بلالًا في فم سمكة يدفع به ضريبة الهيكل (متى 17).', category: 'معجزة', difficulty: 'متوسط' },
    { emojis: '🍇📉🌿', answer: 'أنا الكرمة أنتم الأغصان', story: 'كل غصن لا يثمر يُقلع ويُلقى خارجًا ويُجفَّف (يوحنا 15).', category: 'آية', difficulty: 'متوسط' },
    { emojis: '🕯️🌙💧', answer: 'العذارى العشر', story: 'خمس حكيمات ملأن أوانيهن زيتًا وخمس جاهلات فأُغلق عليهن الباب (متى 25).', category: 'مثل', difficulty: 'متوسط' },
    { emojis: '⚡👅🔥', answer: 'يوم الخمسين', story: 'حلّ الروح القدس كألسنة نار على الرسل فتكلموا بلغات أخرى (أعمال 2).', category: 'حدث', difficulty: 'متوسط' }
];

// ============================================================
//   Level 3 — صعب (Hard) — deeper or less familiar references
// ============================================================
const EMOJIVERSE_HARD_POOL = [
    { emojis: '✍️🏛️⚖️', answer: 'الكتابة على الحائط', story: 'قرأ دانيال أمام الملك بلشصر: «مني مني تكل أوفرسين» فسقط ملكه في الليلة (دانيال 5).', category: 'قصة', difficulty: 'صعب' },
    { emojis: '🐄🌾7️⃣', answer: 'حلم فرعون', story: 'فسّر يوسف سبع بقرات وسبع سنابل: سبع سنين وفرة فمجاعة (تكوين 41).', category: 'قصة', difficulty: 'صعب' },
    { emojis: '⛰️🔪🐑', answer: 'إبراهيم وإسحاق على جبل موريا', story: 'أوقفه الملاك عن ذبح ابنه وأُهدي كبشًا للذبح بدلًا منه (تكوين 22).', category: 'قصة', difficulty: 'صعب' },
    { emojis: '📜🔥✍️', answer: 'إرميا وسفره المحروق', story: 'قطع يهوياقيم سفر إرميا وألقاه في النار فأعاده إرميا مكتوبًا مع غيره (إرميا 36).', category: 'قصة', difficulty: 'صعب' },
    { emojis: '🪙🕳️😤', answer: 'الخادم الذي خبأ موهوبته', story: 'خبأ الخادم موهبةً واحدة في الأرض فأخذها منه سيده وأعطاها لغيره (متى 25).', category: 'مثل', difficulty: 'صعب' },
    { emojis: '🩹🫒🪙', answer: 'السامري الخير', story: 'ربط جراح المسافر وسكب زيتًا وخلًا وترك دينارين عند الساقي (لوقا 10).', category: 'مثل', difficulty: 'صعب' },
    { emojis: '🐦🪶⚖️', answer: 'عصفوران بفلس', story: 'لا يُباع عصفوران بفلس، ولم تكن منهن واحدة تسقط عن علم الآب (متى 10:29).', category: 'آية', difficulty: 'صعب' },
    { emojis: '🩸🤲🧵', answer: 'المرأة المصابة بالدماء', story: 'لمست حاشية ثوب يسوع فحلّ لها النزف من إيمانها فورًا (مرقس 5).', category: 'معجزة', difficulty: 'صعب' },
    { emojis: '⛰️✨🧔', answer: 'تجليل وجه يسوع', story: 'لمع وجهه مثل الشمس وظهر موسى وإيليا يتحدثان معه (متى 17).', category: 'حدث', difficulty: 'صعب' },
    { emojis: '🦴🦴💨', answer: 'وادي العظام اليابسة', story: 'قامت العظام في رؤية حزقيال لحمًا وعرقًا فصار جيشًا حيًّا عظيمًا (حزقيال 37).', category: 'رؤية', difficulty: 'صعب' },
    { emojis: '🍞🍷🧔', answer: 'العشاء الرباني', story: 'أخذ يسوع الخبز والكأس في ليلة التسليم ووزّعهما على تلاميذه (لوقا 22).', category: 'حدث', difficulty: 'صعب' },
    { emojis: '⛺🍖3️⃣', answer: 'ضيافة إبراهيم', story: 'استقبل ثلاثة رجال عند شجرة الملكة وسارع بإعداد خير عجل (تكوين 18).', category: 'قصة', difficulty: 'صعب' },
    { emojis: '🗿💎🌱', answer: 'تمثال دانيال والحجر', story: 'سُحق التمثال بحجر غير مصنوع فصار جبلًا ملأ الأرض كلها (دانيال 2).', category: 'رؤية', difficulty: 'صعب' },
    { emojis: '🚪🐑🐑', answer: 'أنا الباب للأغنام', story: '«أنا هو الباب؛ إن دخل بي فسيُخلَّص» — يسوع هو الباب والراعي الصالح (يوحنا 10).', category: 'آية', difficulty: 'صعب' },
    { emojis: '🌑🦗🐸', answer: 'أمراض مصر العشر', story: 'دم وضفادع وقمل وجراد وظلام فأطلق فرعون شعب الله (خروج 7–12).', category: 'حدث', difficulty: 'صعب' },
    { emojis: '🪨💧🚶', answer: 'موسى يضرب الصخرة', story: 'خرج ماء من الصخرة في رفيدم ليسقي الشعب كله (خروج 17).', category: 'معجزة', difficulty: 'صعب' },
    { emojis: '🕯️👣📖', answer: 'سراجٌ لرجليَّ كلامك', story: '«سراج لرجلي كلامك ونور لسبيلي» — كلمة الله تضرب به الخطى (مزمور 119:105).', category: 'آية', difficulty: 'صعب' },
    { emojis: '🌱🪨🌵🌾', answer: 'البذرة والتراب', story: 'سقطت البذور على طريق وعلى صخور وعلى أشواك وعلى تراب صالحًا (مرقس 4).', category: 'مثل', difficulty: 'صعب' }
];

const EMOJIVERSE_LEVEL_TO_ARABIC = { easy: 'سهل', medium: 'متوسط', hard: 'صعب' };

const EMOJIVERSE_DEFAULT_POOL = [
    ...EMOJIVERSE_EASY_POOL,
    ...EMOJIVERSE_MEDIUM_POOL,
    ...EMOJIVERSE_HARD_POOL
];

export const emojiverseGameMixin = {
    createEmojiverseGamePool() {
        return EMOJIVERSE_DEFAULT_POOL.slice();
    },

    getEmojiverseDifficulty(difficulty) {
        const normalized = (difficulty || 'medium').toLowerCase().trim() || 'medium';
        return EMOJIVERSE_LEVEL_TO_ARABIC[normalized] || 'متوسط';
    },

    buildEmojiverseGamePool(difficulty = 'medium') {
        const sourcePool = this.emojiverseGamePool && this.emojiverseGamePool.length
            ? this.emojiverseGamePool
            : this.createEmojiverseGamePool();
        const targetLevel = this.getEmojiverseDifficulty(difficulty);
        const filtered = sourcePool.filter(card => card.difficulty === targetLevel);
        return filtered.length > 0 ? filtered : sourcePool;
    },

    pickEmojiverseCard() {
        const select = document.getElementById('emojiverse-difficulty-select');
        const difficulty = (select && select.value) || 'medium';
        const pool = this.buildEmojiverseGamePool(difficulty);
        if (!pool.length) return null;

        if (!this.emojiverseUsedCards) this.emojiverseUsedCards = new Set();
        const available = pool.filter(card => !this.emojiverseUsedCards.has(card.emojis + card.answer));
        const eligible = available.length > 0 ? available : pool;

        // Once every card in this level has been shown, start a new cycle.
        if (available.length === 0) this.emojiverseUsedCards.clear();

        const card = eligible[Math.floor(Math.random() * eligible.length)];
        this.emojiverseUsedCards.add(card.emojis + card.answer);
        this.emojiverseGameState.poolSize = pool.length;
        return card;
    },

    persistEmojiverseGamePreferences() {
        const difficultySelect = document.getElementById('emojiverse-difficulty-select');
        if (difficultySelect) {
            localStorage.setItem(this.emojiverseGameDifficultyKey, difficultySelect.value);
        }
    },

    loadEmojiverseGamePreferences() {
        const savedDifficulty = localStorage.getItem(this.emojiverseGameDifficultyKey) || 'medium';
        const difficultySelect = document.getElementById('emojiverse-difficulty-select');
        if (difficultySelect) difficultySelect.value = savedDifficulty;
        if (this.emojiverseGameState) this.emojiverseGameState.difficulty = savedDifficulty;
    },

    setEmojiverseGradeButtons(enabled) {
        const knewBtn = document.getElementById('emojiverse-knew-btn');
        const didntBtn = document.getElementById('emojiverse-didnt-btn');
        if (knewBtn) knewBtn.disabled = !enabled;
        if (didntBtn) didntBtn.disabled = !enabled;
    },

    resetEmojiverseFlip() {
        const card = document.getElementById('emojiverse-flip-card');
        if (card) {
            card.classList.remove('flipped');
            card.removeAttribute('aria-pressed');
        }
        if (this.emojiverseGameState) {
            this.emojiverseGameState.revealed = false;
            this.emojiverseGameState.graded = false;
        }
        this.setEmojiverseGradeButtons(false);
    },

    gradeEmojiverseCard(knew) {
        if (!this.emojiverseGameState || !this.emojiverseGameState.card) return;
        if (!this.emojiverseGameState.revealed || this.emojiverseGameState.graded) return;

        this.emojiverseGameState.graded = true;
        if (knew) this.emojiverseGameState.knewCount += 1;
        else this.emojiverseGameState.didntCount += 1;
        buzz(20);

        this.updateEmojiverseCounters();
        this.setEmojiverseGradeButtons(false);

        const statusEl = document.getElementById('emojiverse-game-status');
        if (statusEl) {
            statusEl.textContent = knew
                ? 'أحسنت! احتسبت هذه البطاقة ضمن من عرفتها.'
                : 'لا بأس، ستتعرف على هذه القصة في المرة القادمة.';
        }

        // Grading immediately moves to the next card — no "new card" click needed.
        this.nextEmojiverseCard();
    },

    updateEmojiverseCounters() {
        const st = this.emojiverseGameState;
        const countEl = document.getElementById('emojiverse-game-count');
        const knewEl = document.getElementById('emojiverse-game-knew');
        const didntEl = document.getElementById('emojiverse-game-didnt');
        const scoreEl = document.getElementById('emojiverse-game-score');

        const answered = st.knewCount + st.didntCount;
        const score = answered ? Math.round((st.knewCount / answered) * 100) : 0;

        if (countEl) countEl.textContent = String(st.seenCount);
        if (knewEl) knewEl.textContent = String(st.knewCount);
        if (didntEl) didntEl.textContent = String(st.didntCount);
        if (scoreEl) scoreEl.textContent = `${score}%`;
    },

    startEmojiverseGame() {
        if (!this.emojiverseGameState) this.emojiverseGameState = {};
        this.emojiverseGameState.seenCount = 0;
        this.emojiverseGameState.knewCount = 0;
        this.emojiverseGameState.didntCount = 0;
        this.emojiverseGameState.graded = false;
        if (this.emojiverseUsedCards) this.emojiverseUsedCards.clear();
        this.setEmojiverseGradeButtons(false);
        this.updateEmojiverseCounters();
        this.nextEmojiverseCard();
    },

    nextEmojiverseCard() {
        if (this.emojiverseNextTimer) {
            clearTimeout(this.emojiverseNextTimer);
            this.emojiverseNextTimer = null;
        }

        const card = this.pickEmojiverseCard();
        if (!card) return;

        this.emojiverseGameState.card = card;
        this.emojiverseGameState.seenCount += 1;
        this.updateEmojiverseCounters();

        const nextBtn = document.getElementById('emojiverse-next-btn');
        if (nextBtn) nextBtn.disabled = true;

        // If the card is showing the previous answer, flip it back to the emojis
        // first and wait for the animation to finish before swapping in the new
        // content — otherwise the next answer flashes on the back mid-flip.
        const flipCard = document.getElementById('emojiverse-flip-card');
        const wasFlipped = flipCard && flipCard.classList.contains('flipped');
        this.resetEmojiverseFlip();

        if (wasFlipped) {
            this.emojiverseNextTimer = setTimeout(() => {
                this.emojiverseNextTimer = null;
                this.loadEmojiverseCardContent();
            }, 600);
        } else {
            this.loadEmojiverseCardContent();
        }
    },

    loadEmojiverseCardContent() {
        const card = this.emojiverseGameState.card;
        if (!card) return;

        const emojiEl = document.getElementById('emojiverse-game-emoji');
        const answerEl = document.getElementById('emojiverse-game-answer');
        const storyEl = document.getElementById('emojiverse-game-story');
        const categoryEl = document.getElementById('emojiverse-game-category');
        const statusEl = document.getElementById('emojiverse-game-status');

        if (emojiEl) emojiEl.textContent = card.emojis;
        if (answerEl) answerEl.textContent = card.answer;
        if (storyEl) storyEl.textContent = card.story;
        if (categoryEl) categoryEl.textContent = card.category;
        if (statusEl) statusEl.textContent = 'اقرأ الإيموجي وقلّب البطاقة، ثم حدّد: هل عرفتها؟';

        // The card is ready — allow skipping it with "بطاقة جديدة".
        const nextBtn = document.getElementById('emojiverse-next-btn');
        if (nextBtn) nextBtn.disabled = false;
    },

    flipEmojiverseCard() {
        if (!this.emojiverseGameState || !this.emojiverseGameState.card) return;

        const card = document.getElementById('emojiverse-flip-card');
        if (!card) return;

        card.classList.toggle('flipped');
        const flipped = card.classList.contains('flipped');
        this.emojiverseGameState.revealed = flipped;

        const statusEl = document.getElementById('emojiverse-game-status');
        if (flipped) {
            card.setAttribute('aria-pressed', 'true');
            if (statusEl) statusEl.textContent = `الإجابة: ${this.emojiverseGameState.card.answer} — اسحب البطاقة يسارًا (عرفتها) أو يمينًا (لم أعرفها).`;
            this.setEmojiverseGradeButtons(true);
        } else {
            card.removeAttribute('aria-pressed');
            if (statusEl) statusEl.textContent = 'اقرأ الإيموجي وقلّب البطاقة، ثم حدّد: هل عرفتها؟';
            this.setEmojiverseGradeButtons(false);
        }
    }
};






