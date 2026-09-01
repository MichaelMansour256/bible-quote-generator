// Shared top-navigation behaviour: responsive hamburger toggle that opens
// the link drawer on small screens, plus a data-driven "Games" dropdown that
// can keep growing as new Bible games are added without editing any page HTML.
//
// Adding a new game = one entry in NAV_GAMES below. The dropdown menu, the
// active-state highlight and the mobile collapsible section are all generated
// from this array on every page.

export const NAV_GAMES = [
    { key: 'quote',      file: 'quote.html',      icon: '\u{1F5BC}\uFE0F' }, // 🖼️
    { key: 'memory',     file: 'memory.html',     icon: '\u{1F9E0}' },        // 🧠
    { key: 'reverse',    file: 'reverse.html',    icon: '\u{1F501}' },        // 🔁
    { key: 'scramble',   file: 'scramble.html',   icon: '\u{1F524}' },        // 🔤
    { key: 'whoami',     file: 'whoami.html',     icon: '\u{1F575}\uFE0F' },  // 🕵️
    { key: 'wordle',     file: 'wordle.html',     icon: '\u{1F7E9}' },        // 🟩
    { key: 'emojiverse', file: 'emojiverse.html', icon: '\u{1F604}' },        // 😄
    { key: 'crossword',  file: 'crossword.html',  icon: '\u{1F520}' }         // 🔠
];

export const navbarMixin = {
    // Wire the responsive hamburger menu used by the top navigation bar.
    setupNavbar() {
        const toggle = document.querySelector('.navbar-toggle');
        const navbar = document.querySelector('.navbar');
        if (!navbar) return;

        this.buildGamesDropdown(navbar);
        this.markActiveNavLink();

        if (!toggle) return;

        toggle.addEventListener('click', () => {
            const isOpen = navbar.classList.toggle('open');
            toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            toggle.setAttribute('aria-label', isOpen ? 'إغلاق القائمة' : 'القائمة');
        });

        // Close the menu after tapping a link or the language/theme buttons.
        const close = () => navbar.classList.remove('open');
        navbar.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
        document.querySelectorAll('.navbar .nav-btn').forEach(btn => btn.addEventListener('click', close));
    },

    // Hydrate the Games dropdown from the NAV_GAMES array (data-driven).
    buildGamesDropdown(navbar) {
        const menu = document.getElementById('navbar-games-menu');
        const rootEl = document.getElementById('navbar-games');
        if (!menu || !rootEl) return;

        const isPagesDir = /\/pages\//.test(window.location.pathname);
        const base = isPagesDir ? '' : 'pages/';
        const currentPage = (document.body && document.body.dataset.page) || '';

        NAV_GAMES.forEach(game => {
            const item = document.createElement('li');
            const link = document.createElement('a');
            link.className = 'navbar-link';
            link.href = base + game.file;
            link.dataset.navKey = game.key;

            const icon = document.createElement('span');
            icon.className = 'games-menu-icon';
            icon.textContent = game.icon;
            icon.setAttribute('aria-hidden', 'true');

            const label = document.createElement('span');
            label.dataset.i18n = `nav-short-${game.key}`;
            label.textContent = (typeof I18N !== 'undefined' && I18N.t(`nav-short-${game.key}`)) || '';

            link.appendChild(icon);
            link.appendChild(label);
            if (currentPage === game.key) link.classList.add('active');
            item.appendChild(link);
            menu.appendChild(item);
        });

        const toggleBtn = rootEl.querySelector('.navbar-games-toggle');

        // Highlight the Games toggle when the current page is one of the games.
        if (NAV_GAMES.some(game => game.key === currentPage)) {
            if (toggleBtn) {
                toggleBtn.classList.add('active');
                toggleBtn.setAttribute('aria-current', 'page');
            }
        }

        // Click (touch + keyboard) open/close.
        if (toggleBtn) {
            toggleBtn.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                const isOpen = rootEl.classList.toggle('open');
                toggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            });
        }

        // Close the dropdown when clicking anywhere outside it.
        document.addEventListener('click', (event) => {
            if (rootEl.contains(event.target)) return;
            rootEl.classList.remove('open');
            if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
        });

        // Close on Escape.
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                rootEl.classList.remove('open');
                if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
            }
        });
    },

    // Mark the top-level home link as active on the home page.
    markActiveNavLink() {
        const currentPage = (document.body && document.body.dataset.page) || '';
        if (currentPage !== 'home') return;
        const homeLink = document.querySelector('.navbar-links a[data-i18n="nav-short-home"]');
        if (homeLink) homeLink.classList.add('active');
    }
};
