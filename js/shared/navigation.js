// Shared navigation helpers: the legacy in-page view switcher, the active
// view guard used by the quote search, and the home launcher card routing.
export const navigationMixin = {
    setupViewSwitcher() {
        this.viewButtons = {
            home: document.getElementById('home-view-btn'),
            quote: document.getElementById('quote-view-btn'),
            game: document.getElementById('game-view-btn'),
            reverse: document.getElementById('reverse-view-btn'),
            scramble: document.getElementById('scramble-view-btn'),
            whoami: document.getElementById('whoami-view-btn')
        };

        this.viewPanels = {
            home: document.getElementById('home-view-panel'),
            quote: document.getElementById('quote-view-panel'),
            game: document.getElementById('game-view-panel'),
            reverse: document.getElementById('reverse-view-panel'),
            scramble: document.getElementById('scramble-view-panel'),
            whoami: document.getElementById('whoami-view-panel')
        };

        Object.entries(this.viewButtons).forEach(([key, btn]) => {
            if (btn) btn.addEventListener('click', () => this.setActiveView(key));
        });

        // Home launcher cards jump directly to their feature page.
        document.querySelectorAll('.home-card').forEach(card => {
            card.addEventListener('click', () => {
                if (card.dataset.target) this.setActiveView(card.dataset.target);
            });
        });

        this.setActiveView('home');
    },

    setActiveView(view) {
        if (!this.viewButtons || !this.viewPanels || !this.viewPanels[view]) return;

        this.activeView = view;

        // Quote and Memory need the full Bible dataset; load it on demand only
        // the first time one of these views is opened.
        if (view === 'quote' || view === 'game') {
            this.ensureBibleDataLoaded();
        }

        Object.entries(this.viewButtons).forEach(([key, btn]) => {
            if (btn) btn.classList.toggle('active', key === view);
        });

        Object.entries(this.viewPanels).forEach(([key, panel]) => {
            if (panel) panel.classList.toggle('hidden', key !== view);
        });
    },

    // Home launcher cards jump directly to their feature pages.
    // (Extracted from the page dispatcher's `default` case.)
    wireHomeCardNavigation() {
        const pageTargets = {
            quote: 'pages/quote.html',
            game: 'pages/memory.html',
            reverse: 'pages/reverse.html',
            scramble: 'pages/scramble.html',
            whoami: 'pages/whoami.html',
            wordle: 'pages/wordle.html',
            emojiverse: 'pages/emojiverse.html'
        };
        document.querySelectorAll('.home-card[data-target]').forEach(card => {
            card.addEventListener('click', () => {
                const href = pageTargets[card.dataset.target];
                if (href) window.location.href = href;
            });
        });
    }
};
