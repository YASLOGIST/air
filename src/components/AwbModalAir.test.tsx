import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { LanguageProvider } from '../lib/i18n';
import { AwbModalAir } from './AwbModalAir';

function renderModal(onClose = () => undefined) {
  return render(<LanguageProvider><AwbModalAir isOpen onClose={onClose} /></LanguageProvider>);
}

describe('AWB verification flow', () => {
  it('validates structure without claiming operational status', async () => {
    const user = userEvent.setup();
    const view = renderModal();
    await user.click(screen.getByRole('button', { name: /check|تحقق/i }));
    expect(await screen.findByText(/Valid AWB number structure/i)).toBeInTheDocument();
    expect(screen.getByText(/does not confirm a booking/i)).toBeInTheDocument();
    expect(view.container.textContent).not.toMatch(/PRE-APPROVED FOR/);
  });

  it('is keyboard closable and has no detectable accessibility violations', async () => {
    const onClose = vi.fn();
    const view = renderModal(onClose);
    expect((await axe(view.container)).violations).toHaveLength(0);
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledOnce();
  });
});
