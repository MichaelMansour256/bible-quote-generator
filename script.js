class BibleQuoteGenerator {
    constructor() {
        this.canvas = document.getElementById('quote-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.currentVerse = null;
        this.bibleData = null;
        this.logoImage = new Image();
        this.logoLoaded = false;
        
        // Load the logo image
        this.logoImage.onload = () => {
            this.logoLoaded = true;
        };
        this.logoImage.src = 'logo.svg'; // Path to your logo image
        
        // Clear form fields on page load
        document.getElementById('verse-text').value = '';
        document.getElementById('verse-reference').value = '';
        document.getElementById('verse-search').value = '';
        
        this.initializeEventListeners();
        this.setupCanvas();
        this.loadBibleData();
    }

    async loadBibleData() {
        this.bibleData = await bibleAPI.loadBibleData();
        if (this.bibleData) {
            this.populateBookSelect();
        }
    }

    initializeEventListeners() {
        const generateBtn = document.getElementById('generate-btn');
        const downloadBtn = document.getElementById('download-btn');
        const loadVerseBtn = document.getElementById('load-verse-btn');
        const bookSelect = document.getElementById('book-select');
        const chapterSelect = document.getElementById('chapter-select');
        const verseSelect = document.getElementById('verse-select');
        const searchInput = document.getElementById('verse-search');

        generateBtn.addEventListener('click', () => this.generateImage());
        downloadBtn.addEventListener('click', () => this.downloadImage());
        loadVerseBtn.addEventListener('click', () => this.loadSelectedVerse());
        
        bookSelect.addEventListener('change', () => this.onBookChange());
        chapterSelect.addEventListener('change', () => this.onChapterChange());
        verseSelect.addEventListener('change', () => this.onVerseChange());
        
        // Search functionality
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            if (query.length > 0) {
                this.performSearch(query);
            } else {
                document.getElementById('search-results').style.display = 'none';
            }
        });
        
        // Clear search on page load
        searchInput.value = '';
        document.getElementById('search-results').innerHTML = '';
        document.getElementById('search-results').style.display = 'none';
    }

    populateBookSelect() {
        const bookSelect = document.getElementById('book-select');
        const books = bibleAPI.getAllBooks(this.bibleData);
        
        // Define canonical Bible book order matching correct biblical sequence
        const canonicalOrder = [
            'التكوين', 'الخروج', 'اللاويين', 'العدد', 'التثنية',
            'يشوع', 'القضاة', 'راعوث', 'صموئيل الأول', 'صموئيل الثاني',
            'الملوك الأول', 'الملوك الثاني', 'أخبار الأيام الأول', 'أخبار الأيام الثاني',
            'عزرا', 'نحميا', 'أستير', 'أيوب', 'المزامير', 'الأمثال',
            'الجامعة', 'نشيد الأنشاد', 'إشعياء', 'إرميا', 'مراثي إرميا',
            'حزقيال', 'دانيال', 'هوشع', 'يوئيل', 'عاموس', 'عوبديا',
            'يونان', 'ميخا', 'ناحوم', 'حبقوق', 'صفنيا', 'حجي', 'زكريا',
            'ملاخي', 'متى', 'مرقس', 'لوقا', 'يوحنا', 'أعمال الرسل',
            'رومية', 'كورنثوس الأولى', 'كورنثوس الثانية', 'غلاطية',
            'أفسس', 'فيلبي', 'كولوسي', 'تسالونيكي الأولى', 'تسالونيكي الثانية',
            'تيموثاوس الأولى', 'تيموثاوس الثانية', 'تيطس', 'فليمون',
            'العبرانيين', 'يعقوب', 'بطرس الأولى', 'بطرس الثانية', 'يوحنا الأولى',
            'يوحنا الثانية', 'يوحنا الثالثة', 'يهوذا', 'الرؤيا'
        ];
        
        // Sort books according to canonical order
        books.sort((a, b) => {
            const aIndex = canonicalOrder.indexOf(a.name);
            const bIndex = canonicalOrder.indexOf(b.name);
            if (aIndex === -1 && bIndex === -1) return a.name.localeCompare(b.name, 'ar');
            if (aIndex === -1) return 1;
            if (bIndex === -1) return -1;
            return aIndex - bIndex;
        });

        books.forEach(book => {
            const option = document.createElement('option');
            option.value = book.id;
            option.textContent = book.name;
            bookSelect.appendChild(option);
        });
    }

    onBookChange() {
        const bookSelect = document.getElementById('book-select');
        const chapterSelect = document.getElementById('chapter-select');
        const verseSelect = document.getElementById('verse-select');
        const loadVerseBtn = document.getElementById('load-verse-btn');

        // Reset chapter and verse selects
        chapterSelect.innerHTML = '<option value="">-- اختر إصحاح --</option>';
        verseSelect.innerHTML = '<option value="">-- اختر آية --</option>';
        chapterSelect.disabled = true;
        verseSelect.disabled = true;
        loadVerseBtn.disabled = true;

        const selectedBookId = bookSelect.value;
        if (!selectedBookId || !this.bibleData) return;

        const book = bibleAPI.getBookByName(this.bibleData, selectedBookId);
        if (!book) return;

        // Populate chapters
        const chapters = bibleAPI.getChaptersForBook(this.bibleData, selectedBookId);
        chapters.forEach(chapter => {
            const option = document.createElement('option');
            option.value = chapter.number;
            option.textContent = `الإصحاح ${chapter.number}`;
            chapterSelect.appendChild(option);
        });

        chapterSelect.disabled = false;
    }

    onChapterChange() {
        const bookSelect = document.getElementById('book-select');
        const chapterSelect = document.getElementById('chapter-select');
        const verseSelect = document.getElementById('verse-select');
        const loadVerseBtn = document.getElementById('load-verse-btn');

        // Reset verse select
        verseSelect.innerHTML = '<option value="">-- اختر آية --</option>';
        verseSelect.disabled = true;
        loadVerseBtn.disabled = true;

        const selectedBookId = bookSelect.value;
        const selectedChapter = chapterSelect.value;

        if (!selectedBookId || !selectedChapter || !this.bibleData) return;

        // Get verses for this chapter
        const chapters = bibleAPI.getChaptersForBook(this.bibleData, selectedBookId);
        const chapterData = chapters.find(ch => ch.number === parseInt(selectedChapter));
        
        if (chapterData && chapterData.verses) {
            // Get all verse numbers and sort them numerically
            const verseNumbers = Object.keys(chapterData.verses)
                .map(v => parseInt(v))
                .filter(v => !isNaN(v))
                .sort((a, b) => a - b);
            
            verseNumbers.forEach(verseNum => {
                const option = document.createElement('option');
                option.value = verseNum;
                option.textContent = `الآية ${verseNum}`;
                verseSelect.appendChild(option);
            });
        }

        verseSelect.disabled = false;
    }

    onVerseChange() {
        const bookSelect = document.getElementById('book-select');
        const chapterSelect = document.getElementById('chapter-select');
        const verseSelect = document.getElementById('verse-select');
        const loadVerseBtn = document.getElementById('load-verse-btn');

        const selectedBookId = bookSelect.value;
        const selectedChapter = chapterSelect.value;
        const selectedVerse = verseSelect.value;

        loadVerseBtn.disabled = !(selectedBookId && selectedChapter && selectedVerse);
    }

    loadSelectedVerse() {
        const bookSelect = document.getElementById('book-select');
        const chapterSelect = document.getElementById('chapter-select');
        const verseSelect = document.getElementById('verse-select');

        const selectedBookId = bookSelect.value;
        const selectedChapter = chapterSelect.value;
        const selectedVerse = verseSelect.value;

        const verseText = bibleAPI.getVerse(this.bibleData, selectedBookId, selectedChapter, selectedVerse);
        
        if (verseText) {
            const book = bibleAPI.getBookByName(this.bibleData, selectedBookId);
            const reference = bibleAPI.formatArabicReference(book.name_ar || book.name, selectedChapter, selectedVerse);
            
            this.currentVerse = {
                text: verseText,
                reference: reference,
                bookId: selectedBookId,
                chapter: selectedChapter,
                verse: selectedVerse
            };
            
            document.getElementById('verse-text').value = verseText;
            document.getElementById('verse-reference').value = reference;
            this.showValidationMessage('تم تحميل الآية بنجاح', 'success');
        } else {
            this.showValidationMessage('الآية غير موجودة', 'error');
        }
    }

    setupSearchFunctionality() {
        const searchInput = document.getElementById('verse-search');
        const searchResults = document.getElementById('search-results');
        let searchTimeout;

        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();

            if (query.length < 2 || !this.bibleData) {
                searchResults.style.display = 'none';
                return;
            }

            searchTimeout = setTimeout(() => {
                this.performSearch(query);
            }, 300);
        });

        // Hide search results when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.input-group')) {
                searchResults.style.display = 'none';
            }
        });
    }

    performSearch(query) {
        const searchResults = document.getElementById('search-results');
        const results = bibleAPI.searchVerses(this.bibleData, query);

        if (results.length === 0) {
            searchResults.innerHTML = '<div class="search-result-item">لا توجد نتائج</div>';
            searchResults.style.display = 'block';
            return;
        }

        searchResults.innerHTML = '';
        results.slice(0, 10).forEach(result => {
            const item = document.createElement('div');
            item.className = 'search-result-item';
            item.innerHTML = `
                <div class="reference">${result.reference}</div>
                <div class="text">${result.text.substring(0, 100)}${result.text.length > 100 ? '...' : ''}</div>
            `;
            item.addEventListener('click', () => {
                this.selectVerse(result);
                searchResults.style.display = 'none';
            });
            searchResults.appendChild(item);
        });

        searchResults.style.display = 'block';
    }

    selectVerse(verseData) {
        this.currentVerse = verseData;
        document.getElementById('verse-text').value = verseData.text;
        document.getElementById('verse-reference').value = verseData.reference;
        document.getElementById('verse-search').value = '';
        this.showValidationMessage('تم اختيار الآية بنجاح', 'success');
    }

    showValidationMessage(message, type) {
        const existingMessage = document.querySelector('.validation-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = `validation-message ${type}`;
        messageDiv.textContent = message;

        const verseTextGroup = document.getElementById('verse-text').closest('.input-group');
        verseTextGroup.appendChild(messageDiv);

        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }

    setupCanvas() {
        // Set canvas size for social media (1080x1080 for Instagram)
        this.canvas.width = 1080;
        this.canvas.height = 1080;
        
        // Draw initial placeholder
        this.drawPlaceholder();
    }

    drawPlaceholder() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Draw gradient background
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Draw placeholder text
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.font = '24px Tajawal';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('معاينة الصورة ستظهر هنا', width / 2, height / 2);
    }

    getBackgroundStyle(style) {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;

        switch (style) {
            case 'gradient1':
                const gradient1 = ctx.createLinearGradient(0, 0, width, height);
                gradient1.addColorStop(0, '#3498db');
                gradient1.addColorStop(0.5, '#2980b9');
                gradient1.addColorStop(1, '#1e5f8e');
                return gradient1;
            
            case 'gradient2':
                const gradient2 = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width/2);
                gradient2.addColorStop(0, '#f39c12');
                gradient2.addColorStop(0.5, '#e67e22');
                gradient2.addColorStop(1, '#d35400');
                return gradient2;
            
            case 'gradient3':
                const gradient3 = ctx.createLinearGradient(width, 0, 0, height);
                gradient3.addColorStop(0, '#9b59b6');
                gradient3.addColorStop(0.5, '#8e44ad');
                gradient3.addColorStop(1, '#663399');
                return gradient3;
            
            case 'gradient4':
                const gradient4 = ctx.createLinearGradient(0, height, width, 0);
                gradient4.addColorStop(0, '#27ae60');
                gradient4.addColorStop(0.5, '#229954');
                gradient4.addColorStop(1, '#1e8449');
                return gradient4;
            
            case 'pattern1':
                // Create geometric pattern
                const patternGradient = ctx.createLinearGradient(0, 0, width, height);
                patternGradient.addColorStop(0, '#2c3e50');
                patternGradient.addColorStop(1, '#34495e');
                return patternGradient;
            
            default:
                const defaultGradient = ctx.createLinearGradient(0, 0, width, height);
                defaultGradient.addColorStop(0, '#667eea');
                defaultGradient.addColorStop(1, '#764ba2');
                return defaultGradient;
        }
    }

    getTextColor(color) {
        switch (color) {
            case 'white':
                return '#ffffff';
            case 'gold':
                return '#ffd700';
            case 'cream':
                return '#f5f5dc';
            default:
                return '#ffffff';
        }
    }

    wrapText(text, maxWidth, fontSize) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';

        this.ctx.font = `${fontSize}px Amiri`;

        for (let word of words) {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const metrics = this.ctx.measureText(testLine);
            
            if (metrics.width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        
        if (currentLine) {
            lines.push(currentLine);
        }

        return lines;
    }

    generateImage() {
        const verseText = document.getElementById('verse-text').value.trim();
        const verseReference = document.getElementById('verse-reference').value.trim();
        const backgroundStyle = document.getElementById('background-style').value;
        const textColor = document.getElementById('text-color').value;

        if (!verseText) {
            this.showValidationMessage('الرجاء اختيار آية أولاً', 'error');
            return;
        }

        if (!this.currentVerse) {
            this.showValidationMessage('الرجاء اختيار آية من قاعدة البيانات لضمان الدقة', 'warning');
        }

        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;

        // Clear canvas and draw background
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = this.getBackgroundStyle(backgroundStyle);
        ctx.fillRect(0, 0, width, height);

        // Add subtle overlay for better text readability
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(0, 0, width, height);

        // Draw decorative border
        ctx.strokeStyle = this.getTextColor(textColor);
        ctx.lineWidth = 4;
        ctx.strokeRect(40, 40, width - 80, height - 80);

        // Draw inner decorative border
        ctx.lineWidth = 2;
        ctx.strokeRect(60, 60, width - 120, height - 120);

        // Set text properties
        ctx.fillStyle = this.getTextColor(textColor);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Calculate text layout
        const padding = 120;
        const maxWidth = width - (padding * 2);
        const centerY = height / 2;

        // Draw verse text with proper wrapping
        const fontSize = this.calculateFontSize(verseText, maxWidth);
        const lines = this.wrapText(verseText, maxWidth, fontSize);
        
        // Dynamic line height based on font size
        const lineHeight = fontSize * 1.4; // Slightly tighter for longer text
        const totalTextHeight = lines.length * lineHeight;
        const startY = centerY - (totalTextHeight / 2) + (fontSize / 2);

        // Add text shadow for better readability
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        lines.forEach((line, index) => {
            const y = startY + (index * lineHeight);
            ctx.font = `${fontSize}px Amiri`;
            ctx.fillText(line, width / 2, y);
        });

        // Reset shadow for reference
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // Draw verse reference
        if (verseReference) {
            ctx.font = 'bold 36px Amiri';
            ctx.fillText(verseReference, width / 2, height - 100);
        }

        // Add decorative elements (cross symbols)
        ctx.font = '48px Amiri';
        ctx.fillText('✝', 100, 100);
        ctx.fillText('✝', width - 100, height - 100);

        // Add logo
        this.addLogo(ctx, width, height);

        // Enable download button and show success message
        document.getElementById('download-btn').disabled = false;
        this.showSuccessMessage();
    }

    addLogo(ctx, width, height) {
        // Only draw logo if image is loaded
        if (!this.logoLoaded) return;
        
        // Save current context state
        ctx.save();
        
        // Set logo properties - slightly left from right corner to avoid frame
        const logoSize = 120;
        const logoX = width - logoSize - 60; // Moved further left from frame (was -20)
        const logoY = 20;
        
        // Draw the transparent logo image directly (no background)
        ctx.drawImage(
            this.logoImage,
            logoX,
            logoY,
            logoSize,
            logoSize
        );
        
        // Restore context state
        ctx.restore();
    }

    calculateFontSize(text, maxWidth) {
        let fontSize = 80; // Increased from 60 for larger base size
        this.ctx.font = `${fontSize}px Amiri`;
        
        // More aggressive reduction for long text
        while (this.ctx.measureText(text).width > maxWidth && fontSize > 20) {
            fontSize -= 2;
            this.ctx.font = `${fontSize}px Amiri`;
        }
        
        // Ensure minimum readable size (increased from 16)
        if (fontSize < 20) {
            fontSize = 20;
        }
        
        return fontSize;
    }

    showSuccessMessage() {
        const successMessage = document.getElementById('success-message');
        successMessage.style.display = 'block';
        
        setTimeout(() => {
            successMessage.style.display = 'none';
        }, 3000);
    }

    downloadImage() {
        const link = document.createElement('a');
        const verseReference = document.getElementById('verse-reference').value.trim() || 'bible-verse';
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        
        link.download = `${verseReference}-${timestamp}.png`;
        link.href = this.canvas.toDataURL();
        link.click();
    }
}

