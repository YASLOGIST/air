import React, { useState } from 'react';
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
import { LegalModalAir } from './components/LegalModalAir';
import { AwbModalAir } from './components/AwbModalAir';
import { AppErrorBoundary } from './components/AppErrorBoundary';

export const App: React.FC = () => {
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<'TERMS' | 'PRIVACY' | 'SECURITY'>('TERMS');
  const [awbModalOpen, setAwbModalOpen] = useState(false);

  const handleOpenLegal = (tab: 'TERMS' | 'PRIVACY' | 'SECURITY') => {
    setLegalModalTab(tab);
    setLegalModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
      {/* Fixed Navigation Bar */}
      <NavbarAir onOpenAwbModal={() => setAwbModalOpen(true)} />

      {/* Main Content Sections — Restored Session-Start Architecture */}
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <AppErrorBoundary>
        <main id="main-content" className="flex-grow">
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
        </main>
      </AppErrorBoundary>

      {/* Unified Platform Footer */}
      <FooterAir onOpenLegal={handleOpenLegal} />

      {/* Modals */}
      <LegalModalAir
        isOpen={legalModalOpen}
        onClose={() => setLegalModalOpen(false)}
        initialTab={legalModalTab}
      />

      <AwbModalAir
        isOpen={awbModalOpen}
        onClose={() => setAwbModalOpen(false)}
      />

    </div>
  );
};

export default App;
