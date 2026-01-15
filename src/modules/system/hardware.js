/**
 * Hardware information collection module
 * Enhanced with Gamepad API, GPU memory estimation, and more sensors
 */

/**
 * Estimates GPU memory using WebGL context
 * @returns {string} Estimated GPU memory
 */
function estimateGPUMemory() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    if (!gl) {
      return 'Unknown';
    }

    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    if (!ext) {
      return 'Unknown';
    }

    const renderer = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL);

    // Try to extract memory from renderer string (some drivers expose this)
    const memMatch = renderer.match(/(\d+)\s*(?:MB|GB)/i);
    if (memMatch) {
      return memMatch[0];
    }

    // Estimate based on max texture size as rough proxy
    const maxTexture = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    if (maxTexture >= 16384) {
      return '>= 4GB (Estimated)';
    }
    if (maxTexture >= 8192) {
      return '>= 2GB (Estimated)';
    }
    if (maxTexture >= 4096) {
      return '>= 1GB (Estimated)';
    }
    return '< 1GB (Estimated)';
  } catch (e) {
    return 'Error';
  }
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
 * Collects hardware, battery, memory, and sensor information
 * @returns {Promise<Object>} Hardware data object
 */
export async function collectHardwareData() {
  const hardwareData = {
    'CPU Cores (Logical)': navigator.hardwareConcurrency || 'Unknown',
    'Device Memory': 'deviceMemory' in navigator ? navigator.deviceMemory + ' GB' : 'Not Exposed',
    'Touch Points': navigator.maxTouchPoints,
    'Touch Support': 'ontouchstart' in window ? 'Yes' : 'No',
  };

  // GPU Memory Estimation
  hardwareData['GPU Memory (Est.)'] = estimateGPUMemory();

  // Battery API
  if (typeof navigator.getBattery === 'function') {
    try {
      const battery = await navigator.getBattery();
      hardwareData['Battery Level'] = (battery.level * 100).toFixed(0) + '%';
      hardwareData['Charging'] = battery.charging ? 'Yes' : 'No';
      hardwareData['Charging Time'] =
        battery.chargingTime === Infinity ? 'N/A' : (battery.chargingTime / 60).toFixed(0) + ' min';
      hardwareData['Discharging Time'] =
        battery.dischargingTime === Infinity
          ? 'N/A'
          : (battery.dischargingTime / 60).toFixed(0) + ' min';
    } catch (e) {
      hardwareData['Battery Status'] = 'Blocked / Not Accessible';
    }
  } else {
    hardwareData['Battery API'] = 'Not Supported (Safari/Firefox)';
  }

  // Performance Memory (Chrome only)
  try {
    if (performance && performance.memory) {
      hardwareData['JS Heap Size Limit'] =
        (performance.memory.jsHeapSizeLimit / 1048576).toFixed(0) + ' MB';
      hardwareData['Total JS Heap Size'] =
        (performance.memory.totalJSHeapSize / 1048576).toFixed(0) + ' MB';
      hardwareData['Used JS Heap Size'] =
        (performance.memory.usedJSHeapSize / 1048576).toFixed(0) + ' MB';
    }
  } catch (e) {
    /* ignore */
  }

  // Storage Estimate
  if (navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      hardwareData['Storage Quota'] = (estimate.quota / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
      hardwareData['Storage Usage'] = (estimate.usage / 1048576).toFixed(2) + ' MB';
    } catch (e) {
      hardwareData['Storage Info'] = 'Access Denied';
    }
  }

  // Gamepad API
  const gamepadInfo = getGamepadInfo();
  hardwareData['Gamepad API'] = gamepadInfo.supported ? 'Supported' : 'Not Supported';
  if (gamepadInfo.count > 0) {
    hardwareData['Connected Gamepads'] = gamepadInfo.count;
    hardwareData['Gamepad IDs'] = gamepadInfo.devices.map((d) => d.id).join(', ');
  }

  // Bluetooth
  const btStatus = await getBluetoothStatus();
  hardwareData['Bluetooth API'] = btStatus.supported ? 'Supported' : 'Not Supported';
  if (btStatus.supported && btStatus.available !== undefined) {
    hardwareData['Bluetooth Available'] = btStatus.available ? 'Yes' : 'No';
  }

  // USB (previously paired devices only)
  const usbStatus = await getUSBStatus();
  hardwareData['WebUSB API'] = usbStatus.supported ? 'Supported' : 'Not Supported';
  if (usbStatus.supported && usbStatus.pairedDevices !== undefined) {
    hardwareData['Paired USB Devices'] = usbStatus.pairedDevices;
  }

  // Device Orientation/Motion sensors
  hardwareData['Device Orientation API'] =
    'DeviceOrientationEvent' in window ? 'Supported' : 'Not Supported';
  hardwareData['Device Motion API'] = 'DeviceMotionEvent' in window ? 'Supported' : 'Not Supported';

  // Vibration API
  hardwareData['Vibration API'] = 'vibrate' in navigator ? 'Supported' : 'Not Supported';

  // Wake Lock API
  hardwareData['Wake Lock API'] = 'wakeLock' in navigator ? 'Supported' : 'Not Supported';

  return hardwareData;
}
