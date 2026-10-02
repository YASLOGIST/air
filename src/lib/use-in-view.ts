import { useEffect, useRef, useState } from 'react';

/**
 * Track whether an element is near the viewport *and* the tab is foregrounded.
 *
 * Used to suspend simulated-telemetry timers: they re-render large sections
 * once or twice a second, which is pure waste while the section is scrolled
 * away or the tab is in the background.
 *
 * Fails open: when `IntersectionObserver` is unavailable (older browsers, the
 * jsdom test environment) the element is reported as active so behaviour
 * degrades to the previous always-on timers rather than to a frozen UI.
 */
export function useInView<T extends Element = HTMLElement>(
  options: IntersectionObserverInit = { rootMargin: '200px' },
): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(true);
  const [pageVisible, setPageVisible] = useState(
    () => typeof document === 'undefined' || !document.hidden,
  );

  const { root, rootMargin, threshold } = options;

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      root,
      rootMargin,
      threshold,
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [root, rootMargin, threshold]);

  useEffect(() => {
    const onVisibilityChange = () => setPageVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  return [ref, inView && pageVisible];
}
