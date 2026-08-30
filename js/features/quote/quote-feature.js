import { getAdjacentBibleVerse } from '../games/game-utils.js';
import { quoteRendererMixin } from './quote-renderer.js';
import { quoteSearchMixin } from './quote-search.js';

// Formats a book/chapter/verse into the app's Arabic reference style.
function formatBibleReference(bookName, chapter, verse) {
    return bibleAPI.formatArabicReference(bookName, chapter, verse);
}

// Quote feature facade: page wiring + verse selection state. Canvas rendering
// lives in quote-renderer.js and the smart-search UI in quote-search.js; the
// mixins are merged here so `quoteFeatureMixin` remains the single entry
// point used by js/app.js and the tests.
export const quoteFeatureMixin = {
    ...quoteRendererMixin,
    ...quoteSearchMixin,

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
    }
};
