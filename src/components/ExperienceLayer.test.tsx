import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { LanguageProvider } from '../lib/i18n';
import { ExperienceLayer } from './ExperienceLayer';

describe('premium page navigator', () => {
  it('opens with the keyboard, filters destinations, and closes with Escape', async () => {
    const user = userEvent.setup();
    render(<LanguageProvider><ExperienceLayer /></LanguageProvider>);
    await user.keyboard('{Control>}k{/Control}');
    expect(screen.getByRole('dialog', { name: /platform destinations/i })).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText(/jump to any system/i), 'digital twin');
    expect(screen.getByRole('button', { name: /ULD digital twin/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Cargo simulator/i })).not.toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
