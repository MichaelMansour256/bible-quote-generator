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
            { term: 'النهر الأردن', aliases: ['الأردن', 'نهر الأردن'], difficulty: 'hard' },
            { term: 'بحر الجليل', aliases: ['بحيرة الجليل'], difficulty: 'hard' },
            { term: 'بحر الميت', aliases: ['البحر الميت'], difficulty: 'hard' },
            { term: 'جبل الزيتون', aliases: ['جبل الزيتون الشرقي'], difficulty: 'hard' },
            { term: 'جبل الكرمل', aliases: ['الكرمل'], difficulty: 'hard' },
            { term: 'جبل سيناء', aliases: ['سيناء'], difficulty: 'expert' },
            { term: 'جبل حوريب', aliases: ['حوريب'], difficulty: 'expert' },
            { term: 'أنطاكية', aliases: ['أنطاكية السورية'], difficulty: 'expert' },
            { term: 'أفسس', aliases: ['مدينة أفسس'], difficulty: 'expert' },
            { term: 'كورنثوس', aliases: ['كورنثوس اليونانية'], difficulty: 'expert' }
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

    return terms;
}
