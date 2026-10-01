import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import React from 'react';
import Axe from 'axe-core';
import App from './App';
import { ThemeProvider } from './lib/theme';
import { LanguageProvider } from './lib/i18n';

/* End-to-end smoke of the composed page (all 11 sections, navbar, footer),
   plus an automated WCAG scan. Component tests elsewhere deliberately run
   with prefers-reduced-motion: reduce, so what renders here is exactly the
   calm render path. */

function renderApp() {
  return render(
    <React.StrictMode>
      <ThemeProvider>
        <LanguageProvider>
          <App />
        </LanguageProvider>
      </ThemeProvider>
    </React.StrictMode>,
  );
}

describe('App', () => {
  it('renders the full section stack', () => {
    renderApp();
    expect(screen.getByRole('banner')).toBeInTheDocument(); // <header> navbar
    expect(screen.getByRole('main')).toBeInTheDocument();

    const main = screen.getByRole('main');
    expect(within(main).getByLabelText('Arrival digital twin')).toBeInTheDocument();
    for (const heading of [
      /Engineered Standards & Measurable SLAs/i,
      /Real-Time e-AWB Tracking & Customs Audit/i,
      /Air Freight Volumetric & Carbon Simulator/i,
    ]) {
      expect(within(main).getAllByRole('heading', { name: heading }).length).toBeGreaterThan(0);
    }
    expect(screen.getByRole('contentinfo')).toBeInTheDocument(); // <footer>
  });

  it('renders exactly one h1 (the cinematic stage headline)', () => {
    renderApp();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('exposes the skip-to-content link first in the focus order', () => {
    renderApp();
    const skip = screen.getByRole('link', { name: /Skip to main content/i });
    expect(skip).toHaveAttribute('href', '#main');
    expect(document.querySelector('a')).toBe(skip); // first anchor in the DOM
  });

  it('renders the quote conversion CTA in the navbar', () => {
    renderApp();
    expect(screen.getAllByRole('button', { name: /Request Quote/i }).length).toBeGreaterThan(0);
  });

  it('has no axe violations on initial render', async () => {
    renderApp();
    const results = await Axe.run(document.body, {
      // jsdom has no layout engine: colour-contrast and visual-only rules
      // cannot be evaluated here and are excluded rather than false-passed.
      rules: {
        'color-contrast': { enabled: false },
        'page-has-heading-one': { enabled: false },
      },
    });
    const violations = results.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      nodes: v.nodes.map((n) => n.target.join(' ')),
    }));
    expect(violations).toEqual([]);
  });
});
