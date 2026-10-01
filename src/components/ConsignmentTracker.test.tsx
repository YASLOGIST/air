import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LanguageProvider } from '../lib/i18n';
import { ConsignmentTracker } from './ConsignmentTracker';

describe('consignment demonstration flow', () => {
  it('loads a known sample and never fabricates an unknown shipment', async () => {
    const user = userEvent.setup();
    render(<LanguageProvider><ConsignmentTracker /></LanguageProvider>);
    const input = screen.getByRole('textbox');
    await user.clear(input);
    await user.type(input, '176-33910244');
    await user.click(screen.getByRole('button', { name: /inspect|track|search|تتبع/i }));
    expect(screen.getByText(/EK-927/)).toBeInTheDocument();

    await user.clear(input);
    await user.type(input, '123-12345678');
    await user.click(screen.getByRole('button', { name: /inspect|track|search|تتبع/i }));
    expect(screen.queryByText(/VERIFIED · PRE-LODGED/)).not.toBeInTheDocument();
    expect(screen.getByText(/No active shipment|غير موجود/i)).toBeInTheDocument();
  });
});
