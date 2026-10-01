import React from 'react';
import { useLang } from '../lib/i18n';
import { Reveal } from './Reveal';

export const MissionAir: React.FC = () => {
  const { dict } = useLang();

  return (
    <section className="mx-auto max-w-[1440px] px-4 py-16 md:px-8">
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] items-start">
        <div>
          <p className="kicker text-sky-400">{dict.mission.kicker}</p>
          <h2 className="display mt-3 text-[clamp(1.8rem,3.4vw,3rem)] font-bold text-title">
            {dict.mission.title}
          </h2>
        </div>
        <ol className="grid gap-4">
          {dict.mission.items.map((item, i) => (
            <Reveal as="li" key={item} delay={i * 60}>
              <div className="glass-panel flex gap-4 rounded-2xl border border-[var(--c-border)] p-5 transition-transform hover:-translate-y-0.5">
                <span className="mono text-lg font-bold text-sky-400">0{i + 1}</span>
                <p className="text-sm leading-relaxed text-body font-medium">{item}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
};

export default MissionAir;
