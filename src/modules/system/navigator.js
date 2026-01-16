/**
 * Navigator Variables and Feature Detection Module
 * Enhanced with MDN Resource Links
 */

export async function collectNavigatorData() {
  const nav = navigator;
  const data = {};

  // --- 1. Core Navigator Functions ---
  data['User Agent'] = { 
      value: nav.userAgent, 
      url: 'https://developer.mozilla.org/en-US/docs/Web/API/Navigator/userAgent' 
  };
  data['Language'] = { 
    value: nav.language, 
    url: 'https://developer.mozilla.org/en-US/docs/Web/API/Navigator/language' 
  };
  data['Languages'] = { 
    value:  nav.languages ? nav.languages.join(', ') : 'N/A', 
    url: 'https://developer.mozilla.org/en-US/docs/Web/API/Navigator/languages' 
  };
  data['Cookies Enabled'] = { 
    value: nav.cookieEnabled ? 'Yes' : 'No', 
    url: 'https://developer.mozilla.org/en-US/docs/Web/API/Navigator/cookieEnabled' 
  };
  data['Do Not Track'] = { 
    value: nav.doNotTrack === '1' ? 'Enabled' : 'Disabled', 
    url: 'https://developer.mozilla.org/en-US/docs/Web/API/Navigator/doNotTrack' 
  };
  data['Global Privacy Control'] = { 
    value: nav.globalPrivacyControl ? 'Enabled' : 'Not Set', 
    url: 'https://globalprivacycontrol.org/' 
  };

  // --- 2. Feature Detection (APIs) ---
  
  // Storage & Files
  data['Storage Manager API'] = {
      value: 'storage' in nav ? 'Supported' : 'Not Supported',
      url: 'https://developer.mozilla.org/en-US/docs/Web/API/StorageManager'
  };
  data['File System Access API'] = {
      value: 'showOpenFilePicker' in window ? 'Supported' : 'Not Supported',
      url: 'https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API'
  };

  // Hardware/Communication
  data['Web Bluetooth API'] = {
      value: 'bluetooth' in nav ? 'Supported' : 'Not Supported',
      url: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API'
  };
  data['Web USB API'] = {
      value: 'usb' in nav ? 'Supported' : 'Not Supported',
      url: 'https://developer.mozilla.org/en-US/docs/Web/API/WebUSB_API'
  };
  data['Web HID API'] = {
      value: 'hid' in nav ? 'Supported' : 'Not Supported',
      url: 'https://developer.mozilla.org/en-US/docs/Web/API/WebHID_API'
  };
  data['Web Serial API'] = {
      value: 'serial' in nav ? 'Supported' : 'Not Supported',
      url: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API'
  };
  data['Gamepads API'] = {
      value: 'getGamepads' in nav ? 'Supported' : 'Not Supported',
      url: 'https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API'
  };

  // Security & Auth
  data['Web Authentication API'] = {
      value: 'credentials' in nav ? 'Supported' : 'Not Supported',
      url: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API'
  };
  data['Credential Management API'] = {
      value: 'credentials' in nav ? 'Supported' : 'Not Supported',
      url: 'https://developer.mozilla.org/en-US/docs/Web/API/Credential_Management_API'
  };

  // Input & Share
  data['Web Share API'] = {
      value: 'share' in nav ? 'Supported' : 'Not Supported',
      url: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_Share_API'
  };
  data['Clipboard API'] = {
      value: 'clipboard' in nav ? 'Supported' : 'Not Supported',
      url: 'https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API'
  };
  data['Virtual Keyboard API'] = {
      value: 'virtualKeyboard' in nav ? 'Supported' : 'Not Supported',
      url: 'https://developer.mozilla.org/en-US/docs/Web/API/VirtualKeyboard_API'
  };

  // Media & VR
  data['WebXR Device API'] = {
      value: 'xr' in nav ? 'Supported' : 'Not Supported',
      url: 'https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API'
  };
  data['Media Session API'] = {
      value: 'mediaSession' in nav ? 'Supported' : 'Not Supported',
      url: 'https://developer.mozilla.org/en-US/docs/Web/API/Media_Session_API'
  };
  data['Picture-in-Picture'] = {
      value: 'pictureInPictureEnabled' in document ? 'Supported' : 'Not Supported',
      url: 'https://developer.mozilla.org/en-US/docs/Web/API/Picture-in-Picture_API'
  };

  // Other Modern APIs
  data['Service Worker'] = {
      value: 'serviceWorker' in nav ? 'Supported' : 'Not Supported',
      url: 'https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API'
  };
  data['Push API'] = {
      value: 'PushManager' in window ? 'Supported' : 'Not Supported',
      url: 'https://developer.mozilla.org/en-US/docs/Web/API/Push_API'
  };
  data['Presentation API'] = {
      value: 'presentation' in nav ? 'Supported' : 'Not Supported',
      url: 'https://developer.mozilla.org/en-US/docs/Web/API/Presentation_API'
  };
  data['Wake Lock API'] = {
      value: 'wakeLock' in nav ? 'Supported' : 'Not Supported',
      url: 'https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API'
  };
  
  // PDF Viewer
  data['PDF Viewer'] = { 
      value: nav.pdfViewerEnabled === true ? 'Enabled' : (nav.pdfViewerEnabled === false ? 'Disabled' : 'Unknown'),
      url: 'https://developer.mozilla.org/en-US/docs/Web/API/Navigator/pdfViewerEnabled' 
  };


  return data;
}
