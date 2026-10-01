import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AwbModalAir } from '../AwbModalAir';
import { LanguageProvider } from '../../lib/i18n';

/* Full user flow for the e-AWB checksum checker: verdicts, verdict reset on
   edit, honest carrier naming, and dialog dismissal via Escape. */

function renderModal() {
  return render(
    <LanguageProvider>
      <AwbModalAir isOpen onClose={() => {}} />
    </LanguageProvider>,
  );
}

describe('AwbModalAir', () => {
  it('renders the dialog with the valid sample pre-filled and no verdict yet', () => {
    renderModal();
    const input = screen.getByLabelText(/11-digit iata awb/i);
    expect(input).toHaveValue('077-94821031');
    // No verdict before the user asks for one.
    expect(screen.queryByText(/Valid IATA e-AWB Format/i)).toBeNull();
    expect(screen.queryByText(/Invalid Checksum/i)).toBeNull();
  });

  it('passes the documented Mod-7-valid sample and names EgyptAir Cargo', async () => {
    const user = userEvent.setup();
    renderModal();
    await user.click(screen.getByRole('button', { name: /check/i }));
    expect(await screen.findByText(/Valid IATA e-AWB Format/i)).toBeInTheDocument();
    expect(screen.getByText(/077 \(EgyptAir Cargo\)/)).toBeInTheDocument();
  });

  it('fails a wrong check digit and shows the failure branch', async () => {
    const user = userEvent.setup();
    renderModal();
    await user.clear(screen.getByLabelText(/11-digit iata awb/i));
    await user.type(screen.getByLabelText(/11-digit iata awb/i), '077-94821032');
    await user.click(screen.getByRole('button', { name: /check/i }));
    expect(await screen.findByText(/Invalid Checksum/i)).toBeInTheDocument();
    // The carrier row belongs to the success branch only.
    expect(screen.queryByText(/EgyptAir Cargo/)).toBeNull();
  });

  it('retracts the verdict as soon as the number is edited', async () => {
    const user = userEvent.setup();
    renderModal();
    await user.click(screen.getByRole('button', { name: /check/i }));
    expect(await screen.findByText(/Valid IATA e-AWB Format/i)).toBeInTheDocument();
    const input = screen.getByLabelText(/11-digit iata awb/i);
    await user.type(input, '9');
    expect(screen.queryByText(/Valid IATA e-AWB Format/i)).toBeNull();
    expect(screen.queryByText(/Invalid Checksum/i)).toBeNull();
  });

  it('rejects letters in the serial instead of parseInt-coercing them', async () => {
    const user = userEvent.setup();
    renderModal();
    await user.clear(screen.getByLabelText(/11-digit iata awb/i));
    await user.type(screen.getByLabelText(/11-digit iata awb/i), '077-884421A5');
    await user.click(screen.getByRole('button', { name: /check/i }));
    expect(await screen.findByText(/Invalid Checksum/i)).toBeInTheDocument();
  });

  it('closes on Escape (dialog semantics from useDialog)', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <LanguageProvider>
        <AwbModalAir isOpen onClose={onClose} />
      </LanguageProvider>,
    );
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
