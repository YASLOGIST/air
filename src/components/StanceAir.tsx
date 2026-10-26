import React from 'react';
import { useLang } from '../lib/i18n';

export const StanceAir: React.FC = () => {
  const { dict, isRtl } = useLang();

  return (
    <section className="mx-auto max-w-[1440px] px-4 pb-12 md:px-8">
      <article className="glass-panel relative overflow-hidden rounded-[32px] p-7 md:p-10">
        <p className="kicker">
          {isRtl ? 'الموقف التشغيلي المؤسسي' : 'Non-Carrier Operating Stance'}
        </p>
        <h2 className="display mt-4 text-[clamp(1.6rem,3vw,2.6rem)] font-semibold text-title tracking-tight">
          {dict.stance.headline}
        </h2>
        <p className="mt-5 max-w-4xl text-base leading-relaxed text-body md:text-lg font-sans">
          {dict.stance.body}
        </p>
      </article>
    </section>
  );
};

export default StanceAir;
