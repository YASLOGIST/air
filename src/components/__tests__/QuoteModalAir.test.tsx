import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuoteModalAir } from '../QuoteModalAir';
import { LanguageProvider } from '../../lib/i18n';

/* Major user flow for the new conversion path: fill the shipment card,
   verify the composed channels (mailto / tel / wa.me) pick up the draft,
   and confirm dialog dismissal. */

function renderQuote() {
  return render(
    <LanguageProvider>
      <QuoteModalAir isOpen onClose={() => {}} />
    </LanguageProvider>,
  );
}

describe('QuoteModalAir', () => {
  it('renders all labelled shipment fields', () => {
    renderQuote();
    expect(screen.getByLabelText(/Origin \(City \/ IATA\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Destination \(City \/ IATA\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Gross Weight \(kg\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Commodity & Temperature/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Urgency Level/i)).toBeInTheDocument();
  });

  it('composes the email channel from the draft', async () => {
    const user = userEvent.setup();
    renderQuote();
    await user.type(screen.getByLabelText(/Origin \(City \/ IATA\)/i), 'Frankfurt (FRA)');
    await user.type(screen.getByLabelText(/Destination \(City \/ IATA\)/i), 'Cairo (CAI)');
    await user.type(screen.getByLabelText(/Gross Weight \(kg\)/i), '450');
    await user.type(screen.getByLabelText(/Commodity & Temperature/i), 'Pharma biologics 2-8C');

    const mail = screen.getByRole('link', { name: /Send by Email/i }) as HTMLAnchorElement;
    expect(mail.href).toContain('mailto:contact@yaslogist.me');
    const decoded = decodeURIComponent(mail.href);
    expect(decoded).toContain('Frankfurt (FRA)');
    expect(decoded).toContain('Cairo (CAI)');
    expect(decoded).toContain('450');
    expect(decoded).toContain('Critical — earliest uplift, 24/7 desk');
  });

  it('exposes the phone and WhatsApp channels with the published contacts', () => {
    renderQuote();
    const call = screen.getByRole('link', { name: /Call the Air Desk/i }) as HTMLAnchorElement;
    expect(call.href).toBe('tel:+201041139910');

    const wa = screen.getByRole('link', { name: /WhatsApp Desk/i }) as HTMLAnchorElement;
    expect(wa.href).toContain('https://wa.me/201041139910');
    expect(wa.href).toContain('text=');
    expect(wa).toHaveAttribute('target', '_blank');
    expect(wa).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('reflects urgency changes in the composed request', async () => {
    const user = userEvent.setup();
    renderQuote();
    await user.selectOptions(screen.getByLabelText(/Urgency Level/i), 'AOG');
    const mail = screen.getByRole('link', { name: /Send by Email/i }) as HTMLAnchorElement;
    expect(decodeURIComponent(mail.href)).toContain('AOG — aircraft-on-ground recovery');
  });

  it('states that nothing is transmitted from the page', () => {
    renderQuote();
    expect(screen.getByText(/No account, no tracking/i)).toBeInTheDocument();
  });

  it('closes on Escape (dialog semantics from useDialog)', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <LanguageProvider>
        <QuoteModalAir isOpen onClose={onClose} />
      </LanguageProvider>,
    );
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
