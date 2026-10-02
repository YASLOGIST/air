import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '../lib/theme';
import { LanguageProvider } from '../lib/i18n';
import { CinematicStage } from './CinematicStage';

/* The hero HUD used to carry `aria-live="polite"` on the whole card, which
   also contained the scrub percentage. That percentage updates on every
   animation frame of a 320vh scroll, so a screen reader re-announced the
   badge, the counter, the headline, the body copy and all four telemetry
   tiles continuously for the length of the stage. Only the phase transition
   is news. */

function renderStage() {
  return render(
    <ThemeProvider>
      <LanguageProvider>
        <CinematicStage />
      </LanguageProvider>
    </ThemeProvider>,
  );
}

describe('cinematic stage announcements', () => {
  it('announces the phase and nothing else', () => {
    const { container } = renderStage();

    const liveRegions = container.querySelectorAll('[aria-live], [role="status"], [role="alert"]');
    expect(liveRegions).toHaveLength(1);

    const [region] = liveRegions;
    expect(region).toHaveAttribute('role', 'status');
    expect(region.textContent).toMatch(/\S/);
    // The scrub readout must stay out of the announcement.
    expect(region.textContent).not.toMatch(/%/);
  });

  it('keeps the frame-rate scrub readout out of the accessibility tree', () => {
    const { container } = renderStage();

    const percentage = [...container.querySelectorAll('span')].find((node) =>
      /^\d+%$/.test(node.textContent ?? ''),
    );
    expect(percentage, 'scrub percentage readout not found').toBeDefined();
    expect(percentage).toHaveAttribute('aria-hidden', 'true');
  });

  it('still exposes the phase headline as the page heading', () => {
    renderStage();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });
});
