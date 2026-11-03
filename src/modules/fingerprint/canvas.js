/**
 * Detects canvas fingerprinting protection.
 *
 * Brave, Firefox (fingerprinting protection / resistFingerprinting), Safari's Advanced
 * Fingerprinting Protection, Tor Browser and extensions such as CanvasBlocker alter or block
 * what canvas readback returns. Two checks catch both styles:
 * - exact colors: solid, pixel-aligned fills must read back byte-for-byte; per-session
 *   noise (farbling) changes some of them;
 * - repeatability: per-read noise makes two identical renders differ.
 * Protection that only applies to large canvases or particular calls can still go unseen,
 * so a negative result means "not detected", not "absent".
 */

const SWATCHES = [
  [0, 0, [12, 34, 56]],
  [8, 0, [200, 100, 50]],
  [0, 8, [77, 177, 27]],
  [8, 8, [250, 5, 125]],
];

function readSwatches() {
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  for (const [x, y, [r, g, b]] of SWATCHES) {
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fillRect(x, y, 8, 8);
  }
  return ctx.getImageData(0, 0, 16, 16).data;
}

function swatchesExact(pixels) {
  for (let i = 0; i < pixels.length; i += 4) {
    const px = (i / 4) % 16;
    const py = Math.floor(i / 4 / 16);
    const [, , rgb] = SWATCHES.find(([x, y]) => px >= x && px < x + 8 && py >= y && py < y + 8);
    if (pixels[i] !== rgb[0] || pixels[i + 1] !== rgb[1] || pixels[i + 2] !== rgb[2] || pixels[i + 3] !== 255) {
      return false;
    }
  }
  return true;
}

/** @returns {'altered' | 'blocked' | 'unaltered' | 'unsupported'} */
export function detectCanvasProtection() {
  try {
    const first = readSwatches();
    if (!first) return 'unsupported';
    if (!swatchesExact(first)) return 'altered';
    const second = readSwatches();
    return second.every((byte, i) => byte === first[i]) ? 'unaltered' : 'altered';
  } catch {
    // Readback throwing (e.g. a blocking extension) is protection too.
    return 'blocked';
  }
}

export function isCanvasProtected(state) {
  return state === 'altered' || state === 'blocked';
}
