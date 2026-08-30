export function normalizeArabicForMatch(text) {
    return String(text || '')
        .normalize('NFKD')
        .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
        .replace(/[أإآٱ]/g, 'ا')
        .replace(/ى/g, 'ي')
        .replace(/ة/g, 'ه')
        .replace(/ؤ/g, 'و')
        .replace(/ئ/g, 'ي');
}

export function normalizeArabicDigits(text) {
    return String(text || '').replace(/[٠-٩]/g, digit => '٠١٢٣٤٥٦٧٨٩'.indexOf(digit).toString());
}

export function normalizeGameText(text) {
    return normalizeArabicForMatch(text)
        .replace(/[\u060C\u061B\u061F\.,!?:;"'()\[\]{}«»ـ]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
}

export function normalizeAnswerText(text) {
    return normalizeGameText(normalizeArabicDigits(text));
}

export function getAnswerVariants(text) {
    const normalized = normalizeAnswerText(text);
    const variants = new Set([normalized]);

    if (normalized.startsWith('ال') && normalized.length > 2) {
        variants.add(normalized.slice(2));
    }

    if (normalized.startsWith('سفر ')) {
        variants.add(normalized.replace(/^سفر\s+/, ''));
    }

    if (normalized.startsWith('كتاب ')) {
        variants.add(normalized.replace(/^كتاب\s+/, ''));
    }

    const words = normalized.split(' ');
    if (words.length > 1 && words[0] === 'ال') {
        variants.add(words.slice(1).join(' '));
    }

    return Array.from(variants).filter(Boolean);
}

export function reverseCharacters(text) {
    return Array.from(String(text || '').replace(/\s+/g, ' ').trim()).reverse().join('');
}

export function scrambleWord(word) {
    const letters = Array.from(String(word || '').replace(/\s+/g, ' ').trim()).filter(Boolean);
    if (letters.length <= 2) {
        return letters.join('');
    }

    for (let attempt = 0; attempt < 8; attempt += 1) {
        const shuffled = [...letters].sort(() => Math.random() - 0.5).join('');
        if (shuffled !== letters.join('')) {
            return shuffled;
        }
    }

    return letters.reverse().join('');
}

export function scrambleText(text) {
    return String(text || '')
        .split(/(\s+)/)
        .map(part => (part.trim() ? scrambleWord(part) : part))
        .join('')
        .trim();
}

export function getDifficultyRank(difficulty) {
    switch (difficulty) {
        case 'easy':
            return 0;
        case 'hard':
            return 2;
        case 'expert':
            return 3;
        case 'medium':
        default:
            return 1;
    }
}

export function createBibleTermPools() {
    const bookNames = (typeof bibleDatabase !== 'undefined' && Array.isArray(bibleDatabase.books))
        ? bibleDatabase.books.map(book => book.name)
        : [
            'تكوين', 'خروج', 'لاويين', 'عدد', 'تثنية', 'يشوع', 'القضاة', 'راعوث',
            '1 صموئيل', '2 صموئيل', '1 الملوك', '2 الملوك', '1 أخبار الأيام', '2 أخبار الأيام',
            'عزرا', 'نحميا', 'أستير', 'أيوب', 'المزامير', 'الأمثال', 'الجامعة',
            'نشيد الأنشاد', 'إشعياء', 'إرميا', 'مراثي إرميا', 'حزقيال', 'دانيال', 'هوشع', 'يوئيل',
            'عاموس', 'عوبديا', 'يونان', 'ميخا', 'ناحوم', 'حبقوق', 'صفنيا', 'حجي', 'زكريا', 'ملاخي',
            'متى', 'مرقس', 'لوقا', 'يوحنا', 'أعمال الرسل', 'رومية', '1 كورنثوس', '2 كورنثوس',
            'غلاطية', 'أفسس', 'فيليبي', 'كولوسي', '1 تسالونيكي', '2 تسالونيكي', '1 تيموثاوس',
            '2 تيموثاوس', 'تيطس', 'فليمون', 'عبرانيين', 'يعقوب', '1 بطرس', '2 بطرس',
            '1 يوحنا', '2 يوحنا', '3 يوحنا', 'يهوذا', 'الرؤيا'
        ];

    return {
        books: Array.from(new Set(bookNames.map(term => ({ term, aliases: [`سفر ${term}`], difficulty: 'easy' })))),
        names: [
            { term: 'إبراهيم', aliases: ['أبرام', 'إبراهام'], difficulty: 'easy' },
            { term: 'إسحاق', aliases: ['اسحق'], difficulty: 'easy' },
            { term: 'يعقوب', aliases: ['إسرائيل'], difficulty: 'easy' },
            { term: 'يوسف', aliases: ['يوسف الصديق'], difficulty: 'easy' },
            { term: 'موسى', aliases: ['موسى النبي'], difficulty: 'easy' },
            { term: 'هارون', aliases: ['هارون الكاهن'], difficulty: 'easy' },
            { term: 'داود', aliases: ['داود الملك'], difficulty: 'easy' },
            { term: 'سليمان', aliases: ['سليمان الحكيم'], difficulty: 'easy' },
            { term: 'يوشع', aliases: ['يشوع بن نون'], difficulty: 'medium' },
            { term: 'صموئيل', aliases: ['صموئيل النبي'], difficulty: 'medium' },
            { term: 'إيليا', aliases: ['إيليا التشبي'], difficulty: 'medium' },
            { term: 'إليشع', aliases: ['أليشع'], difficulty: 'medium' },
            { term: 'إشعياء', aliases: ['النبي إشعياء'], difficulty: 'medium' },
            { term: 'إرميا', aliases: ['النبي إرميا'], difficulty: 'medium' },
            { term: 'حزقيال', aliases: ['النبي حزقيال'], difficulty: 'medium' },
            { term: 'دانيال', aliases: ['النبي دانيال'], difficulty: 'medium' },
            { term: 'عزرا', aliases: ['الكاتب عزرا'], difficulty: 'medium' },
            { term: 'نحميا', aliases: ['القائد نحميا'], difficulty: 'medium' },
            { term: 'أستير', aliases: ['الملكة أستير'], difficulty: 'medium' },
            { term: 'مريم المجدلية', aliases: ['مجدلية', 'مريم من المجدل'], difficulty: 'hard' },
            { term: 'مريم العذراء', aliases: ['العذراء مريم', 'مريم أم يسوع'], difficulty: 'hard' },
            { term: 'يوحنا المعمدان', aliases: ['يوحنا المعمداني', 'يحيى'], difficulty: 'hard' },
            { term: 'برنابا', aliases: ['يوسف برنابا'], difficulty: 'hard' },
            { term: 'تيموثاوس', aliases: ['الابن تيموثاوس'], difficulty: 'hard' },
            { term: 'مردخاي', aliases: ['مردخاي اليهودي'], difficulty: 'hard' },
            { term: 'أبيجايل', aliases: ['أبيجايل الحكيمة'], difficulty: 'hard' },
            { term: 'راحيل', aliases: ['راحيل زوجة يعقوب'], difficulty: 'hard' },
            { term: 'ليئة', aliases: ['ليئة زوجة يعقوب'], difficulty: 'hard' },
            { term: 'دبورة', aliases: ['دبورة النبية'], difficulty: 'hard' },
            { term: 'إبراهيم الخليل', aliases: ['خليل الله'], difficulty: 'expert' },
            { term: 'إسحاق بن إبراهيم', aliases: ['ابن الموعد'], difficulty: 'expert' }
        ],
        places: [
            { term: 'أورشليم', aliases: ['القدس'], difficulty: 'easy' },
            { term: 'بيت لحم', aliases: ['بيت لحم اليهودية'], difficulty: 'easy' },
            { term: 'الناصرة', aliases: ['ناصرة الجليل'], difficulty: 'easy' },
            { term: 'الجليل', aliases: ['الجليل الأعلى'], difficulty: 'easy' },
            { term: 'أريحا', aliases: ['مدينة أريحا'], difficulty: 'easy' },
            { term: 'السامرة', aliases: ['أرض السامرة'], difficulty: 'easy' },
            { term: 'بيت إيل', aliases: ['بيت ايل'], difficulty: 'medium' },
            { term: 'بيت عنيا', aliases: ['بيت عنيا قرب أورشليم'], difficulty: 'medium' },
            { term: 'بيت صيدا', aliases: ['بيت صيدا الجليل'], difficulty: 'medium' },
            { term: 'كفرناحوم', aliases: ['كفر ناحوم'], difficulty: 'medium' },
            { term: 'أورشليم الجديدة', aliases: ['المدينة المقدسة', 'المدينة الجديدة'], difficulty: 'hard' },
            { term: 'بيت فاجي', aliases: ['بيت فاجي وبيت عنيا'], difficulty: 'hard' },
            { term: 'قانا الجليل', aliases: ['قانا'], difficulty: 'hard' },
            { term: 'نهر الأردن', aliases: ['الأردن', 'نهر الأردن'], difficulty: 'hard' },
            { term: 'بحر الجليل', aliases: ['بحيرة الجليل'], difficulty: 'hard' },
            { term: 'بحر الميت', aliases: ['البحر الميت'], difficulty: 'hard' },
            { term: 'جبل الزيتون', aliases: ['جبل الزيتون الشرقي'], difficulty: 'hard' },
            { term: 'جبل الكرمل', aliases: ['الكرمل'], difficulty: 'hard' },
            { term: 'جبل سيناء', aliases: ['سيناء'], difficulty: 'expert' },
            { term: 'جبل حوريب', aliases: ['حوريب'], difficulty: 'expert' },
            { term: 'أنطاكية', aliases: ['أنطاكية السورية'], difficulty: 'expert' },
            { term: 'أفسس', aliases: ['مدينة أفسس'], difficulty: 'expert' },
            { term: 'كورنثوس', aliases: ['كورنثوس اليونانية'], difficulty: 'expert' },
            { term: 'رومية', aliases: ['مدينة رومية'], difficulty: 'expert' },
            { term: 'أثينا', aliases: ['أثينا اليونانية'], difficulty: 'expert' },
            { term: 'فيليبي', aliases: ['مدينة فيليبي'], difficulty: 'hard' },
            { term: 'تسالونيكي', aliases: ['تسالونيكي اليونانية'], difficulty: 'hard' },
            { term: 'بابل', aliases: ['مدينة بابل'], difficulty: 'medium' },
            { term: 'نينوى', aliases: ['نينوى العظيمة'], difficulty: 'medium' },
            { term: 'مصر', aliases: ['أرض مصر'], difficulty: 'easy' },
            { term: 'بئر سبع', aliases: ['بئر سبع الجنوبية'], difficulty: 'hard' },
            { term: 'شكيم', aliases: ['مدينة شكيم'], difficulty: 'hard' },
            { term: 'حبرون', aliases: ['مدينة حبرون'], difficulty: 'hard' },
            { term: 'صهيون', aliases: ['جبل صهيون', 'جبل الهيكل'], difficulty: 'medium' },
            { term: 'جلجثة', aliases: ['جلجثة الصليب'], difficulty: 'medium' },
            { term: 'جثسيماني', aliases: ['بستان جثسيماني'], difficulty: 'medium' },
            { term: 'فيلادلفيا', aliases: ['فيلادلفيا آسيا'], difficulty: 'hard' },
            { term: 'لاودكية', aliases: ['لاوديكية'], difficulty: 'hard' },
            { term: 'سميرنا', aliases: ['إزمير'], difficulty: 'hard' },
            { term: 'برغامس', aliases: ['برغامس آسيا'], difficulty: 'hard' },
            { term: 'ساردس', aliases: ['ساردس آسيا'], difficulty: 'hard' }
        ],
        prophets: [
            { term: 'نوح', aliases: ['النبي نوح'], difficulty: 'easy' },
            { term: 'أخنوخ', aliases: ['إدريس'], difficulty: 'medium' },
            { term: 'هود', aliases: ['هود النبي'], difficulty: 'easy' },
            { term: 'لوط', aliases: ['لوط النبي'], difficulty: 'easy' },
            { term: 'إسماعيل', aliases: ['إسماعيل بن إبراهيم'], difficulty: 'medium' },
            { term: 'أيوب', aliases: ['الصديق أيوب'], difficulty: 'easy' },
            { term: 'هوشع', aliases: ['النبي هوشع'], difficulty: 'medium' },
            { term: 'يوئيل', aliases: ['النبي يوئيل'], difficulty: 'medium' },
            { term: 'عاموس', aliases: ['النبي عاموس'], difficulty: 'medium' },
            { term: 'عوبديا', aliases: ['النبي عوبديا'], difficulty: 'medium' },
            { term: 'يونان', aliases: ['النبي يونان'], difficulty: 'easy' },
            { term: 'ميخا', aliases: ['النبي ميخا'], difficulty: 'medium' },
            { term: 'ناحوم', aliases: ['النبي ناحوم'], difficulty: 'medium' },
            { term: 'حبقوق', aliases: ['النبي حبقوق'], difficulty: 'medium' },
            { term: 'صفنيا', aliases: ['النبي صفنيا'], difficulty: 'medium' },
            { term: 'حجي', aliases: ['النبي حجي'], difficulty: 'medium' },
            { term: 'زكريا', aliases: ['زكريا النبي'], difficulty: 'medium' },
            { term: 'ملاخي', aliases: ['النبي ملاخي'], difficulty: 'medium' },
            { term: 'يوحنا المعمدان', aliases: ['يوحنا المعمداني', 'يحيى'], difficulty: 'medium' }
        ],
        kings: [
            { term: 'شاول', aliases: ['شاول الملك'], difficulty: 'easy' },
            { term: 'رحبعام', aliases: ['رحبعام بن سليمان'], difficulty: 'hard' },
            { term: 'آسا', aliases: ['آسا ملك يهوذا'], difficulty: 'medium' },
            { term: 'يهوشافاط', aliases: ['يهوشافاط الملك'], difficulty: 'hard' },
            { term: 'يوآش', aliases: ['يوآش الملك'], difficulty: 'hard' },
            { term: 'عزيا', aliases: ['عزيا الملك'], difficulty: 'medium' },
            { term: 'يوثام', aliases: ['يوثام الملك'], difficulty: 'hard' },
            { term: 'آحاز', aliases: ['آحاز الملك'], difficulty: 'medium' },
            { term: 'حزقيا', aliases: ['حزقيا الملك'], difficulty: 'medium' },
            { term: 'منسى الملك', aliases: ['منسى ملك يهوذا'], difficulty: 'medium' },
            { term: 'يوشيا', aliases: ['يوشيا الملك'], difficulty: 'medium' },
            { term: 'يهوياقيم', aliases: ['يهوياقيم الملك'], difficulty: 'hard' },
            { term: 'صدقيا', aliases: ['صدقيا الملك'], difficulty: 'hard' },
            { term: 'يربععام', aliases: ['يربععام الأول'], difficulty: 'hard' },
            { term: 'بعشا', aliases: ['بعشا ملك إسرائيل'], difficulty: 'hard' },
            { term: 'عمري', aliases: ['عمري ملك إسرائيل'], difficulty: 'hard' },
            { term: 'أهاب', aliases: ['أخاب الملك'], difficulty: 'hard' },
            { term: 'ياهو', aliases: ['ياهو الملك'], difficulty: 'hard' },
            { term: 'منحيم', aliases: ['منحيم ملك إسرائيل'], difficulty: 'expert' },
            { term: 'فقح', aliases: ['فقح ملك إسرائيل'], difficulty: 'expert' },
            { term: 'هوشع بن إيلة', aliases: ['هوشع ملك إسرائيل'], difficulty: 'expert' }
        ],
        women: [
            { term: 'حواء', aliases: ['أم كل حي'], difficulty: 'easy' },
            { term: 'سارة', aliases: ['سارة زوجة إبراهيم'], difficulty: 'easy' },
            { term: 'هاجر', aliases: ['هاجر المصرية'], difficulty: 'easy' },
            { term: 'رفقة', aliases: ['رفقة زوجة إسحاق'], difficulty: 'easy' },
            { term: 'راعوث', aliases: ['راعوث الموآبية'], difficulty: 'easy' },
            { term: 'نعمي', aliases: ['نعمي الحماة'], difficulty: 'medium' },
            { term: 'حنة', aliases: ['حنة أم صموئيل'], difficulty: 'medium' },
            { term: 'رحاب', aliases: ['راحاب الزانية'], difficulty: 'medium' },
            { term: 'يائيل', aliases: ['يائيل زوجة حابر'], difficulty: 'hard' },
            { term: 'يوكابد', aliases: ['يوكابد أم موسى'], difficulty: 'hard' },
            { term: 'مريم أخت موسى', aliases: ['مريم النبية'], difficulty: 'hard' },
            { term: 'مَرثا', aliases: ['مرثا أخت لعازر'], difficulty: 'easy' },
            { term: 'ليديا', aliases: ['ليديا بائعة الأرجوان'], difficulty: 'hard' },
            { term: 'بريسكلا', aliases: ['بريسكلا زوجة أكيلا'], difficulty: 'expert' },
            { term: 'فبي', aliases: ['فبي الخادمة'], difficulty: 'expert' },
            { term: 'أبيجايل', aliases: ['أبيجايل الحكيمة'], difficulty: 'hard' }
        ],
        tribes: [
            { term: 'رأوبين', aliases: ['سبط رأوبين'], difficulty: 'easy' },
            { term: 'شمعون', aliases: ['سبط شمعون'], difficulty: 'easy' },
            { term: 'لاوي', aliases: ['سبط لاوي'], difficulty: 'easy' },
            { term: 'يهوذا', aliases: ['سبط يهوذا'], difficulty: 'easy' },
            { term: 'دان', aliases: ['سبط دان'], difficulty: 'easy' },
            { term: 'نفتالي', aliases: ['سبط نفتالي'], difficulty: 'easy' },
            { term: 'جاد', aliases: ['سبط جاد'], difficulty: 'easy' },
            { term: 'أشير', aliases: ['سبط أشير'], difficulty: 'easy' },
            { term: 'يساكر', aliases: ['سبط يساكر'], difficulty: 'easy' },
            { term: 'زبولون', aliases: ['سبط زبولون'], difficulty: 'easy' },
            { term: 'بنيامين', aliases: ['سبط بنيامين'], difficulty: 'easy' },
            { term: 'أفرايم', aliases: ['سبط أفرايم'], difficulty: 'medium' },
            { term: 'منسى', aliases: ['سبط منسى'], difficulty: 'medium' }
        ],
        feasts: [
            { term: 'الفصح', aliases: ['عيد الفصح'], difficulty: 'easy' },
            { term: 'الفطير', aliases: ['عيد الفطير'], difficulty: 'easy' },
            { term: 'الخمسين', aliases: ['عيد الخمسين', 'عيد العنصرة'], difficulty: 'medium' },
            { term: 'الأبواق', aliases: ['عيد الأبواق'], difficulty: 'hard' },
            { term: 'الكفارة', aliases: ['يوم الكفارة', 'يوم الغفران'], difficulty: 'medium' },
            { term: 'المظال', aliases: ['عيد المظال'], difficulty: 'hard' },
            { term: 'السبت', aliases: ['يوم السبت'], difficulty: 'easy' },
            { term: 'التقديس', aliases: ['عيد التقديس'], difficulty: 'expert' },
            { term: 'البوريم', aliases: ['عيد البوريم', 'عيد المساخر'], difficulty: 'expert' }
        ],
        artifacts: [
            { term: 'تابوت العهد', aliases: ['تابوت الرب', 'الصندوق المقدس'], difficulty: 'medium' },
            { term: 'المنارة', aliases: ['منارة الهيكل'], difficulty: 'medium' },
            { term: 'مذبح', aliases: ['مذبح المحرقة'], difficulty: 'medium' },
            { term: 'مائدة الخبز', aliases: ['مائدة خبز الوجوه'], difficulty: 'hard' },
            { term: 'مبخرة', aliases: ['مبخرة البخور'], difficulty: 'hard' },
            { term: 'عصا هارون', aliases: ['عصا هارون المزهرة'], difficulty: 'medium' },
            { term: 'لوحا الشهادة', aliases: ['لوحا الوصايا'], difficulty: 'hard' },
            { term: 'قدس الأقداس', aliases: ['المكان الأقدس'], difficulty: 'medium' }
        ]
    };
}

export function matchesDifficulty(entry, difficulty) {
    const wordCount = entry.term.split(/\s+/).filter(Boolean).length;

    if (difficulty === 'easy') {
        return entry.difficulty === 'easy' || wordCount === 1;
    }

    if (difficulty === 'medium') {
        return getDifficultyRank(entry.difficulty) <= 1;
    }

    if (difficulty === 'hard') {
        return getDifficultyRank(entry.difficulty) >= 1 && wordCount >= 2;
    }

    return entry.difficulty === 'expert' || wordCount >= 3 || entry.term.length >= 10;
}

export function buildTermPool(pools, category, difficulty = 'medium') {
    const terms = [];
    const pushEntries = (entries, label) => {
        entries
            .filter(entry => matchesDifficulty(entry, difficulty))
            .forEach(entry => {
                const answers = new Set([
                    ...getAnswerVariants(entry.term),
                    ...(entry.aliases || []).flatMap(alias => getAnswerVariants(alias))
                ]);

                terms.push({
                    term: entry.term,
                    category: label,
                    difficulty: entry.difficulty || difficulty,
                    answers: Array.from(answers)
                });
            });
    };

    if (category === 'book' || category === 'random') {
        pushEntries(pools.books, 'اسم سفر');
    }

    if (category === 'name' || category === 'random') {
        pushEntries(pools.names, 'اسم');
    }

    if (category === 'place' || category === 'random') {
        pushEntries(pools.places, 'مكان');
    }

    if (category === 'prophet' || category === 'random') {
        pushEntries(pools.prophets, 'نبي');
    }

    if (category === 'king' || category === 'random') {
        pushEntries(pools.kings, 'ملك');
    }

    if (category === 'woman' || category === 'random') {
        pushEntries(pools.women, 'امرأة');
    }

    if (category === 'tribe' || category === 'random') {
        pushEntries(pools.tribes, 'سبط');
    }

    if (category === 'feast' || category === 'random') {
        pushEntries(pools.feasts, 'عيد');
    }

    if (category === 'artifact' || category === 'random') {
        pushEntries(pools.artifacts, 'أداة مقدسة');
    }

    return terms;
}

// ── HolyWordle helpers ──────────────────────────────────────────────────────

// Letter count used for word-length matching: diacritics/tatweel stripped and
// Arabic letters folded to their base forms (أ→ا, ة→ه, …) so the count always
// matches what the board compares against.
export function getWordleLetterCount(word) {
    return Array.from(normalizeArabicForMatch(String(word || '').replace(/\s+/g, ''))).length;
}

// Letters as written by the user (keeps hamza/taa-marbuta spellings) with only
// diacritics removed, so tiles render familiar Arabic while comparisons stay
// on the normalized forms.
export function getWordleDisplayLetters(word) {
    return Array.from(
        String(word || '').replace(/\s+/g, '').replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    );
}

// Standard Wordle evaluation with duplicate-letter handling:
// 'correct' = right letter, right spot; 'present' = letter exists elsewhere;
// 'absent' = letter not in the word (or already fully accounted for).
export function evaluateWordleGuess(guessLetters, targetLetters) {
    const guess = Array.from(guessLetters || []);
    const target = Array.from(targetLetters || []);
    const result = new Array(guess.length).fill('absent');
    const remaining = new Map();

    target.forEach((letter, index) => {
        if (index < guess.length && guess[index] === letter) {
            result[index] = 'correct';
        } else {
            remaining.set(letter, (remaining.get(letter) || 0) + 1);
        }
    });

    guess.forEach((letter, index) => {
        if (result[index] === 'correct') return;
        const left = remaining.get(letter) || 0;
        if (left > 0) {
            result[index] = 'present';
            remaining.set(letter, left - 1);
        }
    });

    return result;
}

// Single-word Bible terms (no spaces/digits) grouped for the Wordle game,
// de-duplicated by their normalized form so two spellings of the same word
// never both appear as answers.
export function buildWordleWordPool(pools, category = 'random') {
    const entries = [];
    const pushEntries = (list, label) => {
        list.forEach(entry => entries.push({ term: entry.term, category: label }));
    };

    if (category === 'book' || category === 'random') pushEntries(pools.books, 'اسم سفر');
    if (category === 'name' || category === 'random') pushEntries(pools.names, 'اسم');
    if (category === 'place' || category === 'random') pushEntries(pools.places, 'مكان');
    if (category === 'prophet' || category === 'random') pushEntries(pools.prophets, 'نبي');
    if (category === 'king' || category === 'random') pushEntries(pools.kings, 'ملك');
    if (category === 'woman' || category === 'random') pushEntries(pools.women, 'امرأة');
    if (category === 'tribe' || category === 'random') pushEntries(pools.tribes, 'سبط');
    if (category === 'feast' || category === 'random') pushEntries(pools.feasts, 'عيد');
    if (category === 'artifact' || category === 'random') pushEntries(pools.artifacts, 'أداة مقدسة');

    const seen = new Set();
    return entries.filter(entry => {
        const term = String(entry.term || '');
        if (/[\s\d٠-٩]/.test(term)) return false;
        const normalized = normalizeArabicForMatch(term);
        if (seen.has(normalized)) return false;
        seen.add(normalized);
        return true;
    });
}

// ── Mobile helpers ──────────────────────────────────────────────────────────

// Haptic feedback where supported (Android browsers); silently ignored
// everywhere else so callers never need feature checks.
export function buzz(pattern) {
    try {
        if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
            navigator.vibrate(pattern);
        }
    } catch (error) {
        /* haptics unsupported — ignore */
    }
}

// Horizontal swipe grading for flip-card games (RTL-friendly):
// swiping left = positive action (عرفتها), swiping right = negative one.
// Tap-to-flip keeps working — a swipe is only detected past the threshold.
export function attachSwipeGrading(cardElement, { onSwipeLeft, onSwipeRight, threshold = 60 } = {}) {
    if (!cardElement || typeof cardElement.addEventListener !== 'function') return;

    let startX = null;
    let startY = null;

    cardElement.addEventListener('touchstart', (event) => {
        const touch = event.changedTouches && event.changedTouches[0];
        if (!touch) return;
        startX = touch.clientX;
        startY = touch.clientY;
    }, { passive: true });

    cardElement.addEventListener('touchcancel', () => {
        startX = null;
        startY = null;
    }, { passive: true });

    cardElement.addEventListener('touchend', (event) => {
        if (startX === null) return;
        const touch = event.changedTouches && event.changedTouches[0];
        const dx = touch ? touch.clientX - startX : 0;
        const dy = touch ? touch.clientY - startY : 0;
        startX = null;
        startY = null;

        // Ignore short taps and vertical drags (page scrolling).
        if (Math.abs(dx) < threshold || Math.abs(dy) > Math.abs(dx)) return;

        if (dx < 0) {
            if (onSwipeLeft) onSwipeLeft();
        } else if (onSwipeRight) {
            onSwipeRight();
        }
    }, { passive: true });
}
