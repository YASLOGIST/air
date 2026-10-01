(() => {
  try {
    const storedTheme = localStorage.getItem('yaslogist-air-theme');
    const theme = storedTheme === 'light' || storedTheme === 'dark'
      ? storedTheme
      : matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    const language = localStorage.getItem('yaslogist-air-lang') === 'ar' ? 'ar' : 'en';
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.classList.add(theme);
    root.lang = language;
    root.dir = language === 'ar' ? 'rtl' : 'ltr';
  } catch {
    // Browser privacy settings may disable storage; static defaults remain safe.
  }
})();
