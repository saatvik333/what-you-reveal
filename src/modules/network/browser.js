/**
 * Browser/Navigator data collection module
 * Enhanced with modern Web APIs (2024+)
 */

/**
 * Collects comprehensive browser and navigator data
 * @returns {Promise<Object>} Browser data object
 */
export async function collectBrowserData() {
  const nav = navigator;
  const browserData = {};

  // ===== Core Navigator Properties =====
  browserData['User Agent'] = nav.userAgent;
  browserData['Platform'] = nav.platform;
  browserData['Vendor'] = nav.vendor;

  // ===== User-Agent Client Hints (Modern UA) =====
  if (nav.userAgentData) {
    browserData['UA Brands'] = nav.userAgentData.brands
      ?.map(b => `${b.brand} ${b.version}`)
      .join(', ') || 'N/A';
    browserData['UA Mobile'] = nav.userAgentData.mobile ? 'Yes' : 'No';
    browserData['UA Platform'] = nav.userAgentData.platform || 'Unknown';
    
    // High Entropy Values (requires permission in some browsers)
    try {
      const hints = await nav.userAgentData.getHighEntropyValues([
        'architecture', 'bitness', 'model', 'platformVersion', 'uaFullVersion', 'formFactor',
      ]);
      browserData['UA Full Version'] = hints.uaFullVersion || 'N/A';
      browserData['UA Architecture'] = hints.architecture || 'Unknown';
      browserData['UA Bitness'] = hints.bitness || 'Unknown';
      browserData['UA Model'] = hints.model || 'N/A';
      browserData['UA Platform Version'] = hints.platformVersion || 'Unknown';
      browserData['UA Form Factor'] = hints.formFactor?.join(', ') || 'Unknown';
    } catch (e) {
      browserData['UA High Entropy'] = 'Blocked/Error';
    }
  } else {
    browserData['User-Agent Client Hints'] = 'Not Supported';
  }

  // ===== Language & Localization =====
  browserData['Language'] = nav.language;
  browserData['Languages'] = nav.languages ? nav.languages.join(', ') : '';

  // ===== Privacy Signals =====
  browserData['Cookies Enabled'] = nav.cookieEnabled ? 'Yes' : 'No';
  browserData['Online Status'] = nav.onLine ? 'Online' : 'Offline';
  browserData['Do Not Track'] = nav.doNotTrack === '1' ? 'Enabled' : 'Disabled';
  browserData['Global Privacy Control'] = nav.globalPrivacyControl ? 'Enabled' : 'Not Set';
  
  // ===== Automation Detection =====
  browserData['WebDriver'] = nav.webdriver
    ? { value: 'TRUE (Automation Detected)', warning: true }
    : 'False';

  // ===== PDF Viewer =====
  browserData['PDF Viewer'] = nav.pdfViewerEnabled !== undefined 
    ? (nav.pdfViewerEnabled ? 'Built-in' : 'External/None') 
    : 'Unknown';

  // ===== Plugins & MimeTypes =====
  browserData['Plugins Count'] = nav.plugins?.length || 0;
  browserData['MimeTypes Count'] = nav.mimeTypes?.length || 0;

  // ===== Network Information API =====
  if (nav.connection) {
    browserData['Connection Type'] = nav.connection.effectiveType || 'Unknown';
    browserData['Downlink Speed'] = (nav.connection.downlink || 0) + ' Mbps';
    browserData['Round Trip Time'] = (nav.connection.rtt || 0) + ' ms';
    browserData['Save Data Mode'] = nav.connection.saveData ? 'Yes' : 'No';
    browserData['Connection Metered'] = nav.connection.metered ? 'Yes' : 'No';
  } else {
    browserData['Network Info API'] = 'Not Supported';
  }

  // ===== Modern Web APIs - Feature Detection =====
  
  // Credential Management
  browserData['Credentials API'] = 'credentials' in nav ? 'Supported' : 'Not Supported';
  browserData['Web Authentication (WebAuthn)'] = 'PublicKeyCredential' in window ? 'Supported' : 'Not Supported';
  
  // File & Storage
  browserData['File System Access API'] = 'showOpenFilePicker' in window ? 'Supported' : 'Not Supported';
  browserData['Storage Manager API'] = 'storage' in nav ? 'Supported' : 'Not Supported';
  browserData['File Handling API'] = 'launchQueue' in window ? 'Supported' : 'Not Supported';
  
  // Communication
  browserData['Web Share API'] = 'share' in nav ? 'Supported' : 'Not Supported';
  browserData['Web Transport API'] = 'WebTransport' in window ? 'Supported' : 'Not Supported';
  browserData['WebSocket Streams'] = 'WebSocketStream' in window ? 'Supported' : 'Not Supported';
  
  // Media & Graphics
  browserData['Media Session API'] = 'mediaSession' in nav ? 'Supported' : 'Not Supported';
  browserData['Picture-in-Picture API'] = 'pictureInPictureEnabled' in document ? 'Supported' : 'Not Supported';
  browserData['Document PiP API'] = 'documentPictureInPicture' in window ? 'Supported' : 'Not Supported';
  browserData['View Transitions API'] = 'startViewTransition' in document ? 'Supported' : 'Not Supported';
  
  // Input & Interaction
  browserData['Clipboard API'] = 'clipboard' in nav ? 'Supported' : 'Not Supported';
  browserData['Web Locks API'] = 'locks' in nav ? 'Supported' : 'Not Supported';
  browserData['EyeDropper API'] = 'EyeDropper' in window ? 'Supported' : 'Not Supported';
  browserData['Ink API'] = 'ink' in nav ? 'Supported' : 'Not Supported';
  browserData['Virtual Keyboard API'] = 'virtualKeyboard' in nav ? 'Supported' : 'Not Supported';
  
  // Navigation & History
  browserData['Navigation API'] = 'navigation' in window ? 'Supported' : 'Not Supported';
  browserData['URLPattern API'] = 'URLPattern' in window ? 'Supported' : 'Not Supported';
  
  // Presentation & Display
  browserData['Presentation API'] = 'presentation' in nav ? 'Supported' : 'Not Supported';
  browserData['WebXR API'] = 'xr' in nav ? 'Supported' : 'Not Supported';
  browserData['Fullscreen API'] = 'fullscreenEnabled' in document ? 'Supported' : 'Not Supported';
  
  // PWA Features
  browserData['Window Controls Overlay'] = 'windowControlsOverlay' in nav ? 'Supported' : 'Not Supported';
  browserData['App Badging API'] = 'setAppBadge' in nav ? 'Supported' : 'Not Supported';
  browserData['Launch Handler API'] = 'launchParams' in window ? 'Supported' : 'Not Supported';
  
  // Performance & Scheduling
  browserData['Scheduling API'] = 'scheduling' in nav ? 'Supported' : 'Not Supported';
  browserData['Priority Hints'] = 'fetchPriority' in HTMLImageElement.prototype ? 'Supported' : 'Not Supported';
  browserData['Reporting API'] = 'ReportingObserver' in window ? 'Supported' : 'Not Supported';
  
  // Security
  browserData['Trusted Types API'] = 'trustedTypes' in window ? 'Supported' : 'Not Supported';
  browserData['Sanitizer API'] = 'Sanitizer' in window ? 'Supported' : 'Not Supported';
  
  // Notification
  if ('Notification' in window) {
    browserData['Notification Permission'] = Notification.permission;
  }
  browserData['Push API'] = 'PushManager' in window ? 'Supported' : 'Not Supported';
  
  // Workers
  browserData['Service Worker'] = 'serviceWorker' in nav ? 'Supported' : 'Not Supported';
  browserData['Shared Worker'] = 'SharedWorker' in window ? 'Supported' : 'Not Supported';
  browserData['Worklets'] = 'Worklet' in window ? 'Supported' : 'Not Supported';
  
  // Experimental / Cutting Edge
  browserData['Speculation Rules'] = 'supports' in HTMLScriptElement && HTMLScriptElement.supports('speculationrules') 
    ? 'Supported' : 'Not Supported';
  browserData['Compression Streams'] = 'CompressionStream' in window ? 'Supported' : 'Not Supported';

  return browserData;
}

