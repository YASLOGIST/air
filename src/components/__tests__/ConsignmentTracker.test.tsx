import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConsignmentTracker } from '../ConsignmentTracker';
import { LanguageProvider } from '../../lib/i18n';

/* Major user flow: sample lookup, free-hand AWB lookup, empty-query reset,
   unknown-query failure state, and the simulated-feed disclosure. */

function renderTracker() {
  return render(
    <LanguageProvider>
      <ConsignmentTracker />
    </LanguageProvider>,
  );
}

describe('ConsignmentTracker', () => {
  it('shows the first sample consignment by default with the simulated-feed chip', () => {
    renderTracker();
    expect(screen.getByText(/MASTER AIR WAYBILL · 077-88442115/i)).toBeInTheDocument();
    expect(screen.getByText('SIMULATED FEED')).toBeInTheDocument();
  });

  it('finds a sample by its full AWB via the search field', async () => {
    const user = userEvent.setup();
    renderTracker();
    await user.type(screen.getByLabelText(/Enter Master AWB/i), '176-33910244');
    await user.click(screen.getByRole('button', { name: /Inspect Consignment/i }));
    expect(await screen.findByText(/MASTER AIR WAYBILL · 176-33910244/i)).toBeInTheDocument();
    expect(screen.getByText(/Cross-Border E-Commerce Pouches/i)).toBeInTheDocument();
  });

  it('finds a sample by flight number', async () => {
    const user = userEvent.setup();
    renderTracker();
    await user.type(screen.getByLabelText(/Enter Master AWB/i), 'MS-958');
    await user.click(screen.getByRole('button', { name: /Inspect Consignment/i }));
    expect(await screen.findByText(/MS-958 · PVG → CAI/i)).toBeInTheDocument();
  });

  it('reports a structured not-found for a short unknown query', async () => {
    const user = userEvent.setup();
    renderTracker();
    await user.type(screen.getByLabelText(/Enter Master AWB/i), 'ZZ1');
    await user.click(screen.getByRole('button', { name: /Inspect Consignment/i }));
    expect(await screen.findByText(/No active shipment found/i)).toBeInTheDocument();
  });

  it('resets to the default sample on an empty query', async () => {
    const user = userEvent.setup();
    renderTracker();
    await user.type(screen.getByLabelText(/Enter Master AWB/i), '999-00000000');
    await user.click(screen.getByRole('button', { name: /Inspect Consignment/i }));
    // long numeric query → simulated consignment
    expect(await screen.findByText(/VERIFIED · PRE-LODGED/i)).toBeInTheDocument();

    await user.clear(screen.getByLabelText(/Enter Master AWB/i));
    await user.click(screen.getByRole('button', { name: /Inspect Consignment/i }));
    expect(await screen.findByText(/MASTER AIR WAYBILL · 077-88442115/i)).toBeInTheDocument();
  });

  it('jumps directly to a sample via the quick buttons', async () => {
    const user = userEvent.setup();
    renderTracker();
    await user.click(screen.getByRole('button', { name: '074-11028863' }));
    expect(await screen.findByText(/KL-553 · AMS → CAI/i)).toBeInTheDocument();
  });
});
