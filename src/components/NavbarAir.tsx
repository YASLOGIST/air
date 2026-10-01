import React, { useState, useEffect } from 'react';
import { useLang } from '../lib/i18n';
import { useTheme } from '../lib/theme';
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

export const NavbarAir: React.FC<NavbarAirProps> = ({ onOpenAwbModal }) => {
  const { lang, setLang, isRtl } = useLang();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const NAV_LINKS = [
    { label: isRtl ? 'الرادار' : 'RADAR', href: '#radar' },
    { label: isRtl ? 'المحاكي' : 'SIMULATOR', href: '#simulator' },
    { label: isRtl ? 'حاويات ULD' : 'ULD', href: '#uld' },
    { label: isRtl ? 'قرية البضائع' : 'CARGO-VILLAGE', href: '#cargovillage' },
    { label: isRtl ? 'الممرات' : 'CORRIDORS', href: '#corridors' },
    { label: isRtl ? 'التتبع' : 'TRACKER', href: '#tracker' },
  ];

  const ECOSYSTEM_MODES = [
    {
      id: 'hub',
      label: 'Hub',
      icon: Layers,
      url: SUITE_URLS.hub,
      active: false,
    },
    {
      id: 'land',
      label: 'Land',
      icon: Truck,
      url: SUITE_URLS.land,
      active: false,
    },
    {
      id: 'ocean',
      label: 'Ocean',
      icon: Ship,
      url: SUITE_URLS.ocean,
      active: false,
    },
    {
      id: 'air',
      label: 'Air',
      icon: Plane,
      url: '#',
      active: true, // This project is AIR
    },
  ];

  const LANGUAGES = [
    { code: 'en', label: 'EN' },
    { code: 'ar', label: 'عربي' },
  ];

  return (
    <header className="fixed top-0 inset-x-0 z-[9000] pointer-events-none transition-all duration-500">
      {/* HUD Corner Brackets visible at top on wide screens */}
      <div
        className={`pointer-events-none absolute inset-x-4 top-2 hidden xl:flex justify-between transition-opacity duration-500 ${
          scrolled ? 'opacity-0' : 'opacity-70'
        }`}
        aria-hidden="true"
      >
        <span className="h-6 w-6 border-l-2 border-t-2 border-cyan-400/60" />
        <span className="h-6 w-6 border-r-2 border-t-2 border-cyan-400/60" />
      </div>

      {/* Main Navbar Capsule */}
      <div
        className={`pointer-events-auto mx-auto transition-all duration-500 ease-out ${
          scrolled
            ? 'mt-3 sm:mt-4 w-[calc(100%-1.25rem)] sm:w-[calc(100%-2rem)] max-w-[1400px] rounded-2xl lg:rounded-full border border-cyan-500/25 bg-[#060c18]/85 backdrop-blur-2xl shadow-[0_16px_45px_-10px_rgba(0,0,0,0.85),0_0_25px_rgba(6,182,212,0.15)] px-3.5 sm:px-6 py-2 sm:py-2.5'
            : 'mt-0 w-full border-b border-white/10 bg-[#060c18]/70 backdrop-blur-xl px-4 sm:px-8 py-3 sm:py-3.5 shadow-lg'
        }`}
      >
        <div className="flex items-center justify-between gap-3 sm:gap-4">
          {/* Left: Brand Monogram & Wordmark + Subtitle */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <a href="#" className="flex items-center gap-2.5 sm:gap-3 group">
              <BrandMarkAir className="w-9 h-9 sm:w-10 sm:h-10 transition-transform group-hover:scale-105" />
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold tracking-[0.1em] font-sans text-base sm:text-lg text-white leading-none">
                    YASLOGIST
                  </span>
                  <span className="rounded-full border border-amber-400/40 bg-amber-400/15 px-2 py-0.5 font-mono text-[9px] font-bold tracking-wider text-amber-300 leading-none">
                    DEMO
                  </span>
                </div>
                <span className="text-[9px] sm:text-[10px] font-mono text-slate-400 tracking-wider uppercase leading-none mt-1 hidden lg:block">
                  {isRtl
                    ? 'استخبارات الشحن الجوي للشحنات الحرجة'
                    : 'AIR FREIGHT INTELLIGENCE PLATFORM'}
                </span>
              </div>
            </a>
          </div>

          {/* Center: Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center gap-4 2xl:gap-6 shrink-0" dir="ltr">
            {NAV_LINKS.map((link, idx) => (
              <a
                key={idx}
                href={link.href}
                className="font-mono text-xs font-semibold tracking-[0.14em] uppercase text-slate-300 hover:text-cyan-300 transition-colors py-1 whitespace-nowrap"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right Controls: Ecosystem Switcher + Language Capsule + AWB + Theme Toggle */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0" dir="ltr">
            {/* Ecosystem Multi-modal Capsule (Layers · Land · Ocean · AIR Active) */}
            <div className="hidden sm:flex items-center gap-0.5 rounded-full border border-cyan-500/25 bg-black/45 p-1 backdrop-blur-md shadow-inner shrink-0">
              {ECOSYSTEM_MODES.map((mode) => {
                const Icon = mode.icon;
                const isActive = mode.active;
                return (
                  <a
                    key={mode.id}
                    href={mode.url}
                    title={mode.label}
                    className={`relative grid h-7 w-7 place-items-center rounded-full transition-all duration-200 shrink-0 ${
                      isActive
                        ? 'bg-cyan-500/25 text-cyan-300 ring-1 ring-cyan-400/50 shadow-[0_0_12px_rgba(34,211,238,0.5)]'
                        : 'text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </a>
                );
              })}
            </div>

            {/* Language Switcher Capsule (EN · عربي) */}
            <div className="flex items-center rounded-full border border-cyan-500/25 bg-black/45 p-0.5 backdrop-blur-md text-[11px] font-mono shadow-inner shrink-0">
              {LANGUAGES.map((item) => {
                const isCurrent =
                  (item.code === 'en' && lang === 'en') ||
                  (item.code === 'ar' && lang === 'ar');
                return (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => {
                      if (item.code === 'en' || item.code === 'ar') {
                        setLang(item.code);
                      }
                    }}
                    className={`rounded-full px-2.5 py-1 font-semibold transition-all duration-200 shrink-0 ${
                      isCurrent
                        ? 'bg-cyan-400 text-slate-950 font-bold shadow-[0_0_12px_rgba(34,211,238,0.6)]'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
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
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-xs font-semibold text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 transition-all shadow-sm shrink-0 whitespace-nowrap"
            >
              <FileCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>AWB</span>
            </button>

            {/* Monochromatic Smooth Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="grid h-8 w-8 sm:h-9 sm:w-9 place-items-center rounded-full border border-cyan-500/25 bg-black/45 text-slate-200 hover:text-white hover:border-cyan-400/50 transition-all duration-200 backdrop-blur-md shadow-inner shrink-0"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-slate-200" />
              ) : (
                <Moon className="w-4 h-4 text-slate-300" />
              )}
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden grid h-8 w-8 place-items-center rounded-full border border-cyan-500/25 bg-black/45 text-slate-200 hover:text-white shrink-0"
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown Drawer */}
      {mobileMenuOpen && (
        <div className="pointer-events-auto xl:hidden mx-auto mt-2 w-[calc(100%-1.25rem)] max-w-lg rounded-2xl border border-cyan-500/25 bg-[#060c18]/95 backdrop-blur-2xl p-4 shadow-2xl space-y-3">
          {/* Mobile Ecosystem Modes */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10" dir="ltr">
            <span className="text-xs font-mono text-slate-400">YASLOGIST SUITE:</span>
            <div className="flex items-center gap-1.5">
              {ECOSYSTEM_MODES.map((mode) => {
                const Icon = mode.icon;
                const isActive = mode.active;
                return (
                  <a
                    key={mode.id}
                    href={mode.url}
                    className={`p-1.5 rounded-full ${
                      isActive
                        ? 'bg-cyan-500/30 text-cyan-300 ring-1 ring-cyan-400/50'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Mobile Nav Links */}
          <div className="grid grid-cols-2 gap-1.5 pt-1">
            {NAV_LINKS.map((link, idx) => (
              <a
                key={idx}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl text-xs font-mono font-medium text-slate-300 hover:text-white hover:bg-white/5"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="pt-2 border-t border-white/10">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAwbModal();
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-colors shadow-lg shadow-cyan-400/20"
            >
              <FileCheck className="w-4 h-4" />
              <span>{isRtl ? 'فحص بوليصة الشحن e-AWB' : 'Verify Master e-AWB'}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default NavbarAir;
