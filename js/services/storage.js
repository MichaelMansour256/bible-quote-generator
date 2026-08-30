// Centralised localStorage access for the ES-module side of the app.
// Classic scripts (i18n.js) and the game mixins keep their own direct
// localStorage usage; shared modules (theme, app shell) go through these
// helpers so storage failures (private mode, quota) can never break a page.

export const STORAGE_KEYS = {
    theme: 'verseup-theme',
    lang: 'verseup-lang'
};

// Returns the stored string for `key`, or `fallback` when missing/unavailable.
export function readStorage(key, fallback = null) {
    try {
        const value = localStorage.getItem(key);
        return value === null ? fallback : value;
    } catch (error) {
        return fallback;
    }
}

// Persists `value` (stringified) under `key`; returns true on success.
export function writeStorage(key, value) {
    try {
        localStorage.setItem(key, String(value));
        return true;
    } catch (error) {
        return false;
    }
}

// Best-effort removal — ignores storage being unavailable.
export function removeStorage(key) {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        /* storage unavailable — nothing to clean up */
    }
}
