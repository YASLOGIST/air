import React from 'react';

interface State { failed: boolean }

/* The fallback deliberately reads the document language instead of the
   i18n context. A section can fail *because* of bad dictionary data, and a
   fallback that consumed the same context could throw while rendering the
   error state — turning one broken panel into a blank page. `<html lang>` is
   already kept in sync by LanguageProvider and cannot throw. */
function SectionErrorCard() {
  const isRtl = typeof document !== 'undefined' && document.documentElement.lang === 'ar';

  return (
    <section
      role="alert"
      className="mx-auto my-8 max-w-3xl rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-center"
    >
      <h2 className="font-bold text-title">
        {isRtl ? 'تعذّر تحميل هذا القسم' : 'This section could not be loaded'}
      </h2>
      <p className="mt-2 text-sm text-muted">
        {isRtl
          ? 'بقية الأدوات ما زالت متاحة. أعد تحميل الصفحة لمحاولة فتح هذا القسم مجددًا.'
          : 'Your other tools are still available. Reload to try this section again.'}
      </p>
      <button
        type="button"
        className="mt-4 rounded-xl bg-cyan-400 px-4 py-2 font-bold text-slate-950"
        onClick={() => location.reload()}
      >
        {isRtl ? 'إعادة تحميل الصفحة' : 'Reload page'}
      </button>
    </section>
  );
}

export class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    console.error('Section render failed', { name: error.name, message: error.message });
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return <SectionErrorCard />;
  }
}
