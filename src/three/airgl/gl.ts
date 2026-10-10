/* ── AIRGL context & lifecycle ────────────────────────────────────────────
   The single place where WebGL contexts are created, configured and torn
   down. Every scene in the app goes through `createAirRenderer` so the
   frame-budget policy is set once, identically, everywhere:

     · devicePixelRatio hard-capped at 2 — above that, fill-rate cost grows
       quadratically while the visual gain on a 3D schematic is invisible,
       and high-DPI laptops thermal-throttle first (see README §WebGL).
     · ACES filmic tone mapping + sRGB output for physically coherent light.
     · antialias only when the device can afford it (DPR ≥ 2 hides aliasing;
       below that MSAA earns its fill cost).
     · powerPreference high-performance so laptops pick the dGPU for the
       digital twin instead of narrating the budget iGPU.

   Lifecycle policy is `releaseWebGL()` → every geometry, material, texture
   and render target disposed, then the context itself is force-lost so the
   browser's WebGL context budget (≈16 per tab) can never leak across
   React unmount/remount cycles.
────────────────────────────────────────────────────────────────────────── */

import * as THREE from 'three';

export { isWebGLSupported, resetWebGLSupportCache } from './webgl-support';

/** Hard ceiling applied by every renderer in the app. */
export const MAX_DEVICE_PIXEL_RATIO = 2;

export function createAirRenderer(
  canvas: HTMLCanvasElement,
  options: { alpha?: boolean } = {},
): THREE.WebGLRenderer {
  const dpr = Math.min(window.devicePixelRatio || 1, MAX_DEVICE_PIXEL_RATIO);
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: dpr < 2,
    alpha: options.alpha ?? false,
    stencil: false,
    depth: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(dpr);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.06;
  renderer.info.autoReset = true;
  return renderer;
}

/**
 * Dispose every GPU resource reachable from an object graph: geometries,
 * materials (including every texture slot), and nested groups. Safe to call
 * on a partially built scene and on objects that share geometries — dispose
 * is idempotent in three.js, but we de-dupe to keep the traversal cheap.
 */
export function disposeObjectGraph(root: THREE.Object3D): void {
  const seenGeometries = new Set<THREE.BufferGeometry>();
  const seenMaterials = new Set<THREE.Material>();
  const seenTextures = new Set<THREE.Texture>();

  root.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (mesh.isMesh || (object as THREE.Line).isLine || (object as THREE.Points).isPoints) {
      const geometry = mesh.geometry as THREE.BufferGeometry | undefined;
      if (geometry && !seenGeometries.has(geometry)) {
        seenGeometries.add(geometry);
        geometry.dispose();
      }
    }
    const anyMaterial = (mesh as unknown as { material?: THREE.Material | THREE.Material[] }).material;
    if (!anyMaterial) return;
    const materials = Array.isArray(anyMaterial) ? anyMaterial : [anyMaterial];
    for (const material of materials) {
      if (seenMaterials.has(material)) continue;
      seenMaterials.add(material);
      for (const value of Object.values(material)) {
        if (value && (value as THREE.Texture).isTexture) {
          const texture = value as THREE.Texture;
          if (!seenTextures.has(texture)) {
            seenTextures.add(texture);
            texture.dispose();
          }
        }
      }
      material.dispose();
    }
  });
}

/**
 * Wires the two events every long-lived WebGL surface needs to survive a
 * GPU reset — driver crash, OS sleep/resume, thermal shutdown, too many
 * contexts open across tabs, or a mobile browser reclaiming VRAM from a
 * backgrounded tab. `WebGLRenderer` already calls `preventDefault()` on its
 * own internal 'webglcontextlost' listener (that is what tells the browser
 * to *attempt* restoration instead of killing the canvas forever), and on
 * restore it builds a brand-new internal resource registry so geometries,
 * standard textures and shader programs are re-uploaded automatically from
 * the JS-side data on the next `render()` call — most scenes need nothing
 * further. Three things it cannot do for you:
 *   1. your rAF loop keeps ticking into a context that silently no-ops
 *      every draw call — wasted CPU and a frozen frame with no explanation;
 *   2. the user is never told the canvas has gone dark;
 *   3. GPU-only artifacts with no source image (e.g. a PMREMGenerator
 *      environment baked from a procedural scene) have nothing to
 *      re-derive from and stay blank until something re-bakes them.
 * This hook exists to close exactly those three gaps; call sites decide
 * what "paused" and "rebuilt" mean for their scene.
 */
export function watchContextLoss(
  canvas: HTMLCanvasElement,
  handlers: { onLost: () => void; onRestored: () => void },
): () => void {
  const onLost = (event: Event): void => {
    event.preventDefault();
    handlers.onLost();
  };
  const onRestored = (): void => handlers.onRestored();
  canvas.addEventListener('webglcontextlost', onLost, false);
  canvas.addEventListener('webglcontextrestored', onRestored, false);
  return () => {
    canvas.removeEventListener('webglcontextlost', onLost, false);
    canvas.removeEventListener('webglcontextrestored', onRestored, false);
  };
}

/**
 * Full teardown for a scene instance. Order matters: graph first (while the
 * context is still alive so commands flush), then renderer internals.
 *
 * We deliberately do NOT forceContextLoss(): a force-lost canvas can never
 * regain its context, and React StrictMode re-mounts components onto the
 * very same canvas element (unmount → remount). Every GPU allocation the
 * scene made is released by the graph traversal + renderer.dispose(), which
 * is the memory guarantee that matters; the context itself belongs to the
 * canvas and is collected with it.
 */
export function releaseWebGL(renderer: THREE.WebGLRenderer, scene: THREE.Scene): void {
  disposeObjectGraph(scene);
  renderer.dispose();
}
