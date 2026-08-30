// Validation: every local href/src in every HTML page (root + pages/) must
// resolve relative to that page's own location; every ES-module import in
// js/ must resolve; the old flat layout must be gone.
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
let failures = 0;
const fail = (msg) => { failures += 1; console.error('FAIL:', msg); };

const htmlFiles = [];
(function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(p);
        else if (entry.name.endsWith('.html')) htmlFiles.push(p);
    }
})('.');
for (const file of htmlFiles) {
    const html = fs.readFileSync(file, 'utf8');
    const refs = [...html.matchAll(/(?:href|src)="([^"#]+)"/g)].map((m) => m[1]);
    for (const ref of refs) {
        if (/^(https?:)?\/\//.test(ref) || ref.startsWith('mailto:')) continue;
        if (!fs.existsSync(path.resolve(path.dirname(path.join(root, file)), ref))) {
            fail(`${file} -> ${ref}`);
        }
    }
}

const jsFiles = [];
(function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(p);
        else if (entry.name.endsWith('.js')) jsFiles.push(p);
    }
})('js');
for (const file of jsFiles) {
    const src = fs.readFileSync(file, 'utf8');
    for (const imp of [...src.matchAll(/from\s+'([^']+)'/g)].map((m) => m[1])) {
        const resolved = path.join(path.dirname(file), imp).replace(/\\/g, '/');
        if (!fs.existsSync(resolved)) fail(`${file} -> ${imp}`);
    }
}

// Layout expectations.
const expectMissing = ['quote.html', 'memory.html', 'reverse.html', 'scramble.html',
    'whoami.html', 'wordle.html', 'emojiverse.html', 'styles.css', 'js/main.js'];
for (const p of expectMissing) {
    if (fs.existsSync(path.join(root, p))) fail(`expected to be gone: ${p}`);
}
const expectPresent = ['index.html', 'pages/quote.html', 'pages/memory.html', 'pages/reverse.html',
    'pages/scramble.html', 'pages/whoami.html', 'pages/wordle.html', 'pages/emojiverse.html'];
for (const p of expectPresent) {
    if (!fs.existsSync(path.join(root, p))) fail(`expected to exist: ${p}`);
}

console.log(`checked ${htmlFiles.length} html pages, ${jsFiles.length} js files`);
console.log(failures === 0 ? 'ALL CHECKS PASSED ✔' : `${failures} failures`);
process.exitCode = failures === 0 ? 0 : 1;
