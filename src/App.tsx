import React, { lazy, Suspense, useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { NavbarAir } from './components/NavbarAir';
import { CinematicStage } from './components/CinematicStage';
import { ErrorBoundary } from './components/ErrorBoundary';

const StatsAir = lazy(() => import('./components/StatsAir').then((module) => ({ default: module.StatsAir })));
const MissionAir = lazy(() => import('./components/MissionAir').then((module) => ({ default: module.MissionAir })));
const CargoVillageFlow = lazy(() => import('./components/CargoVillageFlow').then((module) => ({ default: module.CargoVillageFlow })));
const FlightRadarHUD = lazy(() => import('./components/FlightRadarHUD').then((module) => ({ default: module.FlightRadarHUD })));
const ULDSelector = lazy(() => import('./components/ULDSelector').then((module) => ({ default: module.ULDSelector })));
const CargoSimAir = lazy(() => import('./components/CargoSimAir').then((module) => ({ default: module.CargoSimAir })));
const CorridorsAir = lazy(() => import('./components/CorridorsAir').then((module) => ({ default: module.CorridorsAir })));
const ConsignmentTracker = lazy(() => import('./components/ConsignmentTracker').then((module) => ({ default: module.ConsignmentTracker })));
const HandshakeAirToLand = lazy(() => import('./components/HandshakeAirToLand').then((module) => ({ default: module.HandshakeAirToLand })));
const StanceAir = lazy(() => import('./components/StanceAir').then((module) => ({ default: module.StanceAir })));
const FooterAir = lazy(() => import('./components/FooterAir').then((module) => ({ default: module.FooterAir })));
const LegalModalAir = lazy(() => import('./components/LegalModalAir').then((module) => ({ default: module.LegalModalAir })));
const AwbModalAir = lazy(() => import('./components/AwbModalAir').then((module) => ({ default: module.AwbModalAir })));

type LegalTab = 'TERMS' | 'PRIVACY' | 'SECURITY';

function SectionFallback() {
  return <div className="mx-auto my-8 h-40 max-w-7xl animate-pulse rounded-3xl bg-[var(--c-card)]" aria-hidden="true" />;
}

export const App: React.FC = () => {
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<LegalTab>('TERMS');
  const [awbModalOpen, setAwbModalOpen] = useState(false);

  const openLegal = (tab: LegalTab) => {
    setLegalModalTab(tab);
    setLegalModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <NavbarAir onOpenAwbModal={() => setAwbModalOpen(true)} />
      <main id="main-content" className="flex-grow" tabIndex={-1}>
        <CinematicStage />
        <ErrorBoundary>
          <Suspense fallback={<SectionFallback />}>
            <StatsAir />
            <MissionAir />
            <CargoVillageFlow />
            <FlightRadarHUD />
            <ULDSelector />
            <CargoSimAir />
            <CorridorsAir />
            <ConsignmentTracker />
            <HandshakeAirToLand />
            <StanceAir />
          </Suspense>
        </ErrorBoundary>
      </main>
      <Suspense fallback={null}>
        <FooterAir onOpenLegal={openLegal} />
        {legalModalOpen && <LegalModalAir isOpen onClose={() => setLegalModalOpen(false)} initialTab={legalModalTab} />}
        {awbModalOpen && <AwbModalAir isOpen onClose={() => setAwbModalOpen(false)} />}
      </Suspense>
      <Analytics />
    </div>
  );
};

export default App;
