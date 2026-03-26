// Bible Database - Arabic Van Dyck Version
const bibleDatabase = {
    books: [
        { id: 'genesis', name: 'التكوين', chapters: 50 },
        { id: 'exodus', name: 'الخروج', chapters: 40 },
        { id: 'leviticus', name: 'اللاويين', chapters: 27 },
        { id: 'numbers', name: 'العدد', chapters: 36 },
        { id: 'deuteronomy', name: 'التثنية', chapters: 34 },
        { id: 'joshua', name: 'يشوع', chapters: 24 },
        { id: 'judges', name: 'القضاة', chapters: 21 },
        { id: 'ruth', name: 'راعوث', chapters: 4 },
        { id: '1-samuel', name: 'صموئيل الأول', chapters: 31 },
        { id: '2-samuel', name: 'صموئيل الثاني', chapters: 24 },
        { id: '1-kings', name: 'الملوك الأول', chapters: 22 },
        { id: '2-kings', name: 'الملوك الثاني', chapters: 25 },
        { id: '1-chronicles', name: 'أخبار الأيام الأول', chapters: 29 },
        { id: '2-chronicles', name: 'أخبار الأيام الثاني', chapters: 36 },
        { id: 'ezra', name: 'عزرا', chapters: 10 },
        { id: 'nehemiah', name: 'نحميا', chapters: 13 },
        { id: 'esther', name: 'أستير', chapters: 10 },
        { id: 'job', name: 'أيوب', chapters: 42 },
        { id: 'psalms', name: 'المزامير', chapters: 150 },
        { id: 'proverbs', name: 'الأمثال', chapters: 31 },
        { id: 'ecclesiastes', name: 'جامعة', chapters: 12 },
        { id: 'song-of-solomon', name: 'نشيد الأنشاد', chapters: 8 },
        { id: 'isaiah', name: 'إشعياء', chapters: 66 },
        { id: 'jeremiah', name: 'إرميا', chapters: 52 },
        { id: 'lamentations', name: 'مراثي إرميا', chapters: 5 },
        { id: 'ezekiel', name: 'حزقيال', chapters: 48 },
        { id: 'daniel', name: 'دانيال', chapters: 12 },
        { id: 'hosea', name: 'هوشع', chapters: 14 },
        { id: 'joel', name: 'يوئيل', chapters: 3 },
        { id: 'amos', name: 'عاموس', chapters: 9 },
        { id: 'obadiah', name: 'عوبديا', chapters: 1 },
        { id: 'jonah', name: 'يونان', chapters: 4 },
        { id: 'micah', name: 'ميخا', chapters: 7 },
        { id: 'nahum', name: 'ناحوم', chapters: 3 },
        { id: 'habakkuk', name: 'حبقوق', chapters: 3 },
        { id: 'zephaniah', name: 'صفنيا', chapters: 3 },
        { id: 'haggai', name: 'حجي', chapters: 2 },
        { id: 'zechariah', name: 'زكريا', chapters: 14 },
        { id: 'malachi', name: 'ملاخي', chapters: 4 },
        { id: 'matthew', name: 'متى', chapters: 28 },
        { id: 'mark', name: 'مرقس', chapters: 16 },
        { id: 'luke', name: 'لوقا', chapters: 24 },
        { id: 'john', name: 'يوحنا', chapters: 21 },
        { id: 'acts', name: 'أعمال الرسل', chapters: 28 },
        { id: 'romans', name: 'رومية', chapters: 16 },
        { id: '1-corinthians', name: 'كورنثوس الأولى', chapters: 16 },
        { id: '2-corinthians', name: 'كورنثوس الثانية', chapters: 13 },
        { id: 'galatians', name: 'غلاطية', chapters: 6 },
        { id: 'ephesians', name: 'أفسس', chapters: 6 },
        { id: 'philippians', name: 'فيلبي', chapters: 4 },
        { id: 'colossians', name: 'كولوسي', chapters: 4 },
        { id: '1-thessalonians', name: 'تسالونيكي الأولى', chapters: 5 },
        { id: '2-thessalonians', name: 'تسالونيكي الثانية', chapters: 3 },
        { id: '1-timothy', name: 'تيموثاوس الأولى', chapters: 6 },
        { id: '2-timothy', name: 'تيموثاوس الثانية', chapters: 4 },
        { id: 'titus', name: 'تيطس', chapters: 3 },
        { id: 'philemon', name: 'فليمون', chapters: 1 },
        { id: 'hebrews', name: 'العبرانيين', chapters: 13 },
        { id: 'james', name: 'يعقوب', chapters: 5 },
        { id: '1-peter', name: 'بطرس الأولى', chapters: 5 },
        { id: '2-peter', name: 'بطرس الثانية', chapters: 3 },
        { id: '1-john', name: 'يوحنا الأولى', chapters: 5 },
        { id: '2-john', name: 'يوحنا الثانية', chapters: 1 },
        { id: '3-john', name: 'يوحنا الثالثة', chapters: 1 },
        { id: 'jude', name: 'يهوذا', chapters: 1 },
        { id: 'revelation', name: 'رؤيا يوحنا', chapters: 22 }
    ],

    // Sample verses for demonstration - in a real app, this would be a complete database
    verses: {
        'nahum:1:7': {
            text: 'صالِحٌ هو الرَّبُّ. في يومِ الضَّيقِ، وهو يَعرِفُ المُتَوَكِّلينَ علَيهِ.',
            reference: 'ناحوم ١: ٧'
        },
        'nahum:1:8': {
            text: 'ولكن بطوفانٍ عابِرٍ يَصنَعُ هَلاكًا تامًّا لمَوْضِعِها، وأعداؤُهُ يتبَعُهُمْ ظَلامٌ.',
            reference: 'ناحوم ١: ٨'
        },
        'psalms:23:1': {
            text: 'الرَّبُّ رَاعِيَّ فَلاَ يُعْوَزُنِي شَيْءٌ.',
            reference: 'مزمور ٢٣: ١'
        },
        'psalms:23:2': {
            text: 'فِي مَرَاعٍ خُضْرٍ يُرْبِينِي. إِلَى مِيَاهِ الرَّاحَةِ يُورِدُنِي.',
            reference: 'مزمور ٢٣: ٢'
        },
        'psalms:23:3': {
            text: 'يُرَدُّ نَفْسِي. يَهْدِينِي فِي سُبُلِ الْبِرِّ مِنْ أَجْلِ اسْمِهِ.',
            reference: 'مزمور ٢٣: ٣'
        },
        'psalms:23:4': {
            text: 'أَيْضًا إِذَا سِرْتُ فِي وَادِي ظِلِّ الْمَوْتِ لاَ أَخَافُ شَرًّا. لأَنَّكَ مَعِي. عَصَاكَ وَعُكَّازُكَ هُمَا يُعَزِّيَانِنِي.',
            reference: 'مزمور ٢٣: ٤'
        },
        'psalms:23:5': {
            text: 'تُرَتِّبُ قُدَّامِي مَائِدَةً تِجَاهَ مُضَايِقَيَّ. مَسَحْتَ بِالزَّيْتِ رَأْسِي. كَأْسِي رَيَّا.',
            reference: 'مزمور ٢٣: ٥'
        },
        'psalms:23:6': {
            text: 'إِنَّمَا خَيْرٌ وَرَحْمَةٌ يَتْبَعَانِنِي كُلَّ أَيَّامِ حَيَاتِي. وَسَأَكُونُ فِي بَيْتِ الرَّبِّ إِلَى مُدَّةِ أَيَّامٍ.',
            reference: 'مزمور ٢٣: ٦'
        },
        'john:3:16': {
            text: 'لأَنَّهُ هكَذَا أَحَبَّ اللهُ الْعَالَمَ حَتَّى بَذَلَ ابْنَهُ الْوَحِيدَ، لِكَيْ لاَ يَهْلِكَ كُلُّ مَنْ يُؤْمِنُ بِهِ، بَلْ تَكُونُ لَهُ الْحَيَاةُ الأَبَدِيَّةُ.',
            reference: 'يوحنا ٣: ١٦'
        },
        'john:3:17': {
            text: 'لأَنَّ اللهَ لَمْ يُرْسِلِ ابْنَهُ إِلَى الْعَالَمِ لِيَدِينَ الْعَالَمَ، بَلْ لِيَخْلُصَ بِهِ الْعَالَمُ.',
            reference: 'يوحنا ٣: ١٧'
        },
        'john:14:6': {
            text: 'قَالَ لَهُ يَسُوعُ: أَنَا هُوَ الطَّرِيقُ وَالْحَقُّ وَالْحَيَاةُ. لَيْسَ أَحَدٌ يَأْتِي إِلَى الآبِ إِلاَّ بِي.',
            reference: 'يوحنا ١٤: ٦'
        },
        'matthew:6:9': {
            text: 'فَصَلُّوا أَنْتُمْ هكَذَا: أَبَانَا الَّذِي فِي السَّمَاوَاتِ، لِيَتَقَدَّسِ اسْمُكَ.',
            reference: 'متى ٦: ٩'
        },
        'matthew:6:10': {
            text: 'لِيَأْتِ مَلَكُوتُكَ. لِتَكُنْ مَشِيئَتُكَ كَمَا فِي السَّمَاءِ كَذَلِكَ عَلَى الأَرْضِ.',
            reference: 'متى ٦: ١٠'
        },
        'matthew:6:11': {
            text: 'خُبْزَنَا كَفَافَنَا أَعْطِنَا الْيَوْمَ.',
            reference: 'متى ٦: ١١'
        },
        'matthew:6:12': {
            text: 'وَاغْفِرْ لَنَا ذُنُوبَنَا كَمَا نَحْنُ نَغْفِرُ لِلْمُذْنِبِينَ إِلَيْنَا.',
            reference: 'متى ٦: ١٢'
        },
        'matthew:6:13': {
            text: 'وَلاَ تُدْخِلْنَا فِي تَجْرِبَةٍ، لَكِنْ نَجِّنَا مِنَ الشِّرِّيرِ. لأَنَّ لَكَ الْمُلْكَ، وَالْقُوَّةَ، وَالْمَجْدَ، إِلَى الأَبَدِ. آمِين.',
            reference: 'متى ٦: ١٣'
        },
        'proverbs:3:5': {
            text: 'تَوَكَّلْ عَلَى الرَّبِّ بِكُلِّ قَلْبِكَ، وَعَلَى فَهْمِكَ لاَ تَعْتَمِدْ.',
            reference: 'أمثال ٣: ٥'
        },
        'proverbs:3:6': {
            text: 'فِي كُلِّ طُرُقِكَ اعْرِفْهُ، وَهُوَ يُقَوِّمُ سُبُلَكَ.',
            reference: 'أمثال ٣: ٦'
        },
        'isaiah:41:10': {
            text: 'لاَ تَخَفْ لأَنِّي مَعَكَ. لاَ تَتَلَفَّتْ لأَنِّي إِلَهُكَ. قَدْ أَيَّدْتُكَ وَأَعَنْتُكَ وَعَضَدْتُكَ بِيَمِينِ بِرِّي.',
            reference: 'إشعياء ٤١: ١٠'
        },
        'jeremiah:29:11': {
            text: 'لأَنِّي عَارِفٌ الأَفْكَارَ الَّتِي أَنَا مُفَكِّرٌ بِهَا عَلَيْكُمْ، يَقُولُ الرَّبُّ، أَفْكَارَ سَلاَمٍ لاَ شَرٍّ، لأُعْطِيَكُمْ آخِرَةً وَرَجَاءً.',
            reference: 'إرميا ٢٩: ١١'
        },
        'philippians:4:13': {
            text: 'أَسْتَطِيعُ كُلَّ شَيْءٍ فِي الْمَسِيحِ الَّذِي يُقَوِّينِي.',
            reference: 'فيلبي ٤: ١٣'
        },
        'romans:8:28': {
            text: 'وَنَحْنُ نَعْلَمُ أَنَّ كُلَّ الأَشْيَاءِ تَعْمَلُ مَعًا لِلْخَيْرِ لِلَّذِينَ يُحِبُّونَ اللهَ، الَّذِينَ هُمْ مَدْعُوُّونَ حَسَبَ قَصْدِهِ.',
            reference: 'رومية ٨: ٢٨'
        }
    },

    // Search functions
    searchVerse: function(bookId, chapter, verse) {
        const key = `${bookId}:${chapter}:${verse}`;
        return this.verses[key] || null;
    },

    searchByText: function(query) {
        const results = [];
        const lowerQuery = query.toLowerCase();
        
        for (const [key, verse] of Object.entries(this.verses)) {
            if (verse.text.toLowerCase().includes(lowerQuery) || 
                verse.reference.toLowerCase().includes(lowerQuery)) {
                results.push({ key, ...verse });
            }
        }
        
        return results;
    },

    getBookById: function(bookId) {
        return this.books.find(book => book.id === bookId);
    },

    getBookByName: function(bookName) {
        return this.books.find(book => book.name === bookName);
    },

    validateReference: function(bookId, chapter, verse) {
        const book = this.getBookById(bookId);
        if (!book) return false;
        
        if (chapter < 1 || chapter > book.chapters) return false;
        
        // For now, we'll assume verses 1-50 are valid (in a real app, this would be more precise)
        if (verse < 1 || verse > 50) return false;
        
        return true;
    },

    parseReference: function(reference) {
        // Parse references like "ناحوم 1:7" or "مزمور 23:1"
        const patterns = [
            /^(\S+)\s+(\d+):(\d+)$/,
            /^(\S+)\s+(\d+):(\d+)-(\d+)$/
        ];
        
        for (const pattern of patterns) {
            const match = reference.trim().match(pattern);
            if (match) {
                const bookName = match[1];
                const chapter = parseInt(match[2]);
                const verse = parseInt(match[3]);
                const endVerse = match[4] ? parseInt(match[4]) : verse;
                
                const book = this.getBookByName(bookName);
                if (book) {
                    return {
                        bookId: book.id,
                        bookName: book.name,
                        chapter,
                        verse,
                        endVerse,
                        isValid: this.validateReference(book.id, chapter, verse)
                    };
                }
            }
        }
        
        return null;
    },

    getPopularVerses: function() {
        return [
            'john:3:16',
            'psalms:23:1',
            'philippians:4:13',
            'jeremiah:29:11',
            'isaiah:41:10',
            'proverbs:3:5',
            'romans:8:28',
            'matthew:6:9',
            'nahum:1:7'
        ];
    }
};
