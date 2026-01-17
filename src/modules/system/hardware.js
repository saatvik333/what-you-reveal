/**
 * Hardware information collection module
 * Enhanced with Gamepad API, GPU memory estimation, and more sensors
 */

/**
 * Estimates GPU memory and capabilities using WebGL
 * @returns {Object} GPU data object
 */
function getGPUInfo() {
  const gpuData = {};
  
  try {
    const canvas = document.createElement('canvas');
    // Prefer WebGL2 for better info
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    if (!gl) {
      return { 'GPU Context': 'Not Available' };
    }

    gpuData['WebGL Version'] = {
        value: gl instanceof WebGL2RenderingContext ? '2.0' : '1.0',
        url: 'https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API'
    };

    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    if (ext) {
      const vendor = gl.getParameter(ext.UNMASKED_VENDOR_WEBGL);
      const renderer = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL);
      gpuData['GPU Vendor'] = vendor;
      gpuData['GPU Renderer'] = renderer;

      // Try to extract memory from renderer string (NVIDIA/AMD often expose this)
      const memMatch = renderer.match(/(\d+)\s*(?:MB|GB)/i);
      if (memMatch) {
        gpuData['GPU Memory (Reported)'] = memMatch[0];
      }
    }

    // Collect multiple parameters for better estimation
    const maxTexture = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    const maxRenderbuffer = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE);
    const maxViewport = gl.getParameter(gl.MAX_VIEWPORT_DIMS);
    const maxVertexAttribs = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
    const maxTextureUnits = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);

    gpuData['Max Texture Size'] = maxTexture;
    gpuData['Max Renderbuffer Size'] = maxRenderbuffer;
    gpuData['Max Viewport'] = `${maxViewport[0]} x ${maxViewport[1]}`;
    gpuData['Max Vertex Attribs'] = maxVertexAttribs;
    gpuData['Max Texture Units'] = maxTextureUnits;

    // GPU Tier estimation (more robust than texture size alone)
    // Uses combination of parameters
    let tier = 'Low';
    if (maxTexture >= 16384 && maxTextureUnits >= 32 && maxVertexAttribs >= 16) {
      tier = 'High';
    } else if (maxTexture >= 8192 && maxTextureUnits >= 16) {
      tier = 'Medium';
    }
    gpuData['GPU Tier (Est.)'] = tier;

    // WebGL2 specific features
    if (gl instanceof WebGL2RenderingContext) {
      gpuData['Max 3D Texture Size'] = gl.getParameter(gl.MAX_3D_TEXTURE_SIZE);
      gpuData['Max Samples'] = gl.getParameter(gl.MAX_SAMPLES);
    }

    // Check for hardware acceleration
    const isSwiftShader = gpuData['GPU Renderer']?.includes('SwiftShader') || 
                          gpuData['GPU Renderer']?.includes('llvmpipe');
    if (isSwiftShader) {
      gpuData['Hardware Acceleration'] = { value: 'Software (SwiftShader/llvmpipe)', warning: true };
    } else {
      gpuData['Hardware Acceleration'] = 'Enabled';
    }

  } catch (e) {
    return { 'GPU Info': 'Error: ' + e.message };
  }

  return gpuData;
}

/**
 * Gets connected gamepad information
 * @returns {Object} Gamepad data
 */
function getGamepadInfo() {
  try {
    if (!navigator.getGamepads) {
      return { supported: false };
    }

    const gamepads = navigator.getGamepads();
    const connected = [];

    for (const gp of gamepads) {
      if (gp) {
        connected.push({
          id: gp.id,
          buttons: gp.buttons.length,
          axes: gp.axes.length,
          mapping: gp.mapping,
        });
      }
    }

    return {
      supported: true,
      count: connected.length,
      devices: connected,
    };
  } catch (e) {
    return { supported: false, error: e.message };
  }
}

/**
 * Checks for Bluetooth availability
 * @returns {Promise<Object>} Bluetooth status
 */
async function getBluetoothStatus() {
  try {
    if (!navigator.bluetooth) {
      return { supported: false };
    }

    // Just check if API exists, don't request permissions
    const available = await navigator.bluetooth.getAvailability();
    return { supported: true, available };
  } catch (e) {
    return { supported: true, available: 'Permission Denied' };
  }
}

/**
 * Gets USB device information (if previously granted)
 * @returns {Promise<Object>} USB status
 */
async function getUSBStatus() {
  try {
    if (!navigator.usb) {
      return { supported: false };
    }

    // Get previously paired devices only
    const devices = await navigator.usb.getDevices();
    return {
      supported: true,
      pairedDevices: devices.length,
      devices: devices.map((d) => `${d.vendorId}:${d.productId}`),
    };
  } catch (e) {
    return { supported: true, error: 'Access Denied' };
  }
}

