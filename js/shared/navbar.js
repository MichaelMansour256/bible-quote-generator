// Shared top-navigation behaviour: responsive hamburger toggle that opens
// the link drawer on small screens and closes it again after any tap.
export const navbarMixin = {
    // Wire the responsive hamburger menu used by the top navigation bar.
    setupNavbar() {
        const toggle = document.querySelector('.navbar-toggle');
        const navbar = document.querySelector('.navbar');
        if (!toggle || !navbar) return;

        toggle.addEventListener('click', () => {
            const isOpen = navbar.classList.toggle('open');
            toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            toggle.setAttribute('aria-label', isOpen ? 'إغلاق القائمة' : 'القائمة');
        });

        // Close the menu after tapping a link or the language/theme buttons.
        const close = () => navbar.classList.remove('open');
        navbar.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
        document.querySelectorAll('.navbar .nav-btn').forEach(btn => btn.addEventListener('click', close));
    }
};
