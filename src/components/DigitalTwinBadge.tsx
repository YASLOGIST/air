import React from 'react';

interface DigitalTwinBadgeProps {
  className?: string;
}

export const DigitalTwinBadge: React.FC<DigitalTwinBadgeProps> = ({ className = '' }) => {
  return (
    <span className={`twin-badge ${className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-sky-400 shadow-[0_0_10px_#38bdf8] animate-pulse" />
      Interactive Model · Digital Twin Simulation / نموذج تفاعلي · محاكاة توأم رقمي
    </span>
  );
};

export default DigitalTwinBadge;
