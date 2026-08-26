// "How am I?" (من أنا؟) — flash-card game.
// Each card shows a single clue about a person from the Bible.
// Clicking the card flips it to reveal that person's name.

const WHOAMI_DEFAULT_POOL = [
    { name: 'نوح',             clue: 'بنى سفينة أنجت عائلته والحيوانات من الطوفان.',      category: 'نبي' },
    { name: 'إبراهيم',        clue: 'أبو الأنبياء، وعده الله بذرية كنجوم السماء.',        category: 'نبي' },
    { name: 'موسى',           clue: 'شق الله به البحر وأنقذ شعبه من فرعون.',               category: 'نبي' },
    { name: 'داود',           clue: 'الراعي الذي هزم العملاق جالوت بمقلاعه.',            category: 'ملك' },
    { name: 'سليمان',         clue: 'طلب الحكمة من الله وبنى الهيكل.',                     category: 'ملك' },
    { name: 'يوسف',           clue: 'باعه إخوته حسدًا ثم صار حاكمًا على مصر.',           category: 'نبي' },
    { name: 'يونان',          clue: 'ابتلعه حوت عظيم ومكث في جوفه ثلاثة أيام.',          category: 'نبي' },
    { name: 'أيوب',           clue: 'اشتهر بالصبر على البلاء وقد خسر كل شيء.',            category: 'رجل تقيّ' },
    { name: 'إيليا',          clue: 'النبي الذي صعد إلى السماء في مركبة من نار.',         category: 'نبي' },
    { name: 'هارون',          clue: 'أخو موسى وأول رؤساء الكهنة في بني إسرائيل.',        category: 'كاهن' },
    { name: 'لعازر',          clue: 'أقامه يسوع من الموت بعد أربعة أيام.',                 category: 'صديق يسوع' },
    { name: 'شمشون',          clue: 'كانت قوته الخارقة تكمن في شعره.',                     category: 'قاضٍ' },
    { name: 'زكا',            clue: 'الرجل القصير الذي تسلق شجرة الجميز ليرى يسوع.',     category: 'عشار' },
    { name: 'بطرس',           clue: 'صياد السمك الذي صار رسولًا من أقرب تلاميذ يسوع.',  category: 'رسول' },
    { name: 'بولس',           clue: 'تحول من مضطهد للمسيحيين إلى رسول لهم.',              category: 'رسول' },
    { name: 'يوحنا المعمدان',  clue: 'عمد يسوع في نهر الأردن وأعدّ الطريق له.',           category: 'نبي' },
    { name: 'مريم العذراء',    clue: 'أم المسيح التي اختارها الله لتحمله.',                category: 'امرأة' },
    { name: 'أستير',          clue: 'الملكة التي أنقذت شعبها من الهلاك.',                 category: 'ملكة' },
    { name: 'راعوث',          clue: 'المؤمنة الوفية التي تعلقت بحماتها نعمي.',           category: 'امرأة' },
    { name: 'سارة',           clue: 'زوجة إبراهيم ورزقها الله إسحاق في كبرها.',           category: 'امرأة' }
];

export const whoamiGameMixin = {
    createWhoamiGamePool() {
        return WHOAMI_DEFAULT_POOL.slice();
    },

    pickWhoamiPerson() {
        const pool = this.whoamiGamePool && this.whoamiGamePool.length
            ? this.whoamiGamePool
            : this.createWhoamiGamePool();

        if (!this.whoamiUsedPersons) this.whoamiUsedPersons = new Set();

        const available = pool.filter(person => !this.whoamiUsedPersons.has(person.name));
        const eligible = available.length > 0 ? available : pool;

        // Once every person has been shown, allow a new cycle of cards.
        if (available.length === 0) this.whoamiUsedPersons.clear();

        const person = eligible[Math.floor(Math.random() * eligible.length)];
        this.whoamiUsedPersons.add(person.name);
        return person;
    },

    resetWhoamiFlip() {
        const card = document.getElementById('whoami-flip-card');
        if (card) {
            card.classList.remove('flipped');
            card.removeAttribute('aria-pressed');
        }
        if (this.whoamiGameState) {
            this.whoamiGameState.revealed = false;
            this.whoamiGameState.counted = false;
        }
    },

    updateWhoamiCounters() {
        const st = this.whoamiGameState;
        const countEl = document.getElementById('whoami-game-count');
        const revealedEl = document.getElementById('whoami-game-revealed');
        const scoreEl = document.getElementById('whoami-game-score');

        const total = (this.whoamiGamePool && this.whoamiGamePool.length) || 20;
        const score = total ? Math.round((st.revealedCount / total) * 100) : 0;

        if (countEl) countEl.textContent = String(st.seenCount);
        if (revealedEl) revealedEl.textContent = String(st.revealedCount);
        if (scoreEl) scoreEl.textContent = `${score}%`;
    },

    startWhoamiGame() {
        if (!this.whoamiGameState) this.whoamiGameState = {};
        this.whoamiGameState.seenCount = 0;
        this.whoamiGameState.revealedCount = 0;
        if (this.whoamiUsedPersons) this.whoamiUsedPersons.clear();
        this.updateWhoamiCounters();
        this.nextWhoamiCard();
    },

    nextWhoamiCard() {
        const person = this.pickWhoamiPerson();
        if (!person) return;

        this.whoamiGameState.person = person;
        this.whoamiGameState.seenCount += 1;
        this.updateWhoamiCounters();

        const clueEl = document.getElementById('whoami-game-clue-text');
        const answerEl = document.getElementById('whoami-game-answer');
        const categoryEl = document.getElementById('whoami-game-category');
        const statusEl = document.getElementById('whoami-game-status');
        const nextBtn = document.getElementById('whoami-next-btn');

        if (clueEl) clueEl.textContent = person.clue;
        if (answerEl) answerEl.textContent = person.name;
        if (categoryEl) categoryEl.textContent = person.category;
        if (statusEl) statusEl.textContent = 'اقرأ التلميح ثم اضغط على البطاقة لكشف الاسم.';
        if (nextBtn) nextBtn.disabled = false;

        this.resetWhoamiFlip();
    },

    flipWhoamiCard() {
        if (!this.whoamiGameState || !this.whoamiGameState.person) return;

        const card = document.getElementById('whoami-flip-card');
        if (!card) return;

        card.classList.toggle('flipped');
        const flipped = card.classList.contains('flipped');
        this.whoamiGameState.revealed = flipped;

        const statusEl = document.getElementById('whoami-game-status');
        if (flipped) {
            if (!this.whoamiGameState.counted) {
                this.whoamiGameState.counted = true;
                this.whoamiGameState.revealedCount += 1;
                this.updateWhoamiCounters();
            }
            card.setAttribute('aria-pressed', 'true');
            if (statusEl) statusEl.textContent = `الشخصية هي: ${this.whoamiGameState.person.name}`;
        } else {
            card.removeAttribute('aria-pressed');
            if (statusEl) statusEl.textContent = 'اقرأ التلميح ثم اضغط على البطاقة لكشف الاسم.';
        }
    }
};