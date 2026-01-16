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
  const screenUrl = 'https://developer.mozilla.org/en-US/docs/Web/API/Screen';
  const windowUrl = 'https://developer.mozilla.org/en-US/docs/Web/API/Window';

  const screenData = {
    // Screen Dimensions
    'Screen Width (CSS)': { 
        value: screen.width + 'px', 
        url: 'https://developer.mozilla.org/en-US/docs/Web/API/Screen/width' 
    },
    'Screen Height (CSS)': { 
        value: screen.height + 'px', 
        url: 'https://developer.mozilla.org/en-US/docs/Web/API/Screen/height' 
    },
    'Physical Width (Est.)': Math.round(screen.width * dpr) + 'px',
    'Physical Height (Est.)': Math.round(screen.height * dpr) + 'px',
    'Available Width': { 
        value: screen.availWidth + 'px', 
        url: 'https://developer.mozilla.org/en-US/docs/Web/API/Screen/availWidth' 
    },
    'Available Height': { 
        value: screen.availHeight + 'px', 
        url: 'https://developer.mozilla.org/en-US/docs/Web/API/Screen/availHeight' 
    },
    'Device Pixel Ratio': { 
        value: dpr, 
        url: 'https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio' 
    },

    // Window Dimensions
    'Window Inner Size': { 
        value: window.innerWidth + ' x ' + window.innerHeight + 'px', 
        url: 'https://developer.mozilla.org/en-US/docs/Web/API/Window/innerWidth' 
    },
    'Window Outer Size': { 
        value: window.outerWidth + ' x ' + window.outerHeight + 'px', 
        url: 'https://developer.mozilla.org/en-US/docs/Web/API/Window/outerWidth' 
    },

    // Color Information
    'Color Depth': { 
        value: screen.colorDepth + ' bits', 
        url: 'https://developer.mozilla.org/en-US/docs/Web/API/Screen/colorDepth' 
    },
    'Pixel Depth': { 
        value: screen.pixelDepth + ' bits', 
        url: 'https://developer.mozilla.org/en-US/docs/Web/API/Screen/pixelDepth' 
    },
  };

  // Screen Orientation
  if (screen.orientation) {
    screenData['Orientation Type'] = {
        value: screen.orientation.type,
        url: 'https://developer.mozilla.org/en-US/docs/Web/API/ScreenOrientation/type'
    };
    screenData['Orientation Angle'] = {
        value: screen.orientation.angle + '°',
        url: 'https://developer.mozilla.org/en-US/docs/Web/API/ScreenOrientation/angle'
    };
  }

  // Multi-monitor detection
  if ('isExtended' in screen) {
    screenData['Multi-Monitor'] = {
        value: screen.isExtended ? { value: 'Yes (Extended Display)', warning: true } : 'No',
        url: 'https://developer.mozilla.org/en-US/docs/Web/API/Screen/isExtended'
    };
    // Normalize if it's an object with warning
    if (typeof screenData['Multi-Monitor'].value === 'object') {
        // screenData['Multi-Monitor'] needs to be { value: '...', warning: true, url: '...' }
        const inner = screenData['Multi-Monitor'].value;
        screenData['Multi-Monitor'] = { ...inner, url: 'https://developer.mozilla.org/en-US/docs/Web/API/Screen/isExtended' };
    }
  }

  // Taskbar position inference
  const availTop = screen.availTop || 0;
  const availLeft = screen.availLeft || 0;
  const heightDiff = screen.height - screen.availHeight;
  const widthDiff = screen.width - screen.availWidth;
  let taskbarPos = 'None/Hidden';

  if (availTop > 0) {
    taskbarPos = 'Top (~' + availTop + 'px)';
  } else if (heightDiff > 0 && availTop === 0) {
    taskbarPos = 'Bottom (~' + heightDiff + 'px)';
  } else if (availLeft > 0) {
    taskbarPos = 'Left (~' + availLeft + 'px)';
  } else if (widthDiff > 0) {
    taskbarPos = 'Right (~' + widthDiff + 'px)';
  }
  screenData['Taskbar Position'] = taskbarPos;

  // Media Query Checks - Display Capabilities
  const displayQueries = {
    'HDR Display': window.matchMedia('(dynamic-range: high)').matches,
    'Wide Color Gamut': window.matchMedia('(color-gamut: p3)').matches,
    'sRGB Gamut': window.matchMedia('(color-gamut: srgb)').matches,
    'Rec2020 Gamut': window.matchMedia('(color-gamut: rec2020)').matches,
  };
  
  const mediaQueryUrl = 'https://developer.mozilla.org/en-US/docs/Web/CSS/@media';

  // Report HDR/Color capabilities
  if (displayQueries['HDR Display']) {
    screenData['HDR Support'] = { value: 'Yes', warning: true, url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/@media/dynamic-range' };
  } else {
    screenData['HDR Support'] = { value: 'No', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/@media/dynamic-range' };
  }

  if (displayQueries['Wide Color Gamut']) {
    screenData['Color Gamut'] = { value: 'P3 (Wide)', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/@media/color-gamut' };
  } else if (displayQueries['Rec2020 Gamut']) {
    screenData['Color Gamut'] = { value: 'Rec2020', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/@media/color-gamut' };
  } else {
    screenData['Color Gamut'] = { value: 'sRGB', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/@media/color-gamut' };
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
  let colorScheme = 'No Preference';
  if (preferenceQueries['Dark Mode']) {
    colorScheme = 'Dark';
  } else if (preferenceQueries['Light Mode']) {
    colorScheme = 'Light';
  }
  screenData['Preferred Color Scheme'] = { value: colorScheme, url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme' };

  // Accessibility preferences
  screenData['Reduced Motion'] = { 
      value: preferenceQueries['Reduced Motion'] ? 'Yes' : 'No', 
      url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion' 
  };
  screenData['High Contrast Mode'] = { 
      value: preferenceQueries['High Contrast'] ? 'Yes' : 'No', 
      url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-contrast' 
  };
  screenData['Forced Colors'] = { 
      value: preferenceQueries['Forced Colors'] ? 'Yes' : 'No', 
      url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors' 
  };

  // Pointer/Input detection
  const pointerQueries = {
    'Fine Pointer': window.matchMedia('(pointer: fine)').matches,
    'Coarse Pointer': window.matchMedia('(pointer: coarse)').matches,
    'Hover Capable': window.matchMedia('(hover: hover)').matches,
    'No Hover': window.matchMedia('(hover: none)').matches,
  };

  let primaryPointer = 'None';
  if (pointerQueries['Fine Pointer']) {
    primaryPointer = 'Fine (Mouse/Trackpad)';
  } else if (pointerQueries['Coarse Pointer']) {
    primaryPointer = 'Coarse (Touch/Stylus)';
  }
  screenData['Primary Pointer'] = { value: primaryPointer, url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/@media/pointer' };

  screenData['Hover Support'] = { 
      value: pointerQueries['Hover Capable'] ? 'Yes' : 'No', 
      url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/@media/hover' 
  };

  // Current Orientation
  let currentOrientation = 'Landscape';
  if (window.matchMedia('(orientation: portrait)').matches) {
    currentOrientation = 'Portrait';
  }
  screenData['Current Orientation'] = { value: currentOrientation, url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/@media/orientation' };

  // Display Mode (PWA detection)
  const displayModes = ['fullscreen', 'standalone', 'minimal-ui', 'browser'];
  for (const mode of displayModes) {
    if (window.matchMedia(`(display-mode: ${mode})`).matches) {
      screenData['Display Mode'] = { 
          value: mode.charAt(0).toUpperCase() + mode.slice(1), 
          url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/@media/display-mode' 
      };
      break;
    }
  }

  // Window Management API (Multi-Screen Details)
  if ('getScreenDetails' in window) {
    const wmUrl = 'https://developer.mozilla.org/en-US/docs/Web/API/Window_Management_API';
    screenData['Window Management API'] = { value: 'Supported', url: wmUrl };
    // Note: Actual enumeration requires user gesture and permission
    // We can check if permission is already granted
    try {
      if (navigator.permissions) {
        const perm = await navigator.permissions.query({ name: 'window-management' });
        screenData['Window Management Permission'] = { value: perm.state, url: wmUrl };
      }
    } catch (e) {
      // Permission query might fail on some browsers
    }
  } else {
    screenData['Window Management API'] = { 
        value: 'Not Supported', 
        url: 'https://developer.mozilla.org/en-US/docs/Web/API/Window_Management_API' 
    };
  }

  return screenData;
}
