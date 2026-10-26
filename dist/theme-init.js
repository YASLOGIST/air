/* Resolves theme, language and direction before first paint so the page never
   flashes the wrong surface. Kept as an external file (not inline) so the
   Content-Security-Policy can stay at `script-src 'self'` with no carve-out.

   Daylight is the default surface: an explicit saved choice wins, otherwise
   the site paints white regardless of the OS preference. The dark cockpit
   remains one click away through the navbar toggle.

   THEME_COLORS mirrors the table exported from src/lib/theme.tsx; the two are
   pinned together by src/test/theme-color.test.ts. */
(() => {
  const THEME_COLORS = { dark: '#070C14', light: '#FFFFFF' };
  try {
    const storedTheme = localStorage.getItem('yaslogist-air-theme');
    const theme = storedTheme === 'dark' ? 'dark' : 'light';
    const language = localStorage.getItem('yaslogist-air-lang') === 'ar' ? 'ar' : 'en';
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    root.lang = language;
    /* Direction is fixed LTR; only the copy switches language. */
    root.dir = 'ltr';
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.setAttribute('content', THEME_COLORS[theme]);
  } catch {
    // Browser privacy settings may disable storage; static defaults remain safe.
  }
})();
