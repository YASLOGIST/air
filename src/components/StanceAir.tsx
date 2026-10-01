import React from 'react';
import { useLang } from '../lib/i18n';

export const StanceAir: React.FC = () => {
  const { dict, isRtl } = useLang();

  return (
    <section className="mx-auto max-w-[1440px] px-4 pb-12 md:px-8">
      <article className="rounded-[32px] border border-sky-400/20 bg-[#090e17] p-7 text-white md:p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />
        <p className="kicker text-sky-400">
          {isRtl ? 'الموقف التشغيلي المؤسسي' : 'Non-Carrier Operating Stance'}
        </p>
        <h2 className="display mt-4 text-[clamp(1.6rem,3vw,2.6rem)] font-bold text-white tracking-tight">
          {dict.stance.headline}
        </h2>
        <p className="mt-5 max-w-4xl text-base leading-relaxed text-slate-300 md:text-lg font-sans">
          {dict.stance.body}
        </p>
      </article>
    </section>
  );
};

export default StanceAir;
