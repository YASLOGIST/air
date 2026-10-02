/* Resolves theme, language and direction before first paint so the page never
   flashes the wrong surface. Kept as an external file (not inline) so the
   Content-Security-Policy can stay at `script-src 'self'` with no carve-out.

   THEME_COLORS mirrors the table exported from src/lib/theme.tsx; the two are
   pinned together by src/test/theme-color.test.ts. */
(() => {
  const THEME_COLORS = { dark: '#070C14', light: '#F8FAFC' };
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
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.setAttribute('content', THEME_COLORS[theme]);
  } catch {
    // Browser privacy settings may disable storage; static defaults remain safe.
  }
})();
