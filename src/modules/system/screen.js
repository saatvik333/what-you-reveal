/**
 * Screen information collection module
 * Enhanced with multi-monitor detection, HDR support, and taskbar inference
 */

/**
 * Collects screen and display information
 * @returns {Object} Screen data object
 */
export async function collectScreenData() {
  const dpr = window.devicePixelRatio || 1;

  const screenData = {
    // Screen Dimensions
    'Screen Width (CSS)': screen.width + 'px',
    'Screen Height (CSS)': screen.height + 'px',
    'Physical Width (Est.)': Math.round(screen.width * dpr) + 'px',
    'Physical Height (Est.)': Math.round(screen.height * dpr) + 'px',
    'Available Width': screen.availWidth + 'px',
    'Available Height': screen.availHeight + 'px',
    'Device Pixel Ratio': dpr,

    // Window Dimensions
    'Window Inner Size': window.innerWidth + ' x ' + window.innerHeight + 'px',
    'Window Outer Size': window.outerWidth + ' x ' + window.outerHeight + 'px',

    // Color Information
    'Color Depth': screen.colorDepth + ' bits',
    'Pixel Depth': screen.pixelDepth + ' bits',
  };

  // Screen Orientation
  if (screen.orientation) {
    screenData['Orientation Type'] = screen.orientation.type;
    screenData['Orientation Angle'] = screen.orientation.angle + '°';
  }

  // Multi-monitor detection
  if ('isExtended' in screen) {
    screenData['Multi-Monitor'] = screen.isExtended
      ? { value: 'Yes (Extended Display)', warning: true }
      : 'No';
  }

  // Taskbar position inference
  const availTop = screen.availTop || 0;
  const availLeft = screen.availLeft || 0;
  const heightDiff = screen.height - screen.availHeight;
  const widthDiff = screen.width - screen.availWidth;

  if (availTop > 0) {
    screenData['Taskbar Position'] = 'Top (~' + availTop + 'px)';
  } else if (heightDiff > 0 && availTop === 0) {
    screenData['Taskbar Position'] = 'Bottom (~' + heightDiff + 'px)';
  } else if (availLeft > 0) {
    screenData['Taskbar Position'] = 'Left (~' + availLeft + 'px)';
  } else if (widthDiff > 0) {
    screenData['Taskbar Position'] = 'Right (~' + widthDiff + 'px)';
  } else {
    screenData['Taskbar Position'] = 'None/Hidden';
  }



  // Media Query Checks - Display Capabilities
  const displayQueries = {
    'HDR Display': window.matchMedia('(dynamic-range: high)').matches,
    'Wide Color Gamut': window.matchMedia('(color-gamut: p3)').matches,
    'sRGB Gamut': window.matchMedia('(color-gamut: srgb)').matches,
    'Rec2020 Gamut': window.matchMedia('(color-gamut: rec2020)').matches,
  };

  // Report HDR/Color capabilities
  if (displayQueries['HDR Display']) {
    screenData['HDR Support'] = { value: 'Yes', warning: true };
  } else {
    screenData['HDR Support'] = 'No';
  }

  if (displayQueries['Wide Color Gamut']) {
    screenData['Color Gamut'] = 'P3 (Wide)';
  } else if (displayQueries['Rec2020 Gamut']) {
    screenData['Color Gamut'] = 'Rec2020';
  } else {
    screenData['Color Gamut'] = 'sRGB';
  }

  // Media Query Checks - User Preferences
  const preferenceQueries = {
    'Dark Mode': window.matchMedia('(prefers-color-scheme: dark)').matches,
    'Light Mode': window.matchMedia('(prefers-color-scheme: light)').matches,
    'Reduced Motion': window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    'High Contrast': window.matchMedia('(prefers-contrast: more)').matches,
    'Reduced Transparency': window.matchMedia('(prefers-reduced-transparency: reduce)').matches,
    'Forced Colors': window.matchMedia('(forced-colors: active)').matches,
    'Inverted Colors': window.matchMedia('(inverted-colors: inverted)').matches,
  };

  // Color Scheme
  if (preferenceQueries['Dark Mode']) {
    screenData['Preferred Color Scheme'] = 'Dark';
  } else if (preferenceQueries['Light Mode']) {
    screenData['Preferred Color Scheme'] = 'Light';
  } else {
    screenData['Preferred Color Scheme'] = 'No Preference';
  }

  // Accessibility preferences
  screenData['Reduced Motion'] = preferenceQueries['Reduced Motion'] ? 'Yes' : 'No';
  screenData['High Contrast Mode'] = preferenceQueries['High Contrast'] ? 'Yes' : 'No';
  screenData['Forced Colors'] = preferenceQueries['Forced Colors'] ? 'Yes' : 'No';

  // Pointer/Input detection
  const pointerQueries = {
    'Fine Pointer': window.matchMedia('(pointer: fine)').matches,
    'Coarse Pointer': window.matchMedia('(pointer: coarse)').matches,
    'Hover Capable': window.matchMedia('(hover: hover)').matches,
    'No Hover': window.matchMedia('(hover: none)').matches,
  };

  if (pointerQueries['Fine Pointer']) {
    screenData['Primary Pointer'] = 'Fine (Mouse/Trackpad)';
  } else if (pointerQueries['Coarse Pointer']) {
    screenData['Primary Pointer'] = 'Coarse (Touch/Stylus)';
  } else {
    screenData['Primary Pointer'] = 'None';
  }

  screenData['Hover Support'] = pointerQueries['Hover Capable'] ? 'Yes' : 'No';

  // Current Orientation
  if (window.matchMedia('(orientation: portrait)').matches) {
    screenData['Current Orientation'] = 'Portrait';
  } else {
    screenData['Current Orientation'] = 'Landscape';
  }

  // Display Mode (PWA detection)
  const displayModes = ['fullscreen', 'standalone', 'minimal-ui', 'browser'];
  for (const mode of displayModes) {
    if (window.matchMedia(`(display-mode: ${mode})`).matches) {
      screenData['Display Mode'] = mode.charAt(0).toUpperCase() + mode.slice(1);
      break;
    }
  }

  // Window Management API (Multi-Screen Details)
  if ('getScreenDetails' in window) {
    screenData['Window Management API'] = 'Supported';
    // Note: Actual enumeration requires user gesture and permission
    // We can check if permission is already granted
    try {
      if (navigator.permissions) {
        const perm = await navigator.permissions.query({ name: 'window-management' });
        screenData['Window Management Permission'] = perm.state;
      }
    } catch (e) {
      // Permission query might fail on some browsers
    }
  } else {
    screenData['Window Management API'] = 'Not Supported';
  }

  return screenData;
}
