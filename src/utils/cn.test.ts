import { describe, expect, it } from 'vitest';
import { cn } from './cn';

describe('cn', () => {
  it('joins base and caller classes in order', () => {
    expect(cn('a b', 'c')).toBe('a b c');
  });

  it('drops falsy values and flattens conditionals', () => {
    expect(cn('a', undefined, false && 'b', ['c', null], { d: true, e: false })).toBe('a c d');
  });

  it('keeps the brand mark composition the navbar and footer rely on', () => {
    // Callers only append sizing/transform utilities; nothing collides with the
    // base string, which is why tailwind-merge is not needed here.
    const base = 'brand-mark grid shrink-0 place-items-center rounded-full p-1.5';
    expect(cn(base, 'w-9 h-9 transition-transform')).toBe(
      'brand-mark grid shrink-0 place-items-center rounded-full p-1.5 w-9 h-9 transition-transform',
    );
  });
});
