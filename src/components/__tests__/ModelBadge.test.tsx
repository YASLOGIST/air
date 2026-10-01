import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ModelBadge } from '../ModelBadge';
import { LanguageProvider } from '../../lib/i18n';

/* The simulation disclosure is the site's honesty mechanism: it must be
   operable by keyboard, announce its state, and close on Escape. */

describe('ModelBadge', () => {
  it('is collapsed initially with aria-expanded=false', () => {
    render(
      <LanguageProvider>
        <ModelBadge />
      </LanguageProvider>,
    );
    const trigger = screen.getByRole('button', { name: /interactive model/i });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    // The disclaimer panel is real text in the tree, but hidden.
    expect(screen.queryByText(/digital twin/i, { exact: false })).toBeInTheDocument();
  });

  it('expands on click and exposes the disclaimer text', async () => {
    const user = userEvent.setup();
    render(
      <LanguageProvider>
        <ModelBadge />
      </LanguageProvider>,
    );
    await user.click(screen.getByRole('button', { name: /interactive model/i }));
    const trigger = screen.getByRole('button', { name: /interactive model/i });
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('note')).toBeVisible();
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    render(
      <LanguageProvider>
        <ModelBadge />
      </LanguageProvider>,
    );
    const trigger = screen.getByRole('button', { name: /interactive model/i });
    await user.click(trigger);
    await user.keyboard('{Escape}');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes on an outside pointer press', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <LanguageProvider>
          <ModelBadge />
        </LanguageProvider>
        <button type="button">elsewhere</button>
      </div>,
    );
    const trigger = screen.getByRole('button', { name: /interactive model/i });
    await user.click(trigger);
    await user.click(screen.getByRole('button', { name: 'elsewhere' }));
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });
});
