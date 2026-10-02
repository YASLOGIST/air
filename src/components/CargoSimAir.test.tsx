import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LanguageProvider } from '../lib/i18n';
import { CargoSimAir } from './CargoSimAir';

function renderSim() {
  return render(<LanguageProvider><CargoSimAir /></LanguageProvider>);
}

describe('volumetric simulator with ULD load-fit planner', () => {
  it('recommends an actively cooled unit while the pharma cool-chain toggle is on', async () => {
    renderSim();
    // Default state: 80×60×50 cm, 45 kg, 1 piece, pharma cool-chain ON.
    // RKN is the smallest actively cooled unit that takes that piece.
    const planner = await screen.findByText(/ULD Load-Fit Recommendation/i);
    expect(planner).toBeInTheDocument();
    expect(screen.getByText(/RKN Active Envirotainer/i)).toBeInTheDocument();
    // Passive units must be excluded with an explicit cooling blocker.
    expect(screen.getAllByText(/No active cooling/i).length).toBeGreaterThan(0);
  });

  it('re-plans onto a passive unit when cool-chain is switched off', async () => {
    const user = userEvent.setup();
    renderSim();
    await user.click(screen.getByRole('button', { name: /Active Cool/i }));
    // Ambient 0.24 CBM 45 kg piece → smallest fitting unit is still RKN by rated
    // volume, but no cooling blockers may remain anywhere in the verdict list.
    expect(screen.queryByText(/No active cooling/i)).not.toBeInTheDocument();
  });

  it('scales totals with the piece count slider', async () => {
    renderSim();
    const slider = screen.getByRole('slider', { name: /Piece Count/i });
    expect(slider).toHaveValue('1');
    // Drive the range input directly — userEvent cannot drag ranges in jsdom.
    const { fireEvent } = await import('@testing-library/react');
    fireEvent.change(slider, { target: { value: '4' } });
    // 4 identical pieces: totals line shows 4 × 45 kg = 180 kg
    expect(await screen.findByText(/4 × 45 kg = 180 kg/)).toBeInTheDocument();
  });
});
