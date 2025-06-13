(() => {
    'use strict'

    const getStoredTheme = () => localStorage.getItem('theme');
    const setStoredTheme = theme => localStorage.setItem('theme', theme);

    const getPreferredTheme = () => {
        const storedTheme = getStoredTheme();
        if (storedTheme) {
            return storedTheme;
        }
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    const setTheme = theme => {
        document.documentElement.setAttribute('data-bs-theme', theme);
    }

    const showActiveThemeIcon = theme => {
        const themeSwitcherIcon = document.querySelector('.theme-icon-active i');
        const activeButton = document.querySelector(`[data-bs-theme-value="${theme}"]`);
        
        if (activeButton && themeSwitcherIcon) {
            const activeIconClass = activeButton.querySelector('i').className;
            themeSwitcherIcon.className = activeIconClass;
        }
    }

    // Setam tema la incarcarea paginii
    setTheme(getPreferredTheme());

    // Actualizam iconita dupa ce DOM-ul este gata
    window.addEventListener('DOMContentLoaded', () => {
        showActiveThemeIcon(getPreferredTheme());

        // Adaugam event listener-ele pe butoanele din dropdown
        document.querySelectorAll('[data-bs-theme-value]').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                const theme = e.currentTarget.getAttribute('data-bs-theme-value');
                setStoredTheme(theme);
                setTheme(theme);
                showActiveThemeIcon(theme);
            });
        });
    });
})()