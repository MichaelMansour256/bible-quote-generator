export const quoteFeatureMixin = {
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
        const verseText = document.getElementById('verse-text').value.trim();
        if (verseText) {
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
                this.renderSearchResults();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.searchActiveIndex = this.searchActiveIndex <= 0
                    ? this.searchResults.length - 1
                    : this.searchActiveIndex - 1;
                this.renderSearchResults();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const activeResult = this.searchResults[this.searchActiveIndex] || this.searchResults[0];
                if (activeResult) {
                    this.selectVerse(activeResult);
                    closeSearchResults();
                }
            } else if (e.key === 'Escape') {
                closeSearchResults();
            }
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-control')) {
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

    renderSearchResults() {
        const searchResults = document.getElementById('search-results');
        searchResults.innerHTML = '';

        this.searchResults.forEach((result, index) => {
            const item = document.createElement('div');
            item.className = `search-result-item${index === this.searchActiveIndex ? ' active' : ''}`;
            item.setAttribute('role', 'option');
            item.setAttribute('aria-selected', index === this.searchActiveIndex ? 'true' : 'false');
            item.tabIndex = -1;
            item.innerHTML = `
                <div class="reference">${result.reference}</div>
                <div class="text">${result.text.substring(0, 100)}${result.text.length > 100 ? '...' : ''}</div>
            `;
            item.addEventListener('mouseenter', () => {
                this.searchActiveIndex = index;
                this.renderSearchResults();
            });
            item.addEventListener('click', () => {
                this.selectVerse(result);
                searchResults.style.display = 'none';
                this.searchResults = [];
                this.searchActiveIndex = -1;
            });
            searchResults.appendChild(item);
        });
    },

    selectVerse(verseData) {
        document.getElementById('verse-search').value = '';

        if (this.activeView !== 'quote') {
            this.setActiveView('quote');
        }

        this.currentVerse = {
            ...verseData,
            bookId: verseData.bookId || verseData.book || verseData.book_ar || verseData.bookName || '',
            bookName: verseData.bookName || verseData.book_ar || verseData.book || verseData.bookId || ''
        };

        document.getElementById('verse-text').value = verseData.text || '';
        document.getElementById('verse-reference').value = verseData.reference || '';

        const bookSelect = document.getElementById('book-select');
        const chapterSelect = document.getElementById('chapter-select');
        const verseSelect = document.getElementById('verse-select');
        const loadVerseBtn = document.getElementById('load-verse-btn');

        const targetBookName = verseData.book_ar || verseData.bookName || verseData.book || verseData.bookId || '';
        const resolvedBook = bibleAPI.getBookByName(this.bibleData, targetBookName) || bibleAPI.getBookByName(this.bibleData, verseData.book || '');

        if (!resolvedBook) {
            this.showValidationMessage('تعذر تحديد السفر المرتبط بهذه النتيجة.', 'error');
            return;
        }

        const resolvedBookId = resolvedBook.abbreviation || resolvedBook.name;
        bookSelect.value = resolvedBookId;
        this.onBookChange();

        chapterSelect.value = String(verseData.chapter);
        this.onChapterChange();

        verseSelect.value = String(verseData.verse);
        this.onVerseChange();

        loadVerseBtn.disabled = false;
        this.showValidationMessage('تم اختيار الآية بنجاح', 'success');

        const verseSelectionSection = document.querySelector('.verse-selection-section');
        if (verseSelectionSection) {
            verseSelectionSection.classList.add('search-selection-flash');
            verseSelectionSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            window.setTimeout(() => {
                verseSelectionSection.classList.remove('search-selection-flash');
            }, 1200);
        }
    },

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
    },

    setupCanvas() {
        this.canvas.width = 1080;
        this.canvas.height = 1080;
        this.drawPlaceholder();
    },

    drawPlaceholder() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;

        ctx.clearRect(0, 0, width, height);
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#0f1c2e');
        gradient.addColorStop(1, '#1b3557');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = 'rgba(232, 238, 247, 0.38)';
        ctx.font = '24px Tajawal';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('معاينة الصورة ستظهر هنا', width / 2, height / 2);
    },

    getBackgroundStyle(style) {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;

        switch (style) {
            case 'gradient1': {
                const gradient1 = ctx.createLinearGradient(0, 0, width, height);
                gradient1.addColorStop(0, '#13253c');
                gradient1.addColorStop(0.5, '#1f3653');
                gradient1.addColorStop(1, '#2a4d78');
                return gradient1;
            }
            case 'gradient2': {
                const gradient2 = ctx.createLinearGradient(0, 0, width, height);
                gradient2.addColorStop(0, '#5b8cff');
                gradient2.addColorStop(1, '#7f5af0');
                return gradient2;
            }
            case 'gradient3': {
                const gradient3 = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width / 2);
                gradient3.addColorStop(0, '#f1d7a1');
                gradient3.addColorStop(1, '#d4a855');
                return gradient3;
            }
            case 'gradient4': {
                const gradient4 = ctx.createLinearGradient(width, 0, 0, height);
                gradient4.addColorStop(0, '#24c4b2');
                gradient4.addColorStop(1, '#1aa67a');
                return gradient4;
            }
            case 'gradient5': {
                const gradient5 = ctx.createLinearGradient(width, 0, 0, height);
                gradient5.addColorStop(0, '#9b59b6');
                gradient5.addColorStop(0.5, '#8e44ad');
                gradient5.addColorStop(1, '#663399');
                return gradient5;
            }
            case 'solid-white':
                return '#ffffff';
            case 'solid-cream':
                return '#fffdd0';
            case 'solid-lightblue':
                return '#add8e6';
            case 'decorative': {
                const decorativeGradient = ctx.createLinearGradient(0, 0, width, height);
                decorativeGradient.addColorStop(0, '#08111f');
                decorativeGradient.addColorStop(1, '#152640');
                return decorativeGradient;
            }
            default: {
                const defaultGradient = ctx.createLinearGradient(0, 0, width, height);
                defaultGradient.addColorStop(0, '#13253c');
                defaultGradient.addColorStop(0.5, '#1f3653');
                defaultGradient.addColorStop(1, '#2a4d78');
                return defaultGradient;
            }
        }
    },

    getTextColor(color) {
        switch (color) {
            case 'white':
                return '#ffffff';
            case 'gold':
                return '#ffd700';
            case 'cream':
                return '#f5f5dc';
            case 'black':
                return '#000000';
            case 'darkblue':
                return '#1e3a8a';
            default:
                return '#ffffff';
        }
    },

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

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = backgroundStyle;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.strokeStyle = textColor;
        this.ctx.lineWidth = 4;
        this.ctx.strokeRect(40, 40, this.canvas.width - 80, this.canvas.height - 80);

        this.ctx.strokeStyle = textColor;
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

        lines.forEach((line, index) => {
            const y = startY + (index * lineHeight);
            let fontFamily;
            switch (this.selectedFont) {
                case 'thuluth-deco':
                    fontFamily = 'Thuluth Deco, serif';
                    break;
                case 'amiri':
                    fontFamily = 'Amiri, serif';
                    break;
                case 'aref-ruqaa':
                    fontFamily = 'Aref Ruqaa, serif';
                    break;
                case 'reem-kufi':
                    fontFamily = 'Reem Kufi, sans-serif';
                    break;
                case 'lateef':
                    fontFamily = 'Lateef, serif';
                    break;
                case 'scheherazade':
                    fontFamily = 'Scheherazade, serif';
                    break;
                case 'noto-naskh':
                    fontFamily = 'Noto Naskh Arabic, serif';
                    break;
                case 'markazi-text':
                    fontFamily = 'Markazi Text, serif';
                    break;
                case 'katibeh':
                    fontFamily = 'Katibeh, sans-serif';
                    break;
                case 'mirza':
                    fontFamily = 'Mirza, cursive';
                    break;
                case 'harmattan':
                    fontFamily = 'Harmattan, sans-serif';
                    break;
                case 'diwan-kufi':
                    fontFamily = 'Diwan Kufi, cursive';
                    break;
                default:
                    fontFamily = 'Thuluth Deco, serif';
                    break;
            }

            this.ctx.font = `bold ${fontSize}px ${fontFamily}`;
            this.ctx.fillText(line, this.canvas.width / 2, y);
        });

        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;

        if (verseReference) {
            let fontFamily;
            switch (this.selectedFont) {
                case 'thuluth-deco':
                    fontFamily = 'Thuluth Deco, serif';
                    break;
                case 'amiri':
                    fontFamily = 'Amiri, serif';
                    break;
                case 'aref-ruqaa':
                    fontFamily = 'Aref Ruqaa, serif';
                    break;
                case 'reem-kufi':
                    fontFamily = 'Reem Kufi, sans-serif';
                    break;
                case 'lateef':
                    fontFamily = 'Lateef, serif';
                    break;
                case 'scheherazade':
                    fontFamily = 'Scheherazade, serif';
                    break;
                case 'noto-naskh':
                    fontFamily = 'Noto Naskh Arabic, serif';
                    break;
                case 'markazi-text':
                    fontFamily = 'Markazi Text, serif';
                    break;
                case 'katibeh':
                    fontFamily = 'Katibeh, sans-serif';
                    break;
                case 'mirza':
                    fontFamily = 'Mirza, cursive';
                    break;
                case 'harmattan':
                    fontFamily = 'Harmattan, sans-serif';
                    break;
                case 'diwan-kufi':
                    fontFamily = 'Diwan Kufi, cursive';
                    break;
                default:
                    fontFamily = 'Thuluth Deco, serif';
                    break;
            }

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
        const isLightBackground = this.isLightBackground(this.selectedBg);
        const logoSize = 120;
        const logoX = width - logoSize - 60;
        const logoY = 20;

        ctx.filter = isLightBackground ? 'invert(1) brightness(0.5)' : 'none';
        ctx.drawImage(this.logoImage, logoX, logoY, logoSize, logoSize);
        ctx.filter = 'none';
        ctx.restore();
    },

    isLightBackground(bgStyle) {
        const lightBackgrounds = ['solid-white', 'solid-cream', 'solid-lightblue'];
        return lightBackgrounds.includes(bgStyle);
    },

    calculateFontSize(text, maxWidth) {
        let fontSize = 140;
        let fontFamily;

        switch (this.selectedFont) {
            case 'thuluth-deco':
                fontFamily = 'Thuluth Deco, serif';
                break;
            case 'amiri':
                fontFamily = 'Amiri, serif';
                break;
            case 'aref-ruqaa':
                fontFamily = 'Aref Ruqaa, serif';
                break;
            case 'reem-kufi':
                fontFamily = 'Reem Kufi, sans-serif';
                break;
            case 'lateef':
                fontFamily = 'Lateef, serif';
                break;
            case 'scheherazade':
                fontFamily = 'Scheherazade, serif';
                break;
            case 'noto-naskh':
                fontFamily = 'Noto Naskh Arabic, serif';
                break;
            case 'markazi-text':
                fontFamily = 'Markazi Text, serif';
                break;
            case 'katibeh':
                fontFamily = 'Katibeh, sans-serif';
                break;
            case 'mirza':
                fontFamily = 'Mirza, cursive';
                break;
            case 'harmattan':
                fontFamily = 'Harmattan, sans-serif';
                break;
            case 'diwan-kufi':
                fontFamily = 'Diwan Kufi, cursive';
                break;
            default:
                fontFamily = 'Thuluth Deco, serif';
                break;
        }

        let safetyMargin = 0.8;
        if (['mirza', 'katibeh', 'diwan-kufi'].includes(this.selectedFont)) {
            safetyMargin = 0.75;
        }

        this.ctx.font = `${fontSize}px ${fontFamily}`;
        while (this.ctx.measureText(text).width > maxWidth * safetyMargin && fontSize > 50) {
            fontSize -= 3;
            this.ctx.font = `${fontSize}px ${fontFamily}`;
        }

        if (fontSize < 50) {
            fontSize = 50;
        }

        return fontSize;
    },

    showSuccessMessage() {
        const successMessage = document.getElementById('success-message');
        successMessage.style.display = 'block';

        setTimeout(() => {
            successMessage.style.display = 'none';
        }, 3000);
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
