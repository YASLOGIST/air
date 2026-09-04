import React, { useState } from 'react';
import { useLang } from '../lib/i18n';
import { useTheme } from '../lib/theme';
import { BrandMarkAir } from './BrandAir';
import {
  Globe,
  Sun,
  Moon,
  Menu,
  X,
  FileCheck,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { SUITE_URLS } from '../lib/suite';

interface NavbarAirProps {
  onOpenAwbModal: () => void;
}

export const NavbarAir: React.FC<NavbarAirProps> = ({ onOpenAwbModal }) => {
  const { dict, lang, toggleLang, isRtl } = useLang();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [ecosystemOpen, setEcosystemOpen] = useState(false);

  const NAV_LINKS = [
    { label: dict.nav.radar, href: '#radar' },
    { label: dict.nav.simulator, href: '#simulator' },
    { label: dict.nav.uld, href: '#uld' },
    { label: dict.nav.cargoVillage, href: '#cargovillage' },
    { label: dict.nav.corridors, href: '#corridors' },
    { label: dict.nav.stats, href: '#stats' },
    { label: dict.nav.landLink, href: '#handshake' },
  ];

  const ECOSYSTEM_LINKS = [
    { name: dict.nav.ecosystem.corporate, url: SUITE_URLS.hub },
    { name: dict.nav.ecosystem.ocean, url: SUITE_URLS.ocean },
    { name: dict.nav.ecosystem.land, url: SUITE_URLS.land },
    { name: dict.nav.ecosystem.air, url: '#', active: true },
  ];

  return (
    <header className="fixed top-0 inset-x-0 z-[9000] border-b border-[var(--glass-brd)] bg-[var(--c-bg)]/85 backdrop-blur-xl transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Left: Brand Monogram & Wordmark (NO raw URL) */}
          <div className="flex items-center gap-3">
            <a href="#" className="flex items-center gap-2.5 sm:gap-3 group">
              <BrandMarkAir className="w-10 h-10 sm:w-11 sm:h-11 group-hover:scale-105 transition-transform" />
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 font-bold tracking-[0.08em] font-serif text-base sm:text-lg text-title leading-tight">
                  <span>YASLOGIST</span>
                  <span className="rounded-md border border-cyan-500/40 bg-cyan-500/10 px-1.5 py-0.2 font-mono text-[9px] font-bold tracking-wider text-cyan-500">
                    AIR
                  </span>
                </div>
                <span className="text-[9px] sm:text-[10px] font-mono text-muted uppercase tracking-wider leading-none mt-0.5">
                  {isRtl ? 'اللوجستيات الجوية للشحنات الحرجة' : 'Time-Critical Freight'}
                </span>
              </div>
            </a>

            {/* Platform Switcher Dropdown */}
            <div className="relative hidden xl:block ml-4 rtl:ml-0 rtl:mr-4">
              <button
                onClick={() => setEcosystemOpen(!ecosystemOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono text-muted hover:text-title glass-subcard transition-colors"
              >
                <span>YASLOGIST SUITE</span>
                <ChevronDown className="w-3 h-3 text-cyan-500" />
              </button>

              {ecosystemOpen && (
                <div
                  className="absolute top-full mt-2 left-0 rtl:left-auto rtl:right-0 w-48 rounded-xl glass-panel py-1.5 z-50 text-xs font-mono shadow-2xl"
                  onMouseLeave={() => setEcosystemOpen(false)}
                >
                  {ECOSYSTEM_LINKS.map((item, idx) => (
                    <a
                      key={idx}
                      href={item.url}
                      className={`flex items-center justify-between px-3 py-2 transition-colors ${
                        item.active
                          ? 'bg-cyan-500/15 text-cyan-500 font-bold'
                          : 'text-muted hover:bg-black/5 dark:hover:bg-white/5 hover:text-title'
                      }`}
                    >
                      <span>{item.name}</span>
                      {!item.active && <ExternalLink className="w-3 h-3 opacity-60" />}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Center: Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {NAV_LINKS.map((link, idx) => (
              <a
                key={idx}
                href={link.href}
                className="px-2.5 py-1.5 rounded-lg text-xs xl:text-sm font-medium text-muted hover:text-title hover:bg-black/5 dark:hover:bg-white/5 transition-all"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right: Actions, Language, Theme, Mobile Menu Toggle */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* AWB Verification CTA */}
            <button
              onClick={onOpenAwbModal}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-semibold text-cyan-500 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 transition-all shadow-sm"
            >
              <FileCheck className="w-3.5 h-3.5 text-cyan-500" />
              <span>{dict.nav.trackAwb}</span>
            </button>

            {/* Language Switcher */}
            <button
              type="button"
              onClick={toggleLang}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-mono font-semibold text-title glass-subcard hover:border-cyan-400 transition-all"
              aria-label={dict.nav.toggleLang}
            >
              <Globe className="w-3.5 h-3.5 text-cyan-500" />
              <span>{lang === 'en' ? 'عربي' : 'EN'}</span>
            </button>

            {/* Theme Switcher */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl text-title glass-subcard hover:border-cyan-400 transition-all"
              aria-label={dict.nav.toggleTheme}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-300" />
              ) : (
                <Moon className="w-4 h-4 text-sky-600" />
              )}
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-title glass-subcard"
              aria-expanded={mobileMenuOpen}
              aria-label={
                mobileMenuOpen
                  ? (isRtl ? 'إغلاق القائمة' : 'Close menu')
                  : (isRtl ? 'فتح القائمة' : 'Open menu')
              }
            >
              {mobileMenuOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[var(--glass-brd)] bg-[var(--c-bg)] px-4 pt-3 pb-6 space-y-2 text-sm">
          {NAV_LINKS.map((link, idx) => (
            <a
              key={idx}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-muted hover:text-title hover:bg-black/5 dark:hover:bg-white/5 font-medium"
            >
              {link.label}
            </a>
          ))}

          <div className="pt-3 border-t border-[var(--glass-brd)] space-y-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAwbModal();
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-colors"
            >
              <FileCheck className="w-4 h-4" />
              <span>{dict.nav.trackAwb}</span>
            </button>

            <div className="pt-2 grid grid-cols-2 gap-2 text-xs font-mono text-center">
              <a
                href={SUITE_URLS.land}
                className="p-2 rounded-lg glass-subcard text-muted hover:text-title"
              >
                land.yaslogist.me ➔
              </a>
              <a
                href={SUITE_URLS.ocean}
                className="p-2 rounded-lg glass-subcard text-muted hover:text-title"
              >
                ocean.yaslogist.me ➔
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
