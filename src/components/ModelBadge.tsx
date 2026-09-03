import React from 'react';
import { useLang } from '../lib/i18n';
import { Activity } from 'lucide-react';

interface ModelBadgeProps {
  className?: string;
  short?: boolean;
}

export const ModelBadge: React.FC<ModelBadgeProps> = ({ className = '', short = false }) => {
  const { dict, isRtl } = useLang();

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-sky-400/25 bg-sky-950/30 text-[10px] sm:text-xs font-mono tracking-wider uppercase text-sky-300 backdrop-blur-md ${className}`}
      dir={isRtl ? 'rtl' : 'ltr'}
      title={dict.brand.modelBadgeDesc}
    >
      <Activity className="w-3 h-3 text-cyan-400 animate-pulse shrink-0" />
      <span>{short ? dict.brand.modelBadge.split('·')[0] : dict.brand.modelBadge}</span>
    </div>
  );
};
