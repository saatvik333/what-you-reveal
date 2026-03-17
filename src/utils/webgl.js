/**
 * Shared WebGL Context Utility
 * Prevents multiple instantiations of WebGL contexts which is slow and
 * can hit browser context limits.
 */

let sharedCanvas = null;
let sharedGL = null;

/**
 * Gets or creates a shared WebGL context
 * @returns {{ gl: WebGLRenderingContext | WebGL2RenderingContext | null, canvas: HTMLCanvasElement | null }}
 */
export function getSharedWebGLContext() {
  if (!sharedCanvas) {
    try {
      sharedCanvas = document.createElement('canvas');
      sharedCanvas.width = 64;
      sharedCanvas.height = 64;

      // Attempt to get WebGL2, fallback to WebGL1
      sharedGL = sharedCanvas.getContext('webgl2') ||
                 sharedCanvas.getContext('webgl') ||
                 sharedCanvas.getContext('experimental-webgl');

    } catch {
      // If creation fails, ensure they are null
      sharedCanvas = null;
      sharedGL = null;
    }
  }

  return { gl: sharedGL, canvas: sharedCanvas };
}
