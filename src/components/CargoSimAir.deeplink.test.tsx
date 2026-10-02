import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

/* SHARED_SCENARIO is read at module evaluation, so this suite sets the URL
   first, resets the module registry, and imports a fresh component graph.
   Both the provider and the component must come from the same fresh graph,
   otherwise they would hold two different React contexts. */

async function renderWithUrl(url: string) {
  window.history.replaceState({}, '', url);
  vi.resetModules();
  const [{ LanguageProvider }, { CargoSimAir }] = await Promise.all([
    import('../lib/i18n'),
    import('./CargoSimAir'),
  ]);
  return render(<LanguageProvider><CargoSimAir /></LanguageProvider>);
}

afterEach(() => {
  cleanup();
  window.history.replaceState({}, '', '/');
});

describe('simulator deep-link restore', () => {
  it('restores sliders, corridor, and toggles from a shared URL', async () => {
    await renderWithUrl('/?sim=1&l=100&w=70&h=60&kg=200&pc=2&cor=corridor-dxb-cai&ph=0&pr=1#simulator');
    expect(screen.getByRole('slider', { name: /Length/i })).toHaveValue('100');
    expect(screen.getByRole('slider', { name: /Piece Count/i })).toHaveValue('2');
    // Corridor pin: distance restored from the DXB corridor, not freehand
    expect(screen.getByRole('slider', { name: /Flight Distance/i })).toHaveValue('2420');
    // 2 × 200 kg = 400 kg total line proves pieces + weight both applied
    expect(screen.getByText(/2 × 200 kg = 400 kg/)).toBeInTheDocument();
  });

  it('falls back to defaults when params are absent', async () => {
    await renderWithUrl('/');
    expect(screen.getByRole('slider', { name: /Length/i })).toHaveValue('80');
    expect(screen.getByRole('slider', { name: /Piece Count/i })).toHaveValue('1');
  });
});
