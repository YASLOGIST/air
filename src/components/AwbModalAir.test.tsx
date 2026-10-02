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

  it('suggests the corrected check digit for a failed Mod-7 and applies it on click', async () => {
    const user = userEvent.setup();
    renderModal();
    const input = screen.getByRole('textbox');
    await user.clear(input);
    await user.type(input, '077-94821032'); // wrong check digit (should be 1)
    await user.click(screen.getByRole('button', { name: /check|تحقق/i }));
    expect(await screen.findByText(/Invalid AWB number structure/i)).toBeInTheDocument();
    const suggestion = await screen.findByRole('button', { name: /did you mean/i });
    expect(suggestion.textContent).toContain('077-94821031');
    await user.click(suggestion);
    expect(await screen.findByText(/Valid AWB number structure/i)).toBeInTheDocument();
    expect(input).toHaveValue('077-94821031');
  });

  it('offers no suggestion for structurally unparseable input', async () => {
    const user = userEvent.setup();
    renderModal();
    const input = screen.getByRole('textbox');
    await user.clear(input);
    await user.type(input, 'not-an-awb');
    await user.click(screen.getByRole('button', { name: /check|تحقق/i }));
    expect(await screen.findByText(/Invalid AWB number structure/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /did you mean/i })).not.toBeInTheDocument();
  });

  it('is keyboard closable and has no detectable accessibility violations', async () => {
    const onClose = vi.fn();
    const view = renderModal(onClose);
    expect((await axe(view.container)).violations).toHaveLength(0);
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledOnce();
  });
});
