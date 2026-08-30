// Bible API Integration - Smith and Van Dyck Arabic Bible
class BibleAPI {
    constructor() {
        this.apiUrl = 'https://api.getbible.net/v2/arabicsv.json';
        this.cache = new Map();
        this.isLoading = false;
    }

    // Load the entire Bible data
    async loadBibleData() {
        if (this.cache.has('bibleData')) {
            return this.cache.get('bibleData');
        }

        try {
            this.showLoading(true);
            const response = await fetch(this.apiUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const bibleData = await response.json();
            this.cache.set('bibleData', bibleData);
            this.showLoading(false);
            return bibleData;
        } catch (error) {
            console.error('Error loading Bible data:', error);
            this.showLoading(false);
            this.showError('فشل تحميل بيانات الكتاب المقدس. يرجى المحاولة مرة أخرى.');
            return null;
        }
    }

    // Get book data by name
    getBookByName(bibleData, bookName) {
        if (!bibleData || !bibleData.books) return null;

        const normalizedBookName = this.normalizeSearchText(bookName);

        return bibleData.books.find(book =>
            this.normalizeSearchText(book.name) === normalizedBookName ||
            this.normalizeSearchText(book.name_ar || book.name) === normalizedBookName ||
            this.normalizeSearchText(book.abbreviation || '') === normalizedBookName
        ) || null;
    }

    // Get chapters for a book
    getChaptersForBook(bibleData, bookName) {
        const book = this.getBookByName(bibleData, bookName);
        if (!book) return [];
        
        // Handle the correct API structure where chapters is an array
        const chapters = [];
        
        if (book.chapters && Array.isArray(book.chapters)) {
            book.chapters.forEach(chapterObj => {
                if (chapterObj && chapterObj.chapter) {
                    const verses = {};
                    
                    if (chapterObj.verses && Array.isArray(chapterObj.verses)) {
                        // Extract verses from the verses array
                        chapterObj.verses.forEach(verseObj => {
                            if (verseObj && verseObj.verse) {
                                verses[verseObj.verse.toString()] = verseObj.text || verseObj;
                            }
                        });
                    }
                    
                    chapters.push({
                        number: chapterObj.chapter,
                        verses: verses
                    });
                }
            });
        }
        
        return chapters.sort((a, b) => a.number - b.number);
    }

    // Get specific verse
    getVerse(bibleData, bookName, chapter, verse) {
        const book = this.getBookByName(bibleData, bookName);
        if (!book || !book.chapters || !Array.isArray(book.chapters)) return null;
        
        // Find the chapter object in the chapters array
        const chapterObj = book.chapters.find(ch => ch && ch.chapter == chapter);
        if (!chapterObj || !chapterObj.verses || !Array.isArray(chapterObj.verses)) return null;
        
        // Find the verse object in the verses array
        const verseObj = chapterObj.verses.find(v => v && v.verse == verse);
        return verseObj ? verseObj.text : null;
    }

    // Search verses by text, book name, or book+chapter reference
    searchVerses(bibleData, query) {
        if (!bibleData || !bibleData.books || !query) return [];

        const normalizedQuery = this.normalizeSearchText(query);

        // 1. Exact verse reference: "يوحنا 3:16" or "يوحنا 3-16"
        const exactRef = this.parseExactReference(query);
        if (exactRef) {
            const verse = this.findVerseByReference(bibleData, exactRef);
            return verse ? [verse] : [];
        }

        // 2. Book + chapter prefix: "يوحنا 1" → all chapters starting with "1"
        const chapterRef = this.parseChapterQuery(query);
        if (chapterRef) {
            return this.findChaptersByPrefix(bibleData, chapterRef);
        }

        // 3. Book name only: "يوحنا" → all chapters of that book
        const bookOnly = this.findBookByQuery(bibleData, normalizedQuery);
        if (bookOnly) {
            return this.getAllChaptersAsResults(bibleData, bookOnly);
        }

        // 4. Full-text search across all verses
        const results = [];
        for (const book of bibleData.books) {
            if (!book.chapters || !Array.isArray(book.chapters)) continue;
            for (const chapterObj of book.chapters) {
                if (!chapterObj || !chapterObj.verses || !Array.isArray(chapterObj.verses)) continue;
                for (const verseObj of chapterObj.verses) {
                    if (verseObj && verseObj.text) {
                        if (this.normalizeSearchText(verseObj.text).includes(normalizedQuery)) {
                            results.push(this.buildVerseResult(book, chapterObj.chapter, verseObj));
                            if (results.length >= 50) return results;
                        }
                    }
                }
            }
        }
        return results;
    }

    // Parse "bookName chapter:verse" or "bookName chapter-verse"
    parseExactReference(query) {
        const normalized = this.normalizeReferenceQuery(query);
        const m = normalized.match(/^(.+?)\s+(\d+)\s*[:\-]\s*(\d+)$/);
        if (!m) return null;
        const bookName = m[1].trim();
        const chapter = parseInt(m[2], 10);
        const verse = parseInt(m[3], 10);
        if (!bookName || isNaN(chapter) || isNaN(verse)) return null;
        return { bookName, chapter, verse };
    }

    // Parse "bookName chapterPrefix" e.g. "يوحنا 1" or "يوحنا 11"
    parseChapterQuery(query) {
        // A full "book chapter:verse" reference belongs to parseExactReference,
        // not to a chapter-prefix query.
        if (this.parseExactReference(query)) return null;
        const normalized = this.normalizeSearchText(query).replace(/\s+/g, ' ').trim();
        const m = normalized.match(/^(.+?)\s+(\d+)$/);
        if (!m) return null;
        return { bookName: m[1].trim(), chapterPrefix: m[2] };
    }

    // Prepare a query for reference parsing: strip diacritics, convert Arabic
    // digits to ASCII, and collapse whitespace — while KEEPING the `:` / `-`
    // separators that normalizeSearchText deliberately turns into spaces.
    normalizeReferenceQuery(query) {
        return this.removeDiacritics(String(query || ''))
            .replace(/[٠-٩]/g, digit => '0123456789'['٠١٢٣٤٥٦٧٨٩'.indexOf(digit)])
            .replace(/[،؛.,]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    findBookByQuery(bibleData, normalizedQuery) {
        return bibleData.books.find(book =>
            this.normalizeSearchText(book.name) === normalizedQuery ||
            this.normalizeSearchText(book.name_ar || book.name) === normalizedQuery
        ) || null;
    }

    // Return one result per chapter whose number starts with chapterPrefix
    findChaptersByPrefix(bibleData, { bookName, chapterPrefix }) {
        const book = this.getBookByName(bibleData, bookName);
        if (!book || !book.chapters) return [];

        return book.chapters
            .filter(ch => ch && String(ch.chapter).startsWith(chapterPrefix))
            .sort((a, b) => a.chapter - b.chapter)
            .map(ch => this.buildChapterResult(book, ch))
            .filter(Boolean);
    }

    // Return one result per chapter (first verse as preview)
    getAllChaptersAsResults(bibleData, book) {
        if (!book.chapters) return [];
        return book.chapters
            .sort((a, b) => a.chapter - b.chapter)
            .map(ch => this.buildChapterResult(book, ch))
            .filter(Boolean);
    }

    // Build a result representing a whole chapter (verse 1 as preview)
    buildChapterResult(book, chapterObj) {
        if (!chapterObj || !chapterObj.verses || !Array.isArray(chapterObj.verses)) return null;
        const firstVerse = chapterObj.verses.find(v => v && v.text);
        if (!firstVerse) return null;
        const bookName = book.name_ar || book.name;
        return {
            book: book.name,
            book_ar: bookName,
            bookId: book.abbreviation || book.name,
            bookName,
            chapter: chapterObj.chapter,
            verse: firstVerse.verse,
            text: firstVerse.text.replace(/\s+/g, ' ').trim(),
            reference: `${bookName} ${chapterObj.chapter}`,
            isChapterResult: true
        };
    }

    buildVerseResult(book, chapter, verseObj) {
        const bookName = book.name_ar || book.name;
        return {
            book: book.name,
            book_ar: bookName,
            bookId: book.abbreviation || book.name,
            bookName,
            chapter,
            verse: verseObj.verse,
            text: verseObj.text.replace(/\s+/g, ' ').trim(),
            reference: this.formatArabicReference(bookName, chapter, verseObj.verse)
        };
    }

    findVerseByReference(bibleData, referenceQuery) {
        const book = this.getBookByName(bibleData, referenceQuery.bookName);
        if (!book || !book.chapters || !Array.isArray(book.chapters)) return null;

        const chapterObj = book.chapters.find(ch => ch && ch.chapter == referenceQuery.chapter);
        if (!chapterObj || !chapterObj.verses || !Array.isArray(chapterObj.verses)) return null;

        const verseObj = chapterObj.verses.find(v => v && v.verse == referenceQuery.verse);
        if (!verseObj || !verseObj.text) return null;

        return this.buildVerseResult(book, chapterObj.chapter, verseObj);
    }

    // Remove Arabic diacritics (tashkeel) for better search matching
    removeDiacritics(text) {
        // Normalize common Arabic search variants and remove diacritics
        return text
            .normalize('NFKD')
            .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
            .replace(/[أإآٱ]/g, 'ا')
            .replace(/ى/g, 'ي')
            .replace(/ؤ/g, 'و')
            .replace(/ئ/g, 'ي')
            .replace(/ة/g, 'ه')
            .toLowerCase();
    }

    normalizeSearchText(text) {
        return this.removeDiacritics(text)
            .replace(/[٠-٩]/g, digit => '0123456789'['٠١٢٣٤٥٦٧٨٩'.indexOf(digit)])
            .replace(/[\u060C\u061B\u061F\.,!?:;"'()\[\]{}«»ـ]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    // Get popular verses
    getPopularVerses(bibleData) {
        const popularReferences = [
            { book: 'يوحنا', chapter: 3, verse: 16 },
            { book: 'مزمور', chapter: 23, verse: 1 },
            { book: 'فيلبي', chapter: 4, verse: 13 },
            { book: 'إرميا', chapter: 29, verse: 11 },
            { book: 'إشعياء', chapter: 41, verse: 10 },
            { book: 'أمثال', chapter: 3, verse: 5 },
            { book: 'رومية', chapter: 8, verse: 28 },
            { book: 'متى', chapter: 6, verse: 9 },
            { book: 'ناحوم', chapter: 1, verse: 7 }
        ];

        const verses = [];
        for (const ref of popularReferences) {
            const verse = this.getVerse(bibleData, ref.book, ref.chapter, ref.verse);
            if (verse) {
                verses.push({
                    text: verse,
                    reference: `${ref.book} ${ref.chapter}:${ref.verse}`
                });
            }
        }

        return verses;
    }

    // Get all books list
    getAllBooks(bibleData) {
        if (!bibleData || !bibleData.books) return [];
        
        return bibleData.books.map(book => ({
            id: book.abbreviation || book.name,
            name: book.name_ar || book.name,
            chapters: book.chapters ? book.chapters.length : 0
        }));
    }

    // Validate reference
    validateReference(bibleData, bookName, chapter, verse) {
        const book = this.getBookByName(bibleData, bookName);
        if (!book || !book.chapters || !Array.isArray(book.chapters)) return false;
        
        // Find the chapter object in the chapters array
        const chapterObj = book.chapters.find(ch => ch && ch.chapter == chapter);
        if (!chapterObj || !chapterObj.verses || !Array.isArray(chapterObj.verses)) return false;
        
        // Check if verse exists in the verses array
        return chapterObj.verses.some(v => v && v.verse == verse);
    }

    // Show loading state
    showLoading(show) {
        this.isLoading = show;
        const loadingElements = document.querySelectorAll('.loading-indicator');
        loadingElements.forEach(el => {
            el.style.display = show ? 'block' : 'none';
        });

        // Disable/enable controls during loading
        const controls = document.querySelectorAll('select, button:not(.cancel-btn)');
        controls.forEach(control => {
            control.disabled = show;
        });
    }

    // Show error message
    showError(message) {
        const existingError = document.querySelector('.api-error');
        if (existingError) existingError.remove();

        const errorDiv = document.createElement('div');
        errorDiv.className = 'api-error validation-message error';
        errorDiv.textContent = message;
        
        const container = document.querySelector('.verse-browser');
        if (container) {
            container.appendChild(errorDiv);
            setTimeout(() => errorDiv.remove(), 5000);
        }
    }

    // Format Arabic numbers
    formatArabicNumber(num) {
        const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
        return num.toString().split('').map(digit => arabicNumbers[parseInt(digit)] || digit).join('');
    }

    // Convert reference to Arabic format
    formatArabicReference(bookName, chapter, verse) {
        return `${bookName} ${this.formatArabicNumber(chapter)}: ${this.formatArabicNumber(verse)}`;
    }
}

// Create global instance
const bibleAPI = new BibleAPI();
