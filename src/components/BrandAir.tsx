import { cn } from '../utils/cn';

export function BrandMonogram({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="butt"
      strokeLinejoin="miter"
      role="img"
      aria-label="YASLOGIST"
    >
      <g strokeWidth="1.6" opacity="0.55">
        <ellipse cx="32" cy="32" rx="12.5" ry="29" />
        <path d="M3 32h58M8 17.5h48M8 46.5h48" />
      </g>
      <circle cx="32" cy="32" r="29" strokeWidth="2.2" />
      <g strokeWidth="5" strokeLinecap="square">
        <path d="M16 16 L27.5 31.5 L27.5 49" />
        <path d="M39 16 L30 28" />
        <path d="M40.5 20 L40.5 48 L53 48" />
      </g>
    </svg>
  );
}

export function BrandMarkAir({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'brand-mark grid shrink-0 place-items-center overflow-hidden rounded-full p-1.5 text-cyan-400 bg-sky-950/40 border border-cyan-400/30 shadow-[0_0_15px_rgba(56,189,248,0.25)]',
        className
      )}
    >
      <BrandMonogram className="h-full w-full" />
    </span>
  );
}
