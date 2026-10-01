import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { ThemeProvider, useTheme } from '../theme';

const Probe: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <button type="button" onClick={toggleTheme}>
        toggle
      </button>
    </div>
  );
};

describe('ThemeProvider', () => {
  it('defaults to dark when nothing is stored and the OS prefers light is mocked false', () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('theme')).toHaveTextContent('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('toggles to light, updates the DOM and persists the choice', async () => {
    const { userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'toggle' }));
    expect(screen.getByTestId('theme')).toHaveTextContent('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(localStorage.getItem('yaslogist-air-theme')).toBe('light');
  });

  it('restores a stored explicit choice over any system preference', () => {
    localStorage.setItem('yaslogist-air-theme', 'light');
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('theme')).toHaveTextContent('light');
  });
});
