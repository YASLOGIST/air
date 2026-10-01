import React, { Suspense, lazy, useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { NavbarAir } from './components/NavbarAir';
import { CinematicStage } from './components/CinematicStage';
import { StatsAir } from './components/StatsAir';
import { MissionAir } from './components/MissionAir';
import { CargoVillageFlow } from './components/CargoVillageFlow';
import { FlightRadarHUD } from './components/FlightRadarHUD';
import { ULDSelector } from './components/ULDSelector';
import { CargoSimAir } from './components/CargoSimAir';
import { CorridorsAir } from './components/CorridorsAir';
import { ConsignmentTracker } from './components/ConsignmentTracker';
import { HandshakeAirToLand } from './components/HandshakeAirToLand';
import { StanceAir } from './components/StanceAir';
import { FooterAir } from './components/FooterAir';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ScrollTopFab } from './components/ScrollTopFab';
import { useLang } from './lib/i18n';

/* The three dialogs are conditional UI: they are split out of the initial
   bundle and fetched on first open instead. Each chunk is tiny, but it keeps
   the modal code (and its icon imports) off the critical rendering path. */
const LegalModalAir = lazy(() =>
  import('./components/LegalModalAir').then((m) => ({ default: m.LegalModalAir })),
);
const AwbModalAir = lazy(() =>
  import('./components/AwbModalAir').then((m) => ({ default: m.AwbModalAir })),
);
const QuoteModalAir = lazy(() =>
  import('./components/QuoteModalAir').then((m) => ({ default: m.QuoteModalAir })),
);

type LegalTab = 'TERMS' | 'PRIVACY' | 'SECURITY';

export const App: React.FC = () => {
  const { isRtl } = useLang();
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<LegalTab>('TERMS');
  const [awbModalOpen, setAwbModalOpen] = useState(false);
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);

  const handleOpenLegal = (tab: LegalTab) => {
    setLegalModalTab(tab);
    setLegalModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
      {/* Keyboard users land on 7 nav links plus 3 controls before any
          content; this link jumps the queue. Visually hidden until focused. */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:start-3 focus:z-[11000] focus:rounded-xl focus:bg-cyan-400 focus:px-4 focus:py-2.5 focus:text-sm focus:font-bold focus:text-slate-950"
      >
        {isRtl ? 'تجاوز إلى المحتوى الرئيسي' : 'Skip to main content'}
      </a>

      {/* Fixed Navigation Bar */}
      <NavbarAir
        onOpenAwbModal={() => setAwbModalOpen(true)}
        onOpenQuoteModal={() => setQuoteModalOpen(true)}
      />

      {/* Main Content Sections — Restored Session-Start Architecture */}
      <main id="main" tabIndex={-1} className="flex-grow focus:outline-none">
        <ErrorBoundary>
          {/* 1. Cinematic Stage: 320vh Arrival Digital Twin & Runway Video Descent */}
          <CinematicStage />

          {/* 2. Key Aviation Standards & Measurable SLAs */}
          <StatsAir />

          {/* 3. Strategic Mission Pillars */}
          <MissionAir />

          {/* 4. Cairo Airport Cargo Village 4-Phase Fast-Track Flow */}
          <CargoVillageFlow />

          {/* 5. Real-Time Flight Vector Radar & Cold-Chain HUD */}
          <FlightRadarHUD />

          {/* 6. Aircraft Unit Load Device (ULD) Browser */}
          <ULDSelector />

          {/* 7. Volumetric Weight & Carbon GLEC Calculator */}
          <CargoSimAir />

          {/* 8. Strategic Egyptian Air Corridors */}
          <CorridorsAir />

          {/* 9. Consignment Radar & Interactive e-AWB Tracker */}
          <ConsignmentTracker />

          {/* 10. Air-to-Land Multi-Modal Handshake */}
          <HandshakeAirToLand />

          {/* 11. Non-Carrier Stance Statement */}
          <StanceAir />
        </ErrorBoundary>
      </main>

      {/* Unified Platform Footer */}
      <FooterAir onOpenLegal={handleOpenLegal} onOpenQuoteModal={() => setQuoteModalOpen(true)} />

      {/* Back-to-top with scroll-progress ring */}
      <ScrollTopFab />

      {/* Modals */}
      <Suspense fallback={null}>
        <LegalModalAir
          isOpen={legalModalOpen}
          onClose={() => setLegalModalOpen(false)}
          initialTab={legalModalTab}
        />

        <AwbModalAir
          isOpen={awbModalOpen}
          onClose={() => setAwbModalOpen(false)}
        />

        <QuoteModalAir
          isOpen={quoteModalOpen}
          onClose={() => setQuoteModalOpen(false)}
        />
      </Suspense>

      {/* Vercel Web Analytics */}
      <Analytics />
    </div>
  );
};

export default App;
