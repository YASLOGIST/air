import React from 'react';
import { useReveal } from '../lib/useReveal';

interface RevealProps {
  /** Element to render (defaults to div; use "li" inside lists, etc.). */
  as?: React.ElementType;
  /** Stagger offset in milliseconds (applied as transition-delay). */
  delay?: number;
  className?: string;
  children: React.ReactNode;
}

/**
 * Scroll-reveal wrapper: children rise 16px and fade in over 560ms with the
 * brand's ease-out-expo curve the first time they enter the viewport.
 * Pure CSS motion (opacity + transform only); fully neutralised under
 * prefers-reduced-motion — see `.reveal` in index.css.
 */
export const Reveal: React.FC<RevealProps> = ({ as: Tag = 'div', delay = 0, className = '', children }) => {
  const { ref, visible } = useReveal<HTMLElement>();
  return (
    <Tag
      ref={ref}
      className={`reveal ${visible ? 'is-visible' : ''} ${className}`.trim()}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
};

export default Reveal;
