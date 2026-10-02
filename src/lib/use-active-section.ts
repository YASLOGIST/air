import { useEffect, useState } from 'react';

/**
 * Where the reading line sits, in CSS pixels from the top of the viewport.
 *
 * `html { scroll-padding-top: 7rem }` (112px) in src/index.css decides where
 * an anchor click parks a section. The reading line sits a comfortable 24px
 * *below* that landing point, so a section the reader just jumped to reads as
 * current instead of handing the highlight back to the one above it on a
 * sub-pixel rounding difference.
 */
export const SECTION_ANCHOR_OFFSET_PX = 112 + 24;

/**
 * Resolve which in-page section the reader is currently inside.
 *
 * The page is a single ~10-section scroll with six navbar anchors and, until
 * now, no indication of position. This hook backs both the visual highlight
 * and the `aria-current` state on those anchors.
 *
 * Implementation notes:
 *
 * - Measurement is by rect, not `IntersectionObserver`. Every section arrives
 *   later than the navbar (they are all behind `React.lazy`), and several are
 *   taller than the viewport, so "which element is under the anchor line" is
 *   both the correct question and the one a rect read answers directly.
 * - Reads are coalesced into one `requestAnimationFrame` per scroll burst, and
 *   the frame is cancelled on unmount, so an idle page schedules nothing.
 * - A `MutationObserver` re-measures when a lazy section mounts, which is what
 *   makes a deep link such as `/#tracker` resolve to the right anchor instead
 *   of whatever happened to exist at first paint.
 *
 * @param ids      Section element ids, in document order.
 * @param offsetPx Distance from the viewport top treated as the reading line.
 */
export function useActiveSection(
  ids: readonly string[],
  offsetPx = SECTION_ANCHOR_OFFSET_PX,
): string | null {
  const [activeId, setActiveId] = useState<string | null>(null);
  const key = ids.join('|');

  useEffect(() => {
    const sectionIds = key.split('|').filter(Boolean);
    if (sectionIds.length === 0) return;

    let frame = 0;

    const measure = () => {
      frame = 0;
      /* Only treat "bottom" as meaningful on a document that actually
         scrolls — otherwise a page shorter than the viewport would report its
         last section as current while the reader sits at the top. */
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const atBottom = scrollable > 0 && window.scrollY >= scrollable - 2;

      let current: string | null = null;
      let lastAbove: string | null = null;

      for (const id of sectionIds) {
        const element = document.getElementById(id);
        if (!element) continue;
        const { top, bottom } = element.getBoundingClientRect();
        if (atBottom) {
          lastAbove = id; // The final section can be shorter than the viewport.
          continue;
        }
        if (top <= offsetPx && bottom > offsetPx) {
          current = id;
          break;
        }
        if (top <= offsetPx) lastAbove = id;
      }

      setActiveId(current ?? lastAbove);
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);

    const main = document.querySelector('main');
    const mutations = main ? new MutationObserver(schedule) : null;
    mutations?.observe(main!, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      mutations?.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [key, offsetPx]);

  return activeId;
}