/**
 * Infers device class from available signals
 * Uses multiple signals for robust classification:
 * 1. User-Agent Client Hints (primary, when available)
 * 2. Aspect ratio + CSS dimensions (fallback)
 * 3. Pointer/touch capabilities
 * @returns {Object} Device classification data
 */
function inferDeviceClass() {
  const data = {};
  
  const touchPoints = navigator.maxTouchPoints || 0;
  const hasTouch = 'ontouchstart' in window || touchPoints > 0;
  const screenWidth = screen.width;
  const screenHeight = screen.height;
  const dpr = window.devicePixelRatio || 1;
  
  // Pointer type detection
  const hasFinePointer = window.matchMedia('(pointer: fine)').matches;
  const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const hasHover = window.matchMedia('(hover: hover)').matches;
  const hasAnyFine = window.matchMedia('(any-pointer: fine)').matches;
  const hasAnyCoarse = window.matchMedia('(any-pointer: coarse)').matches;
  
  // Stylus detection: fine pointer + touch capability
  const likelyHasStylus = hasAnyFine && hasAnyCoarse;
  
  // Device class inference
  let deviceClass = 'Unknown';
  let confidence = 'Low';
  
  // --- Primary Signal: User-Agent Client Hints ---
  // This is the browser's own statement about the device type
  const uaData = navigator.userAgentData;
  const isMobileUA = uaData?.mobile === true;
  const isDesktopUA = uaData?.mobile === false;
  
  // --- Secondary Signals for Phone vs Tablet distinction ---
  // Calculate aspect ratio (taller = more phone-like)
  const shorterSide = Math.min(screenWidth, screenHeight);
  const longerSide = Math.max(screenWidth, screenHeight);
  const aspectRatio = longerSide / shorterSide; // e.g., 2.16 for 19.5:9 phone
  
  // Phones typically: shorter CSS side < 500px AND aspect ratio > 1.6
  // Tablets typically: shorter CSS side >= 600px OR aspect ratio < 1.5 (more square)
  const isPhoneLikeScreen = shorterSide < 500 && aspectRatio > 1.6;
  const isTabletLikeScreen = shorterSide >= 600 || aspectRatio < 1.5;
  
  // --- Classification Logic ---
  if (isMobileUA && hasTouch && hasCoarsePointer && !hasHover) {
    // User-Agent says mobile + touch device without hover
    if (isPhoneLikeScreen) {
      deviceClass = 'Mobile Phone';
      confidence = 'High';
    } else if (isTabletLikeScreen) {
      deviceClass = 'Tablet';
      confidence = 'High';
    } else {
      // Ambiguous screen size, trust the UA
      deviceClass = 'Mobile Phone';
      confidence = 'Medium';
    }
  } else if (isDesktopUA && hasFinePointer && hasHover) {
    // User-Agent says desktop + mouse/trackpad with hover
    deviceClass = 'Desktop/Laptop';
    confidence = 'High';
  } else if (hasTouch && !hasFinePointer && !hasHover) {
    // Fallback: Pure touch device (no UA data or UA unavailable)
    if (isPhoneLikeScreen) {
      deviceClass = 'Mobile Phone';
      confidence = 'High';
    } else if (isTabletLikeScreen) {
      deviceClass = 'Tablet';
      confidence = 'Medium';
    } else {
      // Default to phone for narrow screens, tablet for wider
      deviceClass = shorterSide < 450 ? 'Mobile Phone' : 'Tablet';
      confidence = 'Medium';
    }
  } else if (hasFinePointer && hasHover && !hasCoarsePointer) {
    // Pure mouse/trackpad device
    deviceClass = 'Desktop/Laptop';
    confidence = 'High';
  } else if (hasFinePointer && hasTouch) {
    // Hybrid: laptop with touchscreen or tablet with keyboard
    if (touchPoints >= 5) {
      deviceClass = 'Convertible/2-in-1';
    } else {
      deviceClass = 'Desktop/Laptop (Touch)';
    }
    confidence = 'Medium';
  } else if (hasCoarsePointer && hasAnyFine) {
    // Primary is touch, but has fine pointer (stylus or connected mouse)
    deviceClass = 'Tablet (with Stylus/Mouse)';
    confidence = 'Medium';
  }
  
  // TV detection (large screen, no touch, limited pointing)
  const physicalWidth = screenWidth * dpr;
  if (!hasTouch && physicalWidth >= 1920 && !hasFinePointer && !isDesktopUA) {
    deviceClass = 'Smart TV / Game Console';
    confidence = 'Medium';
  }
  
  data['Device Class'] = deviceClass;
  data['Classification Confidence'] = confidence;
  data['Has Stylus (Likely)'] = likelyHasStylus ? 'Yes' : 'No';
  
  return data;
}

