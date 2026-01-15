/**
 * Browser/Navigator data collection module
 * Enhanced with additional APIs and speech synthesis fingerprint
 */

/**
 * Collects comprehensive browser and navigator data
 * @returns {Object} Browser data object
 */
export function collectBrowserData() {
  const nav = navigator;
  const browserData = {};

  // Core Navigator Properties
  browserData['userAgent'] = nav.userAgent;
  browserData['appVersion'] = nav.appVersion;
  browserData['platform'] = nav.platform;
  browserData['vendor'] = nav.vendor;
  browserData['product'] = nav.product;
  browserData['productSub'] = nav.productSub;
  browserData['vendorSub'] = nav.vendorSub || 'N/A';

  // Language
  browserData['language'] = nav.language;
  browserData['languages'] = nav.languages ? nav.languages.join(', ') : '';

  // Features
  browserData['cookieEnabled'] = nav.cookieEnabled;
  browserData['onLine'] = nav.onLine;
  browserData['doNotTrack'] = nav.doNotTrack || 'Not Set';
  browserData['globalPrivacyControl'] = nav.globalPrivacyControl ? 'Enabled' : 'Not Set';

  // Hardware hints
  browserData['hardwareConcurrency'] = nav.hardwareConcurrency || 'Unknown';
  browserData['deviceMemory'] = 'deviceMemory' in nav ? nav.deviceMemory + ' GB' : 'Not Exposed';
  browserData['maxTouchPoints'] = nav.maxTouchPoints;
  browserData['pdfViewerEnabled'] =
    nav.pdfViewerEnabled !== undefined ? (nav.pdfViewerEnabled ? 'Yes' : 'No') : 'Unknown';

  // WebDriver (automation detection)
  browserData['webdriver'] = nav.webdriver
    ? { value: 'TRUE (Automation Detected)', warning: true }
    : 'False';

  // Plugins
  if (nav.plugins) {
    const pluginsList = [];
    for (let i = 0; i < nav.plugins.length; i++) {
      pluginsList.push(nav.plugins[i].name);
    }
    browserData['Plugins Count'] = nav.plugins.length;
    browserData['Plugins'] = pluginsList.length > 0 ? pluginsList.join(', ') : 'None/Hidden';
  }

  // MimeTypes
  if (nav.mimeTypes) {
    browserData['MimeTypes Count'] = nav.mimeTypes.length;
    if (nav.mimeTypes.length > 0 && nav.mimeTypes.length <= 20) {
      const mimeList = [];
      for (let i = 0; i < nav.mimeTypes.length; i++) {
        mimeList.push(nav.mimeTypes[i].type);
      }
      browserData['MimeTypes'] = mimeList.join(', ');
    } else if (nav.mimeTypes.length > 20) {
      browserData['MimeTypes'] = `${nav.mimeTypes.length} types (too many to list)`;
    }
  }

  // Connection Information
  if (nav.connection) {
    browserData['Connection Type'] = nav.connection.effectiveType || 'Unknown';
    browserData['Downlink'] = (nav.connection.downlink || 0) + ' Mbps';
    browserData['RTT'] = (nav.connection.rtt || 0) + ' ms';
    browserData['Save Data'] = nav.connection.saveData ? 'Yes' : 'No';
  } else {
    browserData['Network Info API'] = 'Not Supported';
  }

  // Credentials API
  browserData['Credentials API'] = 'credentials' in nav ? 'Supported' : 'Not Supported';

  // Geolocation API
  browserData['Geolocation API'] = 'geolocation' in nav ? 'Supported' : 'Not Supported';

  // Notification API
  if ('Notification' in window) {
    browserData['Notification Permission'] = Notification.permission;
  }

  // Share API
  browserData['Web Share API'] = 'share' in nav ? 'Supported' : 'Not Supported';
  browserData['Share File Support'] = 'canShare' in nav ? 'Supported' : 'Not Supported';

  // Clipboard API
  browserData['Clipboard API'] = 'clipboard' in nav ? 'Supported' : 'Not Supported';

  // Locks API
  browserData['Web Locks API'] = 'locks' in nav ? 'Supported' : 'Not Supported';

  // Media Session API
  browserData['Media Session API'] = 'mediaSession' in nav ? 'Supported' : 'Not Supported';

  // Presentation API
  browserData['Presentation API'] = 'presentation' in nav ? 'Supported' : 'Not Supported';

  // Scheduling API
  browserData['Scheduling API'] = 'scheduling' in nav ? 'Supported' : 'Not Supported';

  // Storage API
  browserData['Storage Manager API'] = 'storage' in nav ? 'Supported' : 'Not Supported';

  // Vibration API
  browserData['Vibration API'] = 'vibrate' in nav ? 'Supported' : 'Not Supported';

  // XR (WebXR)
  browserData['WebXR API'] = 'xr' in nav ? 'Supported' : 'Not Supported';

  // WindowControlsOverlay (PWA)
  browserData['Window Controls Overlay'] =
    'windowControlsOverlay' in nav ? 'Supported' : 'Not Supported';

  return browserData;
}
