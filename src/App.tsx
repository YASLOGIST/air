import React, { useState } from 'react';
import { NavbarAir } from './components/NavbarAir';
import { HeroAir } from './components/HeroAir';
import { FlightRadarHUD } from './components/FlightRadarHUD';
import { CargoSimAir } from './components/CargoSimAir';
import { ULDSelector } from './components/ULDSelector';
import { CargoVillageFlow } from './components/CargoVillageFlow';
import { CorridorsAir } from './components/CorridorsAir';
import { StatsAir } from './components/StatsAir';
import { HandshakeAirToLand } from './components/HandshakeAirToLand';
import { FooterAir } from './components/FooterAir';
import { LegalModalAir } from './components/LegalModalAir';
import { AwbModalAir } from './components/AwbModalAir';

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

      {/* Main Content Sections */}
      <main className="flex-grow">
        {/* 1. Hero & Horizontal Telemetry Stream */}
        <HeroAir />

        {/* 2. Real-Time Flight Vector Radar & Cold-Chain HUD */}
        <FlightRadarHUD />

        {/* 3. Volumetric Weight & Carbon GLEC Calculator */}
        <CargoSimAir />

        {/* 4. Aircraft Unit Load Device (ULD) Browser */}
        <ULDSelector />

        {/* 5. Cairo Airport Cargo Village 4-Phase Fast-Track Flow */}
        <CargoVillageFlow />

        {/* 6. Strategic Egyptian Air Corridors */}
        <CorridorsAir />

        {/* 7. Engineered Standards & Measurable SLAs */}
        <StatsAir />

        {/* 8. Air-to-Land Multi-Modal Handshake */}
        <HandshakeAirToLand />
      </main>

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
