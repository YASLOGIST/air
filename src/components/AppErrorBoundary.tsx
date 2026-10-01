import React from 'react';

interface State { hasError: boolean }

/** Keeps a failed interactive module from blanking the entire logistics console. */
export class AppErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { hasError: false };
  static getDerivedStateFromError(): State { return { hasError: true }; }
  componentDidCatch(error: Error) { console.error('[air-ui] recoverable module failure', error); }
  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <section className="mx-auto my-16 max-w-2xl rounded-2xl border border-amber-400/30 bg-amber-400/10 p-8 text-center" role="alert">
        <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-amber-400">Module unavailable</p>
        <h2 className="mb-3 text-2xl font-semibold text-title">The live console needs a refresh</h2>
        <p className="mb-6 text-muted">Your other freight tools remain available. Reload to retry this module.</p>
        <button className="rounded-lg bg-cyan-500 px-4 py-2 font-semibold text-slate-950" onClick={() => window.location.reload()}>Reload console</button>
      </section>
    );
  }
}
