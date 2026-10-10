let supportChecked = false;
let supportResult = false;

/**
 * One-shot capability probe kept outside the Three.js dependency graph so a
 * WebGL scene can decide whether it should load the renderer at all. Result
 * is memoized: probing creates a scratch context, and doing that per component
 * under React StrictMode double-mount would burn two of the tab's context
 * budget.
 */
export function isWebGLSupported(): boolean {
  if (supportChecked) return supportResult;
  supportChecked = true;

  if (typeof document === 'undefined') {
    supportResult = false;
    return supportResult;
  }

  try {
    const probe = document.createElement('canvas');
    supportResult = Boolean(
      (probe.getContext('webgl2') as WebGL2RenderingContext | null) ??
        (probe.getContext('webgl') as WebGLRenderingContext | null),
    );
  } catch {
    supportResult = false;
  }
  return supportResult;
}

/** Escape hatch for tests and forced-failover smoke runs. */
export function resetWebGLSupportCache(): void {
  supportChecked = false;
  supportResult = false;
}
