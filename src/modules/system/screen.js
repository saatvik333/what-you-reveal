/**
 * Screen card: display geometry, color capability, OS accessibility preferences and input.
 */

const MDN = 'https://developer.mozilla.org/en-US/docs/Web/';
const mq = (query) => window.matchMedia(query).matches;
const yesNo = (flag) => (flag ? 'Yes' : 'No');

/** OS panels (taskbar, dock, menu bar) shrink the available area on one edge. */
function reservedEdge() {
  const top = screen.availTop ?? 0;
  const left = screen.availLeft ?? 0;
  const bottom = screen.height - screen.availHeight - top;
  const right = screen.width - screen.availWidth - left;
  const edges = [['Top', top], ['Bottom', bottom], ['Left', left], ['Right', right]].filter(([, px]) => px > 0);
  return edges.length > 0 ? edges.map(([edge, px]) => `${edge} (${px}px)`).join(', ') : 'None/Hidden';
}

async function windowManagementRows() {
  const url = `${MDN}API/Window_Management_API`;
  if (!('getScreenDetails' in window)) return { 'Window Management API': { value: 'Not Supported', url } };
  try {
    const { state } = await navigator.permissions.query({ name: 'window-management' });
    return { 'Window Management Permission': { value: state, url } };
  } catch {
    return { 'Window Management API': { value: 'Supported', url } };
  }
}

export async function collectScreenData() {
  const dpr = window.devicePixelRatio || 1;
  // rec2020 displays also match p3, which matches srgb: test the widest gamut first.
  const gamut = mq('(color-gamut: rec2020)') ? 'Rec. 2020' : mq('(color-gamut: p3)') ? 'Display P3' : 'sRGB';
  const scheme = mq('(prefers-color-scheme: dark)') ? 'Dark' : mq('(prefers-color-scheme: light)') ? 'Light' : 'No Preference';
  const pointer = mq('(pointer: fine)') ? 'Fine (Mouse/Trackpad)' : mq('(pointer: coarse)') ? 'Coarse (Touch)' : 'None';
  const displayMode = ['fullscreen', 'standalone', 'minimal-ui', 'browser'].find((mode) => mq(`(display-mode: ${mode})`));

  const data = {
    'Screen Size (CSS px)': { value: `${screen.width} x ${screen.height}`, url: `${MDN}API/Screen/width` },
    'Screen Size (Device px)': { value: `${Math.round(screen.width * dpr)} x ${Math.round(screen.height * dpr)}` },
    'Available Size': { value: `${screen.availWidth} x ${screen.availHeight}`, url: `${MDN}API/Screen/availWidth` },
    'Reserved by OS Panels': { value: reservedEdge() },
    'Device Pixel Ratio': { value: dpr, url: `${MDN}API/Window/devicePixelRatio` },
    'Window Inner Size': { value: `${window.innerWidth} x ${window.innerHeight}`, url: `${MDN}API/Window/innerWidth` },
    'Window Outer Size': { value: `${window.outerWidth} x ${window.outerHeight}`, url: `${MDN}API/Window/outerWidth` },
    'Color Depth': { value: `${screen.colorDepth} bits`, url: `${MDN}API/Screen/colorDepth` },
    'Color Gamut': { value: gamut, url: `${MDN}CSS/@media/color-gamut` },
    'HDR': { value: yesNo(mq('(dynamic-range: high)')), url: `${MDN}CSS/@media/dynamic-range` },
  };

  if (screen.orientation) {
    data['Orientation'] = { value: `${screen.orientation.type} (${screen.orientation.angle}°)`, url: `${MDN}API/ScreenOrientation/type` };
  }
  if ('isExtended' in screen) {
    data['Multiple Monitors'] = {
      value: screen.isExtended ? 'Yes (extended desktop)' : 'No',
      warning: screen.isExtended,
      url: `${MDN}API/Screen/isExtended`,
    };
  }

  Object.assign(data, {
    'Preferred Color Scheme': { value: scheme, url: `${MDN}CSS/@media/prefers-color-scheme` },
    'Reduced Motion': { value: yesNo(mq('(prefers-reduced-motion: reduce)')), url: `${MDN}CSS/@media/prefers-reduced-motion` },
    'More Contrast': { value: yesNo(mq('(prefers-contrast: more)')), url: `${MDN}CSS/@media/prefers-contrast` },
    'Reduced Transparency': { value: yesNo(mq('(prefers-reduced-transparency: reduce)')), url: `${MDN}CSS/@media/prefers-reduced-transparency` },
    'Forced Colors': { value: yesNo(mq('(forced-colors: active)')), url: `${MDN}CSS/@media/forced-colors` },
    'Primary Pointer': { value: pointer, url: `${MDN}CSS/@media/pointer` },
    'Hover Capable': { value: yesNo(mq('(hover: hover)')), url: `${MDN}CSS/@media/hover` },
    'Display Mode': { value: displayMode ?? 'Unknown', url: `${MDN}CSS/@media/display-mode` },
  });

  return Object.assign(data, await windowManagementRows());
}
