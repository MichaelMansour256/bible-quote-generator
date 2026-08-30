// ── Test helpers for loading classic <script> files ──────────────────────
// bible-database.js, bible-api.js, and i18n.js are loaded as classic
// scripts in the browser (no type="module").  They define globals on
// `window`.  In Node we evaluate them in a vm context so the same code
// runs unmodified under the test runner.

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const PROJECT_ROOT = path.resolve(path.dirname(import.meta.url), '..');

const BROWSER_APIS = {
    // Minimal localStorage mock
    localStorage: (() => {
        const store = {};
        return {
            getItem: (k) => (k in store ? store[k] : null),
            setItem: (k, v) => { store[k] = String(v); },
            removeItem: (k) => { delete store[k]; },
            clear: () => { for (const k in store) delete store[k]; },
        };
    })(),
    // Minimal matchMedia mock
    matchMedia: () => ({ matches: false, addEventListener: () => {} }),
    // navigator.vibrate for buzz()
    navigator: { vibrate: () => true },
};

/**
 * Evaluate a classic-script file in a vm context whose global scope is
 * `globalThis` (enriched with the simulated browser APIs above).
 * The script's top-level `const`/`class` become real globals.
 *
 * @param {string[]} relPaths  e.g. ['js/core/bible-database.js', 'js/core/bible-api.js']
 * @returns {object} the vm context (globalThis proxy)
 */
export function loadClassicScripts(relPaths) {
    // Seed simulated browser APIs onto globalThis if not already present.
    for (const [key, val] of Object.entries(BROWSER_APIS)) {
        if (!(key in globalThis)) {
            globalThis[key] = val;
        }
    }

    const ctx = vm.createContext(globalThis);

    for (const rel of relPaths) {
        const code = fs.readFileSync(path.resolve(PROJECT_ROOT, rel), 'utf8');
        vm.runInContext(code, ctx, { filename: rel });
    }

    return ctx;
}

export { PROJECT_ROOT };