/**
 * Collects hardware, battery, memory, and sensor information
 * @returns {Promise<Object>} Hardware data object
 */
export async function collectHardwareData() {
  const hardwareData = {};
  
  // Device Class Inference (at the top for context)
  const deviceClass = inferDeviceClass();
  Object.assign(hardwareData, deviceClass);

  // Core hardware
  hardwareData['CPU Cores (Logical)'] = {
      value: navigator.hardwareConcurrency || 'Unknown',
      url: 'https://developer.mozilla.org/en-US/docs/Web/API/Navigator/hardwareConcurrency'
  };
  hardwareData['Device Memory'] = {
      value: 'deviceMemory' in navigator ? navigator.deviceMemory + ' GB (Bucketed)' : 'Not Exposed',
      url: 'https://developer.mozilla.org/en-US/docs/Web/API/Navigator/deviceMemory'
  };
  hardwareData['Touch Points'] = {
      value: navigator.maxTouchPoints,
      url: 'https://developer.mozilla.org/en-US/docs/Web/API/Navigator/maxTouchPoints'
  };
  hardwareData['Touch Support'] = 'ontouchstart' in window ? 'Yes' : 'No';
  
  // Pointer Events (more detailed than just touch)
  hardwareData['Pointer Events'] = {
      value: 'PointerEvent' in window ? 'Supported' : 'Not Supported',
      url: 'https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events'
  };
  hardwareData['Primary Pointer'] = window.matchMedia('(pointer: fine)').matches 
    ? 'Fine (Mouse/Trackpad)' 
    : window.matchMedia('(pointer: coarse)').matches 
      ? 'Coarse (Touch)'
      : 'None';


  // GPU Information (comprehensive)
  const gpuInfo = getGPUInfo();
  Object.assign(hardwareData, gpuInfo);

  // Battery API (Chromium-only; deprecated in Firefox since 2016, never in Safari)
  if (typeof navigator.getBattery === 'function') {
    try {
      const battery = await navigator.getBattery();
      const batteryUrl = 'https://developer.mozilla.org/en-US/docs/Web/API/Battery_Status_API';
      hardwareData['Battery Level'] = { value: (battery.level * 100).toFixed(0) + '%', url: batteryUrl };
      hardwareData['Charging'] = { value: battery.charging ? 'Yes' : 'No', url: batteryUrl };
      hardwareData['Charging Time'] = {
        value: battery.chargingTime === Infinity ? 'N/A' : (battery.chargingTime / 60).toFixed(0) + ' min',
        url: batteryUrl
      };
      hardwareData['Discharging Time'] = {
        value: battery.dischargingTime === Infinity ? 'N/A' : (battery.dischargingTime / 60).toFixed(0) + ' min',
        url: batteryUrl
      };
    } catch (e) {
      hardwareData['Battery Status'] = 'Blocked / Not Accessible';
    }
  } else {
    hardwareData['Battery API'] = {
        value: 'Not Supported (Firefox/Safari)',
        url: 'https://developer.mozilla.org/en-US/docs/Web/API/Battery_Status_API'
    };
  }

  // Performance Memory (Chrome only)
  try {
    if (performance && performance.memory) {
      const memUrl = 'https://developer.mozilla.org/en-US/docs/Web/API/Performance/memory';
      hardwareData['JS Heap Size Limit'] = {
        value: (performance.memory.jsHeapSizeLimit / 1048576).toFixed(0) + ' MB',
        url: memUrl
      };
      hardwareData['Total JS Heap Size'] = {
        value: (performance.memory.totalJSHeapSize / 1048576).toFixed(0) + ' MB',
        url: memUrl
      };
      hardwareData['Used JS Heap Size'] = {
        value: (performance.memory.usedJSHeapSize / 1048576).toFixed(0) + ' MB',
        url: memUrl
      };
    }
  } catch (e) {
    /* ignore */
  }

  // Storage Estimate
  if (navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      const storageUrl = 'https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/estimate';
      hardwareData['Storage Quota'] = {
          value: (estimate.quota / (1024 * 1024 * 1024)).toFixed(2) + ' GB',
          url: storageUrl
      };
      hardwareData['Storage Usage'] = {
          value: (estimate.usage / 1048576).toFixed(2) + ' MB',
          url: storageUrl
      };
    } catch (e) {
      hardwareData['Storage Info'] = 'Access Denied';
    }
  }

  // Gamepad API
  const gamepadInfo = getGamepadInfo();
  hardwareData['Gamepad API'] = {
      value: gamepadInfo.supported ? 'Supported' : 'Not Supported',
      url: 'https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API'
  };
  if (gamepadInfo.count > 0) {
    hardwareData['Connected Gamepads'] = gamepadInfo.count;
    hardwareData['Gamepad IDs'] = gamepadInfo.devices.map((d) => d.id).join(', ');
  }

  // Bluetooth
  const btStatus = await getBluetoothStatus();
  hardwareData['Bluetooth API'] = {
      value: btStatus.supported ? 'Supported' : 'Not Supported',
      url: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API'
  };
  if (btStatus.supported && btStatus.available !== undefined) {
    hardwareData['Bluetooth Available'] = btStatus.available ? 'Yes' : 'No';
  }

  // USB (previously paired devices only)
  const usbStatus = await getUSBStatus();
  hardwareData['WebUSB API'] = {
      value: usbStatus.supported ? 'Supported' : 'Not Supported',
      url: 'https://developer.mozilla.org/en-US/docs/Web/API/USB'
  };
  if (usbStatus.supported && usbStatus.pairedDevices !== undefined) {
    hardwareData['Paired USB Devices'] = usbStatus.pairedDevices;
  }

  // Device Orientation/Motion sensors
  hardwareData['Device Orientation API'] = {
    value: 'DeviceOrientationEvent' in window ? 'Supported' : 'Not Supported',
    url: 'https://developer.mozilla.org/en-US/docs/Web/API/Device_orientation_events'
  };
  hardwareData['Device Motion API'] = {
      value: 'DeviceMotionEvent' in window ? 'Supported' : 'Not Supported',
      url: 'https://developer.mozilla.org/en-US/docs/Web/API/DeviceMotionEvent'
  };

  // Vibration API
  hardwareData['Vibration API'] = {
      value: 'vibrate' in navigator ? 'Supported' : 'Not Supported',
      url: 'https://developer.mozilla.org/en-US/docs/Web/API/Navigator/vibrate'
  };

  // Wake Lock API
  hardwareData['Wake Lock API'] = {
      value: 'wakeLock' in navigator ? 'Supported' : 'Not Supported',
      url: 'https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API'
  };

  // Web HID API (Connected HID devices)
  if (navigator.hid) {
    try {
      const hidDevices = await navigator.hid.getDevices();
      hardwareData['Web HID API'] = {
          value: 'Supported',
          url: 'https://developer.mozilla.org/en-US/docs/Web/API/WebHID_API'
      };
      hardwareData['Connected HID Devices'] = hidDevices.length;
      if (hidDevices.length > 0) {
        hardwareData['HID Device IDs'] = hidDevices
          .map((d) => `${d.vendorId}:${d.productId}`)
          .join(', ');
      }
    } catch (e) {
      hardwareData['Web HID API'] = 'Blocked/Error';
    }
  } else {
    hardwareData['Web HID API'] = 'Not Supported';
  }

  // Web Serial API (Paired serial ports)
  if (navigator.serial) {
    try {
      const ports = await navigator.serial.getPorts();
      hardwareData['Web Serial API'] = {
          value: 'Supported',
          url: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API'
      };
      hardwareData['Paired Serial Ports'] = ports.length;
    } catch (e) {
      hardwareData['Web Serial API'] = 'Blocked/Error';
    }
  } else {
    hardwareData['Web Serial API'] = 'Not Supported';
  }

  // Compute Pressure API (Chrome 125+)
  if ('PressureObserver' in window) {
    hardwareData['Compute Pressure API'] = {
        value: 'Supported',
        url: 'https://developer.mozilla.org/en-US/docs/Web/API/Compute_Pressure_API'
    };
    // Note: Actual monitoring requires observer setup; we just detect capability here
  } else {
    hardwareData['Compute Pressure API'] = 'Not Supported';
  }

  // Generic Sensors (Accelerometer, Gyroscope - may require permissions)
  const sensorUrl = 'https://developer.mozilla.org/en-US/docs/Web/API/Sensor_APIs';
  hardwareData['Accelerometer API'] = { value: 'Accelerometer' in window ? 'Supported' : 'Not Supported', url: sensorUrl };
  hardwareData['Gyroscope API'] = { value: 'Gyroscope' in window ? 'Supported' : 'Not Supported', url: sensorUrl };
  hardwareData['Magnetometer API'] = { value: 'Magnetometer' in window ? 'Supported' : 'Not Supported', url: sensorUrl };
  hardwareData['Ambient Light Sensor'] = { value: 'AmbientLightSensor' in window ? 'Supported' : 'Not Supported', url: sensorUrl };

  return hardwareData;
}
