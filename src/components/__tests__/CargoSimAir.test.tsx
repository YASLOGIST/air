import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CargoSimAir } from '../CargoSimAir';
import { LanguageProvider } from '../../lib/i18n';

/* Major user flow: preset selection drives the IATA chargeable-weight engine,
   and dragging the distance off a scheduled corridor removes the ocean
   comparison rather than inventing one. */

function renderSim() {
  return render(
    <LanguageProvider>
      <CargoSimAir />
    </LanguageProvider>,
  );
}

describe('CargoSimAir', () => {
  it('shows the default 80×60×50 / 45 kg benchmark as gross-billed', () => {
    renderSim();
    // 80×60×50 → 40 kg volumetric < 45 kg gross → chargeable 45
    expect(screen.getAllByText('45')[0]).toBeInTheDocument();
    expect(screen.getByText(/Billed on Gross Weight/i)).toBeInTheDocument();
  });

  it('applies the voluminous e-commerce preset and switches the billing basis', async () => {
    const user = userEvent.setup();
    renderSim();
    await user.click(screen.getByRole('button', { name: /E-Commerce Textiles/i }));
    // 120×90×80 → 144 kg volumetric > 40 kg gross → chargeable 144
    expect(await screen.findByText('144')).toBeInTheDocument();
    expect(screen.getByText(/Billed on Volumetric Weight/i)).toBeInTheDocument();
  });

  it('applies the pharma preset and shows its corridor context', async () => {
    const user = userEvent.setup();
    renderSim();
    await user.click(screen.getByRole('button', { name: /Pharma Biologics/i }));
    expect(await screen.findByText(/FRA ⇄ CAI · scheduled corridor/i)).toBeInTheDocument();
  });

  it('drops the ocean comparison when the distance leaves the scheduled network', async () => {
    renderSim();

    // On the default FRA corridor the sea lane comparison is present.
    expect(screen.getByText(/Hamburg → Alexandria/i)).toBeInTheDocument();

    // Drag distance off-lane: set the slider to a freehand value.
    // (jsdom does not implement range-keyboard semantics, so we drive the
    // input event directly — same DOM contract as a drag.)
    const distanceSlider = screen.getByLabelText(/Flight Distance \(km\)/i);
    fireEvent.change(distanceSlider, { target: { value: '4000' } });
    expect(
      await screen.findByText(/Freehand distance — outside the scheduled network/i),
    ).toBeInTheDocument();
    // The sea lane block is replaced by the honest "cannot be derived" note.
    expect(screen.queryByText(/Hamburg → Alexandria/i)).toBeNull();
  });

  it('rounds volume to three decimals in the header', () => {
    renderSim();
    // 80×60×50 = 0.24 CBM exactly
    expect(screen.getByText(/0\.24 CBM \(m³\)/i)).toBeInTheDocument();
  });
});
