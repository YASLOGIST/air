import React, { useState, useEffect, useId, useRef } from 'react';
import { useLang } from '../lib/i18n';
import { useTheme } from '../lib/theme';
import { useActiveSection } from '../lib/use-active-section';
import { BrandMarkAir } from './BrandAir';
import {
  Layers,
  Truck,
  Ship,
  Plane,
  Sun,
  Moon,
  Menu,
  X,
  FileCheck,
} from 'lucide-react';
import { SUITE_URLS } from '../lib/suite';

interface NavbarAirProps {
  onOpenAwbModal: () => void;
}

/* Anchor ids in document order — also the input to the scroll spy. */
const SECTION_IDS = ['radar', 'simulator', 'uld', 'cargovillage', 'corridors', 'tracker'] as const;

/* The desktop drawer breakpoint (Tailwind `xl`). Kept here so the drawer can
   close itself when the viewport grows past the point where it is hidden —
   otherwise it stays mounted, open and unreachable behind the desktop nav. */
const DESKTOP_QUERY = '(min-width: 80rem)';

export const NavbarAir: React.FC<NavbarAirProps> = ({ onOpenAwbModal }) => {
  const { lang, setLang, isRtl } = useLang();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const activeSection = useActiveSection(SECTION_IDS);
  const drawerId = useId();
  const drawerRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  /* The bar used to change width, margin, corner radius, padding and shadow on
     every scroll crossing, which meant a layout pass over the whole fixed
     header mid-scroll. It now has one geometry: a flat white bar whose only
     state changes with the page (the active section). */

  /* Drawer dismissal. The drawer previously had no way out except the toggle:
     Escape did nothing, a click on the page behind it did nothing, and
     widening the window left it open underneath the desktop navigation. */
  useEffect(() => {
    if (!mobileMenuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setMobileMenuOpen(false);
      menuButtonRef.current?.focus();
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (drawerRef.current?.contains(target) || menuButtonRef.current?.contains(target)) return;
      setMobileMenuOpen(false);
    };
    const desktop = window.matchMedia(DESKTOP_QUERY);
    const onBreakpoint = () => {
      if (desktop.matches) setMobileMenuOpen(false);
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    desktop.addEventListener?.('change', onBreakpoint);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
      desktop.removeEventListener?.('change', onBreakpoint);
    };
  }, [mobileMenuOpen]);

  const NAV_LINKS = [
    { id: 'radar', label: isRtl ? 'الرادار' : 'RADAR' },
    { id: 'simulator', label: isRtl ? 'المحاكي' : 'SIMULATOR' },
    { id: 'uld', label: isRtl ? 'حاويات ULD' : 'ULD' },
    { id: 'cargovillage', label: isRtl ? 'قرية البضائع' : 'CARGO-VILLAGE' },
    { id: 'corridors', label: isRtl ? 'الممرات' : 'CORRIDORS' },
    { id: 'tracker', label: isRtl ? 'التتبع' : 'TRACKER' },
  ];

  const ECOSYSTEM_MODES = [
    { id: 'hub', label: isRtl ? 'المركز الرئيسي' : 'Hub', icon: Layers, url: SUITE_URLS.hub, active: false },
    { id: 'land', label: isRtl ? 'الشحن البري' : 'Land', icon: Truck, url: SUITE_URLS.land, active: false },
    { id: 'ocean', label: isRtl ? 'الشحن البحري' : 'Ocean', icon: Ship, url: SUITE_URLS.ocean, active: false },
    { id: 'air', label: isRtl ? 'الشحن الجوي' : 'Air', icon: Plane, url: SUITE_URLS.air, active: true },
  ];

  const LANGUAGES = [
    { code: 'en', label: 'EN' },
    { code: 'ar', label: 'عربي' },
  ];

  const suiteLabel = isRtl ? 'منظومة ياسلوجيست' : 'YASLOGIST suite';

  /* The current surface is a label, not a destination. It used to be an
     `<a href="#">`, which read as a link to a screen reader and silently
     jumped to the top of the page when clicked. */
  const renderEcosystemMode = (
    mode: (typeof ECOSYSTEM_MODES)[number],
    className: string,
    activeClassName: string,
    inactiveClassName: string,
  ) => {
    const Icon = mode.icon;
    if (mode.active) {
      return (
        <span
          key={mode.id}
          aria-current="true"
          title={mode.label}
          className={`${className} ${activeClassName}`}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="sr-only">{mode.label}</span>
        </span>
      );
    }
    return (
      <a key={mode.id} href={mode.url} title={mode.label} className={`${className} ${inactiveClassName}`}>
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="sr-only">{mode.label}</span>
      </a>
    );
  };

  return (
    <header className="fixed top-0 inset-x-0 z-[9000]">
      {/* One opaque bar: no backdrop filter over a 10-section scroll surface,
          and no geometry transition to reflow on every scroll event. */}
      <div className="border-b border-[var(--c-border)] bg-[var(--c-bg)] px-4 py-3 sm:px-8 sm:py-3.5">
        <div className="flex items-center justify-between gap-3 sm:gap-4">
          {/* Left: Brand Monogram & Wordmark + Subtitle */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <a href="#main-content" className="flex items-center gap-2.5 sm:gap-3 group">
              <BrandMarkAir className="w-9 h-9 sm:w-10 sm:h-10 transition-transform group-hover:scale-105" />
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-semibold tracking-[0.1em] font-sans text-base sm:text-lg text-title leading-none">
                    YASLOGIST
                  </span>
                  <span className="rounded-full border border-[var(--c-border)] bg-[var(--c-subcard)] px-2 py-0.5 font-mono text-[9px] font-semibold tracking-wider text-muted leading-none">
                    DEMO
                  </span>
                </div>
                <span className="text-[9px] sm:text-[10px] font-mono text-muted tracking-wider uppercase leading-none mt-1 hidden lg:block">
                  {isRtl
                    ? 'استخبارات الشحن الجوي للشحنات الحرجة'
                    : 'AIR FREIGHT INTELLIGENCE PLATFORM'}
                </span>
              </div>
            </a>
          </div>

          {/* Center: Desktop Navigation Links */}
          <nav
            className="hidden xl:flex items-center gap-4 2xl:gap-6 shrink-0"
            dir="ltr"
            aria-label={isRtl ? 'أقسام الصفحة' : 'Page sections'}
          >
            {NAV_LINKS.map((link) => {
              const isCurrent = activeSection === link.id;
              return (
                <a
                  key={link.id}
                  href={`#${link.id}`}
                  aria-current={isCurrent ? 'true' : undefined}
                  className={`relative font-mono text-xs font-medium tracking-[0.14em] uppercase transition-colors py-1 whitespace-nowrap ${
                    isCurrent
                      ? 'text-[var(--c-accent)]'
                      : 'text-muted hover:text-[var(--c-accent)]'
                  }`}
                >
                  {link.label}
                  {/* Position is signalled by colour *and* a rule, so the cue
                      survives for readers who cannot separate the two hues. */}
                  <span
                    aria-hidden="true"
                    className={`absolute -bottom-0.5 inset-x-0 h-px origin-center transition-transform duration-300 ${
                      isCurrent
                        ? 'scale-x-100 bg-[var(--c-accent)]'
                        : 'scale-x-0 bg-transparent'
                    }`}
                  />
                </a>
              );
            })}
          </nav>

          {/* Right Controls: Ecosystem Switcher + Language Capsule + AWB + Theme Toggle */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0" dir="ltr">
            {/* Ecosystem Multi-modal Capsule (Hub · Land · Ocean · AIR Active) */}
            <div
              className="hidden sm:flex items-center gap-0.5 rounded-full border border-[var(--c-border)] bg-[var(--c-subcard)] p-1 shrink-0"
              role="group"
              aria-label={suiteLabel}
            >
              {ECOSYSTEM_MODES.map((mode) =>
                renderEcosystemMode(
                  mode,
                  'relative grid h-7 w-7 place-items-center rounded-full transition-all duration-200 shrink-0',
                  'pill-active',
                  'text-muted hover:text-title hover:bg-[var(--c-card-solid)]',
                ),
              )}
            </div>

            {/* Language Switcher Capsule (EN · عربي) */}
            <div
              className="flex items-center rounded-full border border-[var(--c-border)] bg-[var(--c-subcard)] p-0.5 text-[11px] font-mono shrink-0"
              role="group"
              aria-label={isRtl ? 'اللغة' : 'Language'}
            >
              {LANGUAGES.map((item) => {
                const isCurrent =
                  (item.code === 'en' && lang === 'en') ||
                  (item.code === 'ar' && lang === 'ar');
                return (
                  <button
                    key={item.code}
                    type="button"
                    lang={item.code}
                    aria-pressed={isCurrent}
                    onClick={() => {
                      if (item.code === 'en' || item.code === 'ar') {
                        setLang(item.code);
                      }
                    }}
                    className={`rounded-full px-2.5 py-1 font-semibold transition-all duration-200 shrink-0 ${
                      isCurrent
                        ? 'pill-active font-semibold'
                        : 'text-muted hover:text-title hover:bg-[var(--c-card-solid)]'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* AWB Verification Action Button */}
            <button
              type="button"
              onClick={onOpenAwbModal}
              title={isRtl ? 'فحص بوليصة الشحن e-AWB' : 'Track Master AWB'}
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-xs font-medium text-body bg-[var(--c-card-solid)] hover:bg-[var(--c-subcard)] border border-[var(--c-border)] transition-colors shrink-0 whitespace-nowrap"
            >
              <FileCheck className="w-3.5 h-3.5 text-[var(--c-accent)] shrink-0" aria-hidden="true" />
              <span>AWB</span>
            </button>

            {/* Monochromatic Smooth Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="grid h-8 w-8 sm:h-9 sm:w-9 place-items-center rounded-full border border-[var(--c-border)] bg-[var(--c-card-solid)] text-muted hover:text-title hover:border-[var(--c-accent)] transition-colors shrink-0"
              aria-label={
                theme === 'dark'
                  ? isRtl
                    ? 'التبديل إلى المظهر الفاتح'
                    : 'Switch to light theme'
                  : isRtl
                    ? 'التبديل إلى المظهر الداكن'
                    : 'Switch to dark theme'
              }
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Moon className="w-4 h-4" aria-hidden="true" />
              )}
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="xl:hidden grid h-8 w-8 place-items-center rounded-full border border-[var(--c-border)] bg-[var(--c-card-solid)] text-muted hover:text-title shrink-0"
              aria-expanded={mobileMenuOpen}
              aria-controls={drawerId}
              aria-label={
                mobileMenuOpen
                  ? isRtl
                    ? 'إغلاق القائمة'
                    : 'Close menu'
                  : isRtl
                    ? 'فتح القائمة'
                    : 'Open menu'
              }
            >
              {mobileMenuOpen ? <X className="w-4 h-4" aria-hidden="true" /> : <Menu className="w-4 h-4" aria-hidden="true" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown Drawer */}
      {mobileMenuOpen && (
        <div
          ref={drawerRef}
          id={drawerId}
          className="xl:hidden mx-auto mt-2 w-[calc(100%-1.25rem)] max-w-lg rounded-2xl border border-[var(--c-border)] bg-[var(--c-bg)] p-4 shadow-xl space-y-3"
        >
          {/* Mobile Ecosystem Modes */}
          <div
            className="flex items-center justify-between p-2 rounded-xl bg-[var(--c-subcard)] border border-[var(--c-border)]"
            dir="ltr"
            role="group"
            aria-label={suiteLabel}
          >
            <span className="text-xs font-mono text-muted" aria-hidden="true">YASLOGIST SUITE:</span>
            <div className="flex items-center gap-1.5">
              {ECOSYSTEM_MODES.map((mode) =>
                renderEcosystemMode(
                  mode,
                  'grid h-7 w-7 place-items-center rounded-full',
                  'pill-active',
                  'text-muted hover:text-title',
                ),
              )}
            </div>
          </div>

          {/* Mobile Nav Links. Distinct landmark name from the desktop list:
              both are in the DOM at once (only CSS hides one), and two
              navigation landmarks sharing a name are ambiguous to announce. */}
          <nav aria-label={isRtl ? 'قائمة التنقل' : 'Navigation menu'}>
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              {NAV_LINKS.map((link) => {
                const isCurrent = activeSection === link.id;
                return (
                  <a
                    key={link.id}
                    href={`#${link.id}`}
                    aria-current={isCurrent ? 'true' : undefined}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-3 py-2 rounded-xl text-xs font-mono font-medium transition-colors ${
                      isCurrent
                        ? 'bg-[var(--c-subcard)] text-[var(--c-accent)] ring-1 ring-[var(--c-accent)]'
                        : 'text-muted hover:text-title hover:bg-[var(--c-subcard)]'
                    }`}
                  >
                    {link.label}
                  </a>
                );
              })}
            </div>
          </nav>

          <div className="pt-2 border-t border-[var(--c-border)]">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAwbModal();
              }}
              className="btn-primary w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-semibold transition-opacity hover:opacity-90"
            >
              <FileCheck className="w-4 h-4" aria-hidden="true" />
              <span>{isRtl ? 'فحص بوليصة الشحن e-AWB' : 'Verify Master e-AWB'}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default NavbarAir;
