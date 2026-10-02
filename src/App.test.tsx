import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { ThemeProvider } from './lib/theme';
import { LanguageProvider } from './lib/i18n';
import App from './App';

/* End-to-end-ish smoke test: the real provider stack, the real lazy section
   graph. It is the regression net for the shell changes (per-section error
   boundaries, scene/scroll loop rewrites) — any of which could have left the
   page blank without a single unit test noticing. */
function renderApp() {
  return render(
    <ThemeProvider>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </ThemeProvider>,
  );
}

describe('application shell', () => {
  it('mounts the chrome and resolves every lazily loaded section', async () => {
    renderApp();

    // Shell renders synchronously.
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /skip to main content/i })).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();

    // Every deferred section arrives, each behind its own boundary.
    for (const id of ['radar', 'simulator', 'uld', 'cargovillage', 'corridors', 'tracker']) {
      await waitFor(() => expect(document.getElementById(id)).not.toBeNull(), { timeout: 10_000 });
    }

    // Anchor targets in the navbar must exist, or in-page navigation breaks.
    const anchors = [...document.querySelectorAll<HTMLAnchorElement>('nav a[href^="#"]')]
      .map((anchor) => anchor.getAttribute('href')!)
      .filter((href) => href.length > 1);
    expect(anchors.length).toBeGreaterThan(0);
    for (const href of new Set(anchors)) {
      expect(document.querySelector(href), `missing anchor target ${href}`).not.toBeNull();
    }

    // No section fell back to the error card.
    expect(screen.queryByText(/could not be loaded/i)).not.toBeInTheDocument();
  }, 30_000);

  it('has no detectable axe violations on the rendered page', async () => {
    const { container } = renderApp();
    await waitFor(() => expect(document.getElementById('tracker')).not.toBeNull(), { timeout: 10_000 });

    const results = await axe(container, {
      // Colour contrast cannot be evaluated in jsdom (no layout/paint).
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  }, 60_000);
});
