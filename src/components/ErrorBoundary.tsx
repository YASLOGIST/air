import React from 'react';

interface State { failed: boolean }

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
    return (
      <section role="alert" className="mx-auto my-8 max-w-3xl rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-center">
        <h2 className="font-bold text-title">This section could not be loaded</h2>
        <p className="mt-2 text-sm text-muted">Your other tools are still available. Reload to try this section again.</p>
        <button className="mt-4 rounded-xl bg-cyan-400 px-4 py-2 font-bold text-slate-950" onClick={() => location.reload()}>
          Reload page
        </button>
      </section>
    );
  }
}
