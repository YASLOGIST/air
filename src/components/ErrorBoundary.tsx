import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Last-resort render guard. Without it, one throwing section (a malformed
 * stored preference, a failing icon import, anything) blank-screens the whole
 * SPA. The boundary keeps the shell usable and offers a reload, and logs the
 * failure with enough structure to be grepable in a host's log drain.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Structured on purpose — no ad-hoc string concatenation at a log sink.
    console.error(
      JSON.stringify({
        level: 'error',
        component: 'ErrorBoundary',
        message: error.message,
        stack: error.stack,
        componentStack: info.componentStack,
      }),
    );
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-[60vh] items-center justify-center px-4 py-24">
          <div
            className="glass-panel max-w-md rounded-3xl p-8 text-center"
            role="alert"
          >
            <p className="kicker text-sky-400">System Fault / خلل تقني</p>
            <h2 className="display mt-3 text-2xl font-bold text-title">
              Instrument Panel Offline
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              A rendering fault interrupted this page. Reloading usually clears it — your
              language and theme preferences are preserved on this device.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted" dir="rtl">
              حدث خلل أثناء عرض الصفحة. إعادة التحميل تحل المشكلة عادةً، وستُحفظ تفضيلات
              اللغة والمظهر على هذا الجهاز.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400 px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_25px_rgba(56,189,248,0.35)] transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Reload / إعادة التحميل
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
