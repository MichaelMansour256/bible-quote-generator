import { getAdjacentBibleVerse } from './games/game-utils.js';

const FONT_MAP = {
    'thuluth-deco': 'Thuluth Deco, serif',
    'amiri': 'Amiri, serif',
    'aref-ruqaa': 'Aref Ruqaa, serif',
    'reem-kufi': 'Reem Kufi, sans-serif',
    'lateef': 'Lateef, serif',
    'scheherazade': 'Scheherazade, serif',
    'noto-naskh': 'Noto Naskh Arabic, serif',
    'markazi-text': 'Markazi Text, serif',
    'katibeh': 'Katibeh, sans-serif',
    'mirza': 'Mirza, cursive',
    'harmattan': 'Harmattan, sans-serif',
    'diwan-kufi': 'Diwan Kufi, cursive'
};

const DECORATIVE_FONTS = new Set(['mirza', 'katibeh', 'diwan-kufi']);

// Formats a book/chapter/verse into the app's Arabic reference style.
function formatBibleReference(bookName, chapter, verse) {
    return bibleAPI.formatArabicReference(bookName, chapter, verse);
}

export const quoteFeatureMixin = {
    getFontFamily(key) {
        return FONT_MAP[key] ?? FONT_MAP['thuluth-deco'];
    },

    setupColorCombinations() {
        const colorOptions = document.querySelectorAll('.color-option');

        if (colorOptions.length > 0) {
            colorOptions[0].classList.add('selected');
        }

        colorOptions.forEach(option => {
            option.addEventListener('click', () => {
                colorOptions.forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                this.selectedBg = option.dataset.bg;
                this.selectedText = option.dataset.text;
                this.updatePreview();
            });
        });
    },

    updatePreview() {
        if (document.getElementById('verse-text').value.trim()) {
            this.generateImage();
        }
    },

    setupFontSelection() {
        const fontSelect = document.getElementById('font-style');
        fontSelect.addEventListener('change', () => {
            this.selectedFont = fontSelect.value;
            this.updatePreview();
        });
    },

    setupVerseTextSelection() {
        const textarea = document.getElementById('verse-text');
        const useSelBtn = document.getElementById('use-selection-btn');
        const restoreBtn = document.getElementById('restore-verse-btn');

        // readonly textareas support mouse selection but not keyboard editing.
        // Poll selection on mouseup, touchend, keyup, click, and select events.
        // On mobile, selectionStart/selectionEnd may not be updated synchronously
        // after touch/mouse events, so we add a small delay to allow the browser
        // to finalize the selection before reading it.
        const checkSelection = () => {
            const selected = textarea.value
                .substring(textarea.selectionStart, textarea.selectionEnd)
                .trim();
            useSelBtn.disabled = selected.length === 0;
        };

        // Delayed check to allow mobile browsers to update selectionStart/selectionEnd
        const checkSelectionDelayed = () => {
            setTimeout(checkSelection, 100);
        };

        textarea.addEventListener('mouseup', checkSelectionDelayed);
        textarea.addEventListener('touchend', checkSelectionDelayed);
        textarea.addEventListener('keyup', checkSelection);
        textarea.addEventListener('click', checkSelectionDelayed);
        textarea.addEventListener('select', checkSelection);

        useSelBtn.addEventListener('click', () => {
            const selected = textarea.value
                .substring(textarea.selectionStart, textarea.selectionEnd)
                .trim();
            if (!selected) return;

            if (!this._fullVerseText) {
                this._fullVerseText = textarea.value;
            }

            // Temporarily remove readonly to allow value assignment, then restore
            textarea.removeAttribute('readonly');
            textarea.value = selected;
            textarea.setAttribute('readonly', '');

            restoreBtn.disabled = false;
            useSelBtn.disabled = true;
            this.generateImage();
        });

        restoreBtn.addEventListener('click', () => {
            if (this._fullVerseText) {
                textarea.removeAttribute('readonly');
                textarea.value = this._fullVerseText;
                textarea.setAttribute('readonly', '');
                this._fullVerseText = null;
            }
            restoreBtn.disabled = true;
            useSelBtn.disabled = true;
            this.generateImage();
        });
    },

    _updateSelectionBtn() {},

    initializeCanvas() {
        this.canvas.width = 1080;
        this.canvas.height = 1080;
        this.drawPlaceholder();
    },

    setupSearchFunctionality() {
        const searchInput = document.getElementById('verse-search');
        const searchResults = document.getElementById('search-results');
        const searchLoading = document.getElementById('search-loading');

        const closeSearchResults = () => {
            searchResults.style.display = 'none';
            this.searchActiveIndex = -1;
            this.searchResults = [];
            searchResults.innerHTML = '';
        };

        searchInput.addEventListener('input', (e) => {
            clearTimeout(this.searchTimeout);
            const query = e.target.value.trim();

            if (query.length < 2 || !this.bibleData) {
                searchLoading.classList.add('hidden');
                closeSearchResults();
                return;
            }

            searchLoading.classList.remove('hidden');
            searchResults.style.display = 'none';
            this.searchTimeout = setTimeout(() => {
                this.performSearch(query);
            }, 250);
        });

        searchInput.addEventListener('keydown', (e) => {
            if (searchResults.style.display !== 'block' || !this.searchResults.length) {
                if (e.key === 'Escape') {
                    closeSearchResults();
                    searchInput.blur();
                }
                return;
            }

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.searchActiveIndex = (this.searchActiveIndex + 1) % this.searchResults.length;
                this.updateActiveHighlight();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.searchActiveIndex = this.searchActiveIndex <= 0
                    ? this.searchResults.length - 1
                    : this.searchActiveIndex - 1;
                this.updateActiveHighlight();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const activeResult = this.searchResults[this.searchActiveIndex] || this.searchResults[0];
                if (activeResult && !activeResult.isChapterResult) {
                    this.selectAndLoadVerse(activeResult);
                }
            } else if (e.key === 'Escape') {
                closeSearchResults();
            }
        });

        // Use mousedown instead of click so it fires before the input's blur event,
        // and use closest check so clicks inside the results panel don't close it.
        document.addEventListener('mousedown', (e) => {
            if (!searchResults.contains(e.target) && e.target !== searchInput) {
                closeSearchResults();
            }
        });
    },

    performSearch(query) {
        const searchResults = document.getElementById('search-results');
        const searchLoading = document.getElementById('search-loading');
        const results = bibleAPI.searchVerses(this.bibleData, query);

        this.searchResults = results.slice(0, 10);
        this.searchActiveIndex = this.searchResults.length ? 0 : -1;

        if (this.searchResults.length === 0) {
            searchLoading.classList.add('hidden');
            searchResults.innerHTML = '<div class="search-result-item empty">لا توجد نتائج</div>';
            searchResults.style.display = 'block';
            return;
        }

        this.renderSearchResults();
        searchLoading.classList.add('hidden');
        searchResults.style.display = 'block';
    },

    updateActiveHighlight() {
        const searchResults = document.getElementById('search-results');
        searchResults.querySelectorAll('.search-result-item').forEach((el, i) => {
            el.classList.toggle('active', i === this.searchActiveIndex);
        });
    },

    renderSearchResults() {
        const searchResults = document.getElementById('search-results');
        searchResults.innerHTML = '';

        this.searchResults.forEach((result, index) => {
            if (result.isChapterResult) {
                this.renderChapterResult(searchResults, result, index);
            } else {
                this.renderVerseResult(searchResults, result, index);
            }
        });
    },

    renderVerseResult(container, result, index) {
        const item = document.createElement('div');
        item.className = `search-result-item${index === this.searchActiveIndex ? ' active' : ''}`;
        item.setAttribute('role', 'option');
        item.tabIndex = -1;

        const preview = result.text.length > 80 ? result.text.substring(0, 80) + '...' : result.text;
        item.innerHTML = `
            <div class="search-result-header">
                <span class="search-result-reference">${result.reference}</span>
                <span class="search-result-icon">📖</span>
            </div>
            <div class="search-result-text">${preview}</div>
        `;
        // mousedown so it fires before the document mousedown close handler
        item.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.selectAndLoadVerse(result);
        });
        container.appendChild(item);
    },

    renderChapterResult(container, result, index) {
        const header = document.createElement('div');
        header.className = `search-result-item search-result-chapter${index === this.searchActiveIndex ? ' active' : ''}`;
        header.tabIndex = -1;

        const preview = result.text.length > 80 ? result.text.substring(0, 80) + '...' : result.text;
        const expandSpan = document.createElement('span');
        expandSpan.className = 'search-result-expand';
        expandSpan.textContent = '▼';

        header.innerHTML = `
            <div class="search-result-header">
                <span class="search-result-reference">${result.reference}</span>
            </div>
            <div class="search-result-text">${preview}</div>
        `;
        header.querySelector('.search-result-header').appendChild(expandSpan);

        const verseList = document.createElement('div');
        verseList.className = 'search-result-verse-list hidden';

        const book = bibleAPI.getBookByName(this.bibleData, result.book_ar || result.bookName || result.book);
        if (book && book.chapters) {
            const chapterObj = book.chapters.find(ch => ch && ch.chapter == result.chapter);
            if (chapterObj && chapterObj.verses) {
                chapterObj.verses.forEach(v => {
                    if (!v || !v.text) return;
                    const verseItem = document.createElement('div');
                    verseItem.className = 'search-result-verse-item';
                    const bookName = result.book_ar || result.bookName || result.book;
                    const ref = bibleAPI.formatArabicReference(bookName, result.chapter, v.verse);
                    const vPreview = v.text.length > 70 ? v.text.substring(0, 70) + '...' : v.text;
                    verseItem.innerHTML = `
                        <span class="search-result-verse-num">${ref}</span>
                        <span class="search-result-verse-text">${vPreview}</span>
                    `;
                    verseItem.addEventListener('mousedown', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        this.selectAndLoadVerse({
                            book: result.book,
                            book_ar: result.book_ar,
                            bookId: result.bookId,
                            bookName: result.bookName,
                            chapter: result.chapter,
                            verse: v.verse,
                            text: v.text,
                            reference: ref
                        });
                    });
                    verseList.appendChild(verseItem);
                });
            }
        }

        header.addEventListener('mousedown', (e) => {
            e.preventDefault();
            const isHidden = verseList.classList.toggle('hidden');
            expandSpan.textContent = isHidden ? '▼' : '▲';
        });

        container.appendChild(header);
        container.appendChild(verseList);
    },

    // Called when a verse result is clicked — loads it and generates the image immediately
    selectAndLoadVerse(verseData) {
        // Close dropdown first
        const searchResults = document.getElementById('search-results');
        searchResults.style.display = 'none';
        searchResults.innerHTML = '';
        document.getElementById('verse-search').value = '';
        this.searchResults = [];
        this.searchActiveIndex = -1;

        if (this.activeView !== 'quote') {
            this.setActiveView('quote');
        }

        const bookName = verseData.book_ar || verseData.bookName || verseData.book || '';
        const resolvedBook = bibleAPI.getBookByName(this.bibleData, bookName)
            || bibleAPI.getBookByName(this.bibleData, verseData.book || '');

        if (!resolvedBook) {
            this.showValidationMessage('تعذر تحديد السفر المرتبط بهذه النتيجة.', 'error');
            return;
        }

        // Fetch the actual verse text from the API (source of truth)
        const verseText = bibleAPI.getVerse(
            this.bibleData,
            resolvedBook.abbreviation || resolvedBook.name,
            verseData.chapter,
            verseData.verse
        ) || verseData.text || '';

        const resolvedBookName = resolvedBook.name_ar || resolvedBook.name;
        const reference = bibleAPI.formatArabicReference(resolvedBookName, verseData.chapter, verseData.verse);

        this.currentVerse = {
            bookId: resolvedBook.abbreviation || resolvedBook.name,
            bookName: resolvedBookName,
            chapter: verseData.chapter,
            verse: verseData.verse,
            text: verseText,
            reference
        };

        document.getElementById('verse-text').value = verseText;
        document.getElementById('verse-reference').value = reference;
        this._fullVerseText = null;
        document.getElementById('restore-verse-btn').disabled = true;
        document.getElementById('use-selection-btn').disabled = true;

        // Sync the dropdowns
        const bookSelect = document.getElementById('book-select');
        const chapterSelect = document.getElementById('chapter-select');
        const verseSelect = document.getElementById('verse-select');
        bookSelect.value = this.currentVerse.bookId;
        this.onBookChange();
        chapterSelect.value = String(verseData.chapter);
        this.onChapterChange();
        verseSelect.value = String(verseData.verse);
        this.onVerseChange();
        document.getElementById('load-verse-btn').disabled = false;

        // Generate the image immediately
        this.generateImage();
        this.updateQuoteAdjacentButtons();

        const verseSelectionSection = document.querySelector('.verse-selection-section');
        if (verseSelectionSection) {
            verseSelectionSection.classList.add('search-selection-flash');
            verseSelectionSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            window.setTimeout(() => verseSelectionSection.classList.remove('search-selection-flash'), 1200);
        }
    },

    // Legacy alias kept for keyboard Enter handler
    selectVerse(verseData) {
        if (verseData.isChapterResult) return; // chapter results need expansion, not direct selection
        this.selectAndLoadVerse(verseData);
    },

    // Enables/disables the previous/next verse buttons based on where the
    // current verse sits in the full Bible. Call this after every verse load.
    updateQuoteAdjacentButtons() {
        const prevBtn = document.getElementById('quote-prev-btn');
        const nextBtn = document.getElementById('quote-next-btn');

        if (!this.currentVerse || !this.currentVerse.text || !this.bibleData) {
            if (prevBtn) prevBtn.disabled = true;
            if (nextBtn) nextBtn.disabled = true;
            return;
        }

        const previous = getAdjacentBibleVerse(this.bibleData, this.currentVerse, -1);
        const next = getAdjacentBibleVerse(this.bibleData, this.currentVerse, 1);
        if (prevBtn) prevBtn.disabled = !previous;
        if (nextBtn) nextBtn.disabled = !next;
    },

    // Loads the previous (-1) or next (+1) verse onto the quote card — syncs
    // the dropdowns, fills the verse text/reference, and re-renders the image
    // so consecutive verses can be turned into cards back-to-back.
    loadAdjacentQuoteVerse(direction) {
        if (!this.currentVerse || !this.currentVerse.text || !this.bibleData) return;

        const adjacent = getAdjacentBibleVerse(
            this.bibleData,
            this.currentVerse,
            direction,
            formatBibleReference
        );

        if (!adjacent) {
            this.showValidationMessage(
                direction === 1
                    ? 'لا توجد آية تالية — أنت في آخر آية في الكتاب.'
                    : 'لا توجد آية سابقة — أنت في أول آية في الكتاب.',
                'warning'
            );
            return;
        }

        this.currentVerse = adjacent;

        document.getElementById('verse-text').value = adjacent.text;
        document.getElementById('verse-reference').value = adjacent.reference;
        this._fullVerseText = null;
        document.getElementById('restore-verse-btn').disabled = true;
        document.getElementById('use-selection-btn').disabled = true;
        document.getElementById('load-verse-btn').disabled = false;

        // Sync the dropdowns so the selection reflects the loaded verse.
        const bookSelect = document.getElementById('book-select');
        const chapterSelect = document.getElementById('chapter-select');
        const verseSelect = document.getElementById('verse-select');
        bookSelect.value = adjacent.bookId;
        this.onBookChange();
        chapterSelect.value = String(adjacent.chapter);
        this.onChapterChange();
        verseSelect.value = String(adjacent.verse);
        this.onVerseChange();

        this.updateQuoteAdjacentButtons();

        // Regenerate the card image for the new verse.
        this.generateImage();
    },

    showValidationMessage(message, type) {
        const existingMessage = document.querySelector('.validation-message');
        if (existingMessage) existingMessage.remove();

        const messageDiv = document.createElement('div');
        messageDiv.className = `validation-message ${type}`;
        messageDiv.textContent = message;

        const verseTextGroup = document.getElementById('verse-text').closest('.input-group');
        verseTextGroup.appendChild(messageDiv);

        setTimeout(() => messageDiv.remove(), 5000);
    },

    drawPlaceholder() {
        const { ctx, canvas } = this;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#0f1c2e');
        gradient.addColorStop(1, '#1b3557');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(232, 238, 247, 0.38)';
        ctx.font = '24px Tajawal';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('معاينة الصورة ستظهر هنا', canvas.width / 2, canvas.height / 2);
    },

    getBackgroundStyle(style) {
        const { ctx, canvas } = this;
        const { width, height } = canvas;

        switch (style) {
            case 'gradient1': {
                const g = ctx.createLinearGradient(0, 0, width, height);
                g.addColorStop(0, '#13253c');
                g.addColorStop(0.5, '#1f3653');
                g.addColorStop(1, '#2a4d78');
                return g;
            }
            case 'gradient2': {
                const g = ctx.createLinearGradient(0, 0, width, height);
                g.addColorStop(0, '#5b8cff');
                g.addColorStop(1, '#7f5af0');
                return g;
            }
            case 'gradient3': {
                const g = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width / 2);
                g.addColorStop(0, '#f1d7a1');
                g.addColorStop(1, '#d4a855');
                return g;
            }
            case 'gradient4': {
                const g = ctx.createLinearGradient(width, 0, 0, height);
                g.addColorStop(0, '#24c4b2');
                g.addColorStop(1, '#1aa67a');
                return g;
            }
            case 'gradient5': {
                const g = ctx.createLinearGradient(width, 0, 0, height);
                g.addColorStop(0, '#9b59b6');
                g.addColorStop(0.5, '#8e44ad');
                g.addColorStop(1, '#663399');
                return g;
            }
            case 'solid-white': return '#ffffff';
            case 'solid-cream': return '#fffdd0';
            case 'solid-lightblue': return '#add8e6';
            case 'decorative': {
                const g = ctx.createLinearGradient(0, 0, width, height);
                g.addColorStop(0, '#08111f');
                g.addColorStop(1, '#152640');
                return g;
            }
            default: {
                const g = ctx.createLinearGradient(0, 0, width, height);
                g.addColorStop(0, '#13253c');
                g.addColorStop(0.5, '#1f3653');
                g.addColorStop(1, '#2a4d78');
                return g;
            }
        }
    },

    getTextColor(color) {
        const colors = {
            white: '#ffffff',
            gold: '#ffd700',
            cream: '#f5f5dc',
            black: '#000000',
            darkblue: '#1e3a8a'
        };
        return colors[color] ?? '#ffffff';
    },

    wrapText(text, maxWidth, fontSize) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';

        this.ctx.font = `${fontSize}px ${this.getFontFamily(this.selectedFont)}`;

        for (const word of words) {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            if (this.ctx.measureText(testLine).width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }

        if (currentLine) lines.push(currentLine);
        return lines;
    },

    generateImage() {
        const verseText = document.getElementById('verse-text').value.trim();
        const verseReference = document.getElementById('verse-reference').value.trim();

        if (!verseText) {
            this.showValidationMessage('الرجاء اختيار آية أولاً', 'error');
            return;
        }

        this.canvas.width = 1080;
        this.canvas.height = 1080;

        const backgroundStyle = this.getBackgroundStyle(this.selectedBg);
        const textColor = this.getTextColor(this.selectedText);
        const fontFamily = this.getFontFamily(this.selectedFont);

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = backgroundStyle;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.strokeStyle = textColor;
        this.ctx.lineWidth = 4;
        this.ctx.strokeRect(40, 40, this.canvas.width - 80, this.canvas.height - 80);
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(60, 60, this.canvas.width - 120, this.canvas.height - 120);

        this.ctx.fillStyle = textColor;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        const padding = 120;
        const maxWidth = this.canvas.width - (padding * 2);
        const centerY = this.canvas.height / 2;

        const fontSize = this.calculateFontSize(verseText, maxWidth);
        const lines = this.wrapText(verseText, maxWidth, fontSize);
        const lineHeight = fontSize * 1.4;
        const totalTextHeight = lines.length * lineHeight;
        const startY = centerY - (totalTextHeight / 2) + (fontSize / 2);

        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 8;
        this.ctx.shadowOffsetX = 2;
        this.ctx.shadowOffsetY = 2;

        this.ctx.font = `bold ${fontSize}px ${fontFamily}`;
        lines.forEach((line, index) => {
            this.ctx.fillText(line, this.canvas.width / 2, startY + (index * lineHeight));
        });

        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;

        if (verseReference) {
            this.ctx.font = `bold 60px ${fontFamily}`;
            this.ctx.fillText(verseReference, this.canvas.width / 2, this.canvas.height - 100);
        }

        this.ctx.font = '48px Amiri';
        this.ctx.fillText('✝', 100, 100);
        this.ctx.fillText('✝', this.canvas.width - 100, this.canvas.height - 100);

        this.addLogo(this.ctx, this.canvas.width, this.canvas.height);
        document.getElementById('download-btn').disabled = false;
        this.showSuccessMessage();
    },

    addLogo(ctx, width, height) {
        const logoToggle = document.getElementById('logo-toggle');
        if (!logoToggle.checked || !this.logoLoaded) return;

        ctx.save();
        const logoSize = 120;
        ctx.filter = this.isLightBackground(this.selectedBg) ? 'invert(1) brightness(0.5)' : 'none';
        ctx.drawImage(this.logoImage, width - logoSize - 60, 20, logoSize, logoSize);
        ctx.filter = 'none';
        ctx.restore();
    },

    isLightBackground(bgStyle) {
        return ['solid-white', 'solid-cream', 'solid-lightblue'].includes(bgStyle);
    },

    calculateFontSize(text, maxWidth) {
        const fontFamily = this.getFontFamily(this.selectedFont);
        const safetyMargin = DECORATIVE_FONTS.has(this.selectedFont) ? 0.75 : 0.8;
        let fontSize = 140;

        this.ctx.font = `${fontSize}px ${fontFamily}`;
        while (this.ctx.measureText(text).width > maxWidth * safetyMargin && fontSize > 50) {
            fontSize -= 3;
            this.ctx.font = `${fontSize}px ${fontFamily}`;
        }

        return Math.max(fontSize, 50);
    },

    showSuccessMessage() {
        const successMessage = document.getElementById('success-message');
        successMessage.style.display = 'block';
        setTimeout(() => { successMessage.style.display = 'none'; }, 3000);
    },

    downloadImage() {
        const link = document.createElement('a');
        const verseReference = document.getElementById('verse-reference').value.trim() || 'bible-verse';
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        link.download = `${verseReference}-${timestamp}.png`;
        link.href = this.canvas.toDataURL();
        link.click();
    }
};