// Initialize the generator when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new BibleQuoteGenerator();
});

// Add some sample verses for testing
const sampleVerses = [
    { text: "صالِحٌ هو الرَّبُّ. في يومِ الضَّيقِ، وهو يَعرِفُ المُتَوَكِّلينَ علَيهِ.", reference: "ناحوم ١: ٧" },
    { text: "اِرحَمْنِي يا اللهُ، اِرحَمْنِي، لأنَّ بِكَ تَكَلَّتْ نَفْسِي، وفي ظِلِّ جَنَاحَيْكَ أَحْتَمِي.", reference: "مزمور ٥٧: ١" },
    { text: "الرَّبُّ رَاعِيَّ فَلاَ يُعْوَزُنِي شَيْءٌ.", reference: "مزمور ٢٣: ١" },
    { text: "أَنَا هُوَ الطَّرِيقُ وَالْحَقُّ وَالْحَيَاةُ. لَيْسَ أَحَدٌ يَأْتِي إِلَى الآبِ إِلاَّ بِي.", reference: "يوحنا ١٤: ٦" },
    { text: "لأَنَّهُ هكَذَا أَحَبَّ اللهُ الْعَالَمَ حَتَّى بَذَلَ ابْنَهُ الْوَحِيدَ، لِكَيْ لاَ يَهْلِكَ كُلُّ مَنْ يُؤْمِنُ بِهِ، بَلْ تَكُونُ لَهُ الْحَيَاةُ الأَبَدِيَّةُ.", reference: "يوحنا ٣: ١٦" }
];

// Function to load a random sample verse
function loadRandomVerse() {
    const randomVerse = sampleVerses[Math.floor(Math.random() * sampleVerses.length)];
    document.getElementById('verse-text').value = randomVerse.text;
    document.getElementById('verse-reference').value = randomVerse.reference;
}

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
            case 'Enter':
                e.preventDefault();
                document.getElementById('generate-btn').click();
                break;
            case 's':
                e.preventDefault();
                if (!document.getElementById('download-btn').disabled) {
                    document.getElementById('download-btn').click();
                }
                break;
        }
    }
});
