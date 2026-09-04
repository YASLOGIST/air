/**
 * YASLOGIST AIR — Accessibility primitives
 */

import { useEffect, useRef } from 'react';

/* Elements that can take focus. `getClientRects().length` filters out anything
   hidden by `display:none` or a collapsed ancestor; `offsetParent` is not usable
   here because the dialog container is position:fixed. */
const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Modal dialog behaviour: focus moves in on open, Tab cycles inside, Escape
 * closes, body scroll is locked, and focus returns to whatever opened the
 * dialog on close.
 *
 * Returns a ref to attach to the dialog panel (the element carrying
 * role="dialog"), which must also have tabIndex={-1} so it can receive focus
 * when it contains no focusable child.
 */
export function useDialog<T extends HTMLElement = HTMLDivElement>(
  isOpen: boolean,
  onClose: () => void,
) {
  const panelRef = useRef<T>(null);

  /* Callers pass an inline arrow for onClose, so its identity changes every
     render. Reading it through a ref keeps the effect below keyed on `isOpen`
     alone — otherwise the trap would tear down and rebuild on every render,
     yanking focus back to the first control and thrashing body scroll. */
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!isOpen) return;

    const panel = panelRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusable = (): HTMLElement[] =>
      panel
        ? Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
            (el) => el.getClientRects().length > 0,
          )
        : [];

    // Move focus into the dialog; fall back to the panel itself.
    (focusable()[0] ?? panel)?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab') return;

      const items = focusable();
      if (items.length === 0) {
        event.preventDefault();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || active === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [isOpen]);

  return panelRef;
}
