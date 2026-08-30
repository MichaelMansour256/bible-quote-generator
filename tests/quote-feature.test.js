import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { quoteFeatureMixin } from '../js/features/quote-feature.js';

function makeMockCtx() {
    const calls = { font: null, textAlign: null, textBaseline: null, fillStyle: null, fillText: [], measureText: [] };
    return {
        clearRect: () => {},
        createLinearGradient: () => ({ addColorStop: () => {} }),
        createRadialGradient: () => ({ addColorStop: () => {} }),
        fillRect: () => {},
        strokeRect: () => {},
        drawImage: () => {},
        save: () => {},
        restore: () => {},
        set font(v) { calls.font = v; },
        get font() { return calls.font; },
        set textAlign(v) { calls.textAlign = v; },
        set textBaseline(v) { calls.textBaseline = v; },
        set fillStyle(v) { calls.fillStyle = v; },
        fillText: (text, x, y) => { calls.fillText.push({ text, x, y }); },
        measureText: (text) => { calls.measureText.push(text); return { width: Math.min(text.length * 20, 800) }; },
        shadowColor: null, shadowBlur: null, shadowOffsetX: null, shadowOffsetY: null, filter: null,
        _calls: calls,
    };
}

function makeMockInstance() {
    const ctx = makeMockCtx();
    return Object.assign(Object.create(quoteFeatureMixin), {
        ctx,
        canvas: { width: 1080, height: 1080 },
        selectedFont: 'aref-ruqaa',
        selectedBg: 'gradient1',
        selectedText: 'white',
        logoLoaded: false,
    });
}

describe('quoteFeatureMixin.getFontFamily', () => {
    const inst = makeMockInstance();
    test('returns correct font for known keys', () => {
        assert.equal(inst.getFontFamily('thuluth-deco'), 'Thuluth Deco, serif');
        assert.equal(inst.getFontFamily('aref-ruqaa'), 'Aref Ruqaa, serif');
        assert.equal(inst.getFontFamily('mirza'), 'Mirza, cursive');
    });
    test('falls back for unknown/null', () => {
        assert.equal(inst.getFontFamily('nonexistent'), 'Thuluth Deco, serif');
    });
});

describe('quoteFeatureMixin.getTextColor', () => {
    const inst = makeMockInstance();
    test('returns correct hex for known colors', () => {
        assert.equal(inst.getTextColor('white'), '#ffffff');
        assert.equal(inst.getTextColor('gold'), '#ffd700');
        assert.equal(inst.getTextColor('black'), '#000000');
    });
    test('falls back to white for unknown', () => {
        assert.equal(inst.getTextColor('unknown'), '#ffffff');
    });
});

describe('quoteFeatureMixin.isLightBackground', () => {
    const inst = makeMockInstance();
    test('identifies light backgrounds', () => {
        assert.equal(inst.isLightBackground('solid-white'), true);
        assert.equal(inst.isLightBackground('solid-cream'), true);
        assert.equal(inst.isLightBackground('solid-lightblue'), true);
    });
    test('identifies dark backgrounds', () => {
        assert.equal(inst.isLightBackground('gradient1'), false);
        assert.equal(inst.isLightBackground('decorative'), false);
    });
});

describe('quoteFeatureMixin.getBackgroundStyle', () => {
    const inst = makeMockInstance();
    test('returns object for gradient styles', () => {
        assert.ok(typeof inst.getBackgroundStyle('gradient1') === 'object');
    });
    test('returns string for solid styles', () => {
        assert.equal(inst.getBackgroundStyle('solid-white'), '#ffffff');
        assert.equal(inst.getBackgroundStyle('solid-cream'), '#fffdd0');
    });
    test('falls back for unknown style', () => {
        assert.ok(typeof inst.getBackgroundStyle('unknown') === 'object');
    });
});

describe('quoteFeatureMixin.calculateFontSize', () => {
    const inst = makeMockInstance();
    test('returns a number >= 50', () => {
        const size = inst.calculateFontSize('يوحنا', 800);
        assert.ok(typeof size === 'number');
        assert.ok(size >= 50);
    });
    test('reduces font size for long text', () => {
        const long = inst.calculateFontSize('أ'.repeat(200), 800);
        const short = inst.calculateFontSize('أ'.repeat(5), 800);
        assert.ok(long <= short);
    });
    test('never goes below 50px', () => {
        assert.ok(inst.calculateFontSize('أ'.repeat(500), 800) >= 50);
    });
});
