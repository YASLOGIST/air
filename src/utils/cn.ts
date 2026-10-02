import { clsx, type ClassValue } from 'clsx';

/**
 * Join conditional class names.
 *
 * This used to wrap `clsx` in `tailwind-merge`. That dependency pulled ~103 KB
 * of source (≈45 KB minified) into the entry chunk to serve a single call site
 * (`BrandMarkAir`), whose callers only ever append sizing/transform utilities
 * that do not conflict with the base string — so the merge pass had nothing to
 * resolve. If a future call site needs last-wins conflict resolution between
 * overlapping Tailwind utilities, reintroduce `twMerge` here deliberately.
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
