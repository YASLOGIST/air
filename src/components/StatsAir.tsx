import React from 'react';
import { useLang } from '../lib/i18n';
import { ModelBadge } from './ModelBadge';
import { Reveal } from './Reveal';
import {
  Scale,
  Clock,
  ThermometerSnowflake,
  FileDigit,
  ShieldCheck
} from 'lucide-react';

export const StatsAir: React.FC = () => {
  const { dict } = useLang();

  const STATS_DATA = [
    {
      value: dict.stats.stat1.value,
      label: dict.stats.stat1.label,
      desc: dict.stats.stat1.desc,
      icon: Scale,
      color: 'text-cyan-500',
      borderGlow: 'border-cyan-500/30',
    },
    {
      value: dict.stats.stat2.value,
      label: dict.stats.stat2.label,
      desc: dict.stats.stat2.desc,
      icon: Clock,
      color: 'text-sky-500',
      borderGlow: 'border-sky-500/30',
    },
    {
      value: dict.stats.stat3.value,
      label: dict.stats.stat3.label,
      desc: dict.stats.stat3.desc,
      icon: ThermometerSnowflake,
      color: 'text-teal-500',
      borderGlow: 'border-teal-500/30',
    },
    {
      value: dict.stats.stat4.value,
      label: dict.stats.stat4.label,
      desc: dict.stats.stat4.desc,
      icon: FileDigit,
      color: 'text-blue-500',
      borderGlow: 'border-blue-500/30',
    },
  ];

  return (
    <section id="stats" className="relative py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header with ModelBadge */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 border-b border-[var(--glass-brd)] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium tracking-wider bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 uppercase">
              {dict.stats.sectionBadge}
            </span>
            <ModelBadge />
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-title h2-display">
            {dict.stats.title}
          </h2>
          <p className="mt-2 text-sm sm:text-base text-muted max-w-2xl">
            {dict.stats.subtitle}
          </p>
        </div>

        {/* Audit Compliance Pill */}
        <div className="self-start md:self-auto flex items-center gap-2 px-3 py-1.5 rounded-xl glass-subcard text-xs font-mono text-muted">
          <ShieldCheck className="w-4 h-4 text-cyan-500" />
          <span dir="ltr">IATA TACT & GLEC COMPLIANT</span>
        </div>
      </div>

      {/* 4 Truthful Key Metric Cards — staggered reveal on scroll */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {STATS_DATA.map((item, idx) => {
          const Icon = item.icon;
          return (
            <Reveal key={idx} delay={idx * 70}>
              <div
                className={`glass-panel rounded-2xl p-6 border ${item.borderGlow} transition-all duration-300 group flex flex-col justify-between h-full`}
              >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 rounded-xl glass-subcard group-hover:scale-110 transition-transform">
                    <Icon className={`w-5 h-5 ${item.color}`} />
                  </div>
                  <span className="text-[10px] font-mono text-muted" dir="ltr">BENCHMARK 0{idx + 1}</span>
                </div>

                <div className="font-mono font-black text-3xl sm:text-4xl text-title tracking-tight tabular mb-2" dir="ltr">
                  {item.value}
                </div>

                <h3 className="font-bold text-sm text-title mb-2">
                  {item.label}
                </h3>
              </div>

              <p className="text-xs text-muted leading-relaxed pt-3 border-t border-[var(--glass-brd)] font-sans">
                {item.desc}
              </p>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
};
