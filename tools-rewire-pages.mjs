// Rewires relative references after moving the feature pages into pages/.
// - Moved pages: asset/css/js references gain a `../` prefix; links back to
//   the home page become `../index.html` (sibling page links stay unchanged).
// - index.html: navbar links gain the `pages/` prefix.
// - js/shared/navigation.js: home-card targets gain the `pages/` prefix.
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const write = (p, c) => fs.writeFileSync(path.join(root, p), c);
const replaceAll = (text, from, to) => {
    if (!text.includes(from)) throw new Error(`pattern not found: ${from}`);
    return text.split(from).join(to);
};

const movedPages = ['quote.html', 'memory.html', 'reverse.html', 'scramble.html',
    'whoami.html', 'wordle.html', 'emojiverse.html'];

for (const page of movedPages) {
    let html = read(path.join('pages', page));
    // Local asset/css/js references get one directory deeper.
    html = replaceAll(html, '"css/', '"../css/');
    html = replaceAll(html, '"js/', '"../js/');
    html = replaceAll(html, '"assets/', '"../assets/');
    // Links back to the home page (navbar brand + home link).
    html = replaceAll(html, 'href="index.html"', 'href="../index.html"');
    write(path.join('pages', page), html);
    console.log('rewired pages/' + page);
}

// index.html navbar + any other local links to the moved pages.
let index = read('index.html');
for (const page of movedPages) {
    index = replaceAll(index, `"${page}"`, `"pages/${page}"`);
}
write('index.html', index);
console.log('rewired index.html');

// Home launcher card navigation targets live in the shared navigation mixin.
const navPath = 'js/shared/navigation.js';
let nav = read(navPath);
for (const page of movedPages) {
    nav = replaceAll(nav, `'${page}'`, `'pages/${page}'`);
}
write(navPath, nav);
console.log('rewired js/shared/navigation.js');
