import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { quoteFeatureMixin } from '../js/features/quote-feature.js';

function makeMockCtx() {
    const calls = { measureText: [] };
    return {
        set font(v) { calls.font = v; },
        get font() { return calls.font; },
        measureText: (text) => {
            calls.measureText.push(text);
            return { width: Math.min(text.length * 20, 800) };
        },
        _calls: calls,
    };
}

describe('quoteFeatureMixin.wrapText', () => {
    test('returns array of lines', () => {
        const ctx = makeMockCtx();
        const inst = Object.assign(Object.create(quoteFeatureMixin), { ctx, selectedFont: 'aref-ruqaa' });
        const lines = inst.wrapText('يوحنا ثلاثة ستة عشر', 800, 100);
        assert.ok(Array.isArray(lines));
        assert.ok(lines.length > 0);
    });

    test('splits long text into multiple lines', () => {
        const ctx = makeMockCtx();
        const inst = Object.assign(Object.create(quoteFeatureMixin), { ctx, selectedFont: 'aref-ruqaa' });
        const longText = Array(50).fill('كلمة').join(' ');
        const lines = inst.wrapText(longText, 400, 60);
        assert.ok(lines.length > 1);
    });

    test('handles single word', () => {
        const ctx = makeMockCtx();
        const inst = Object.assign(Object.create(quoteFeatureMixin), { ctx, selectedFont: 'aref-ruqaa' });
        const lines = inst.wrapText('يوحنا', 800, 100);
        assert.equal(lines.length, 1);
    });
});

describe('quoteFeatureMixin.downloadImage', () => {
    test('constructs download link with Arabic reference and timestamp', () => {
        let capturedHref = null;
        let capturedDownload = null;

        globalThis.document = {
            getElementById: (id) => {
                if (id === 'verse-reference') return { value: 'يوحنا ٣: ١٦' };
                return null;
            },
            createElement: (tag) => {
                if (tag === 'a') {
                    return {
                        set download(v) { capturedDownload = v; },
                        set href(v) { capturedHref = v; },
                        click: () => {},
                    };
                }
                return {};
            },
        };

        const inst = Object.assign(Object.create(quoteFeatureMixin), {
            canvas: { toDataURL: () => 'data:image/png;base64,abc' },
        });

        inst.downloadImage();

        assert.ok(capturedDownload, 'Download filename should be set');
        assert.ok(capturedDownload.includes('يوحنا'), 'Filename should contain Arabic reference');
        assert.ok(capturedHref, 'Href should be set');
    });
});
