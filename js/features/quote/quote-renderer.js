// Canvas rendering for the verse card generator: fonts, backgrounds,
// typography layout and the PNG download. Pure rendering — page wiring lives
// in quote-feature.js and the search UI in quote-search.js.
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

export const quoteRendererMixin = {
    getFontFamily(key) {
        return FONT_MAP[key] ?? FONT_MAP['thuluth-deco'];
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
