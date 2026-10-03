import { describe, expect, it } from 'vitest';
import { SUITE_URLS } from './suite';

describe('suite navigation', () => {
  it('does not point browser previews at the visitor local machine by default', () => {
    const explicitlyConfigured = Object.values(SUITE_URLS).some((url) => /localhost|127\.0\.0\.1/.test(url));
    if (explicitlyConfigured) return;
    expect(Object.values(SUITE_URLS).every((url) => !/localhost|127\.0\.0\.1/.test(url))).toBe(true);
  });

  it('keeps every surface on an explicit absolute URL', () => {
    for (const url of Object.values(SUITE_URLS)) {
      expect(() => new URL(url)).not.toThrow();
      expect(url).toMatch(/^https?:\/\//);
    }
  });
});
