// Shared theme handling: dark/light toggle persisted through the storage
// service so a blocked localStorage can never break page rendering.
import { readStorage, writeStorage, STORAGE_KEYS } from '../services/storage.js';

export const themeMixin = {
    setupThemeToggle() {
        const themeToggle = document.getElementById('theme-toggle');
        if (!themeToggle) return;

        // Load saved theme preference
        const savedTheme = readStorage(STORAGE_KEYS.theme, 'dark');
        this.setTheme(savedTheme);

        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            this.setTheme(newTheme);
        });
    },

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        writeStorage(STORAGE_KEYS.theme, theme);
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.textContent = theme === 'dark' ? '🌙' : '☀️';
        }
    }
};
