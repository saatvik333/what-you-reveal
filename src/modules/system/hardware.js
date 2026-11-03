/**
 * Device card: device class, CPU/memory, battery, storage and paired peripherals.
 * GPU details live in the WebGL card; API availability lives in the navigator card.
 */

const MDN = 'https://developer.mozilla.org/en-US/docs/Web/API/';
const mq = (query) => window.matchMedia(query).matches;

/** Combines UA Client Hints with pointer, hover and screen-shape media queries. */
function inferDeviceClass() {
  const touchPoints = navigator.maxTouchPoints || 0;
  const hasTouch = touchPoints > 0 || 'ontouchstart' in window;
  const fine = mq('(pointer: fine)');
  const coarse = mq('(pointer: coarse)');
  const hover = mq('(hover: hover)');
  const anyFine = mq('(any-pointer: fine)');
  const mobileUA = navigator.userAgentData?.mobile;

  // Phones: short side under 500 CSS px and a tall aspect ratio; tablets: wider or squarer.
  const shortSide = Math.min(screen.width, screen.height);
  const aspect = Math.max(screen.width, screen.height) / shortSide;
  const phoneShape = shortSide < 500 && aspect > 1.6;
  const tabletShape = shortSide >= 600 || aspect < 1.5;

  if ((mobileUA === true || (hasTouch && !fine)) && coarse && !hover) {
    if (phoneShape) return ['Mobile Phone', 'High'];
    if (tabletShape) return ['Tablet', mobileUA === true ? 'High' : 'Medium'];
    return [shortSide < 450 ? 'Mobile Phone' : 'Tablet', 'Medium'];
  }
  if (fine && hover && !hasTouch) return ['Desktop/Laptop', 'High'];
  if (fine && hasTouch) return [touchPoints >= 5 ? 'Laptop/2-in-1 with Touchscreen' : 'Desktop/Laptop', 'Medium'];
  if (coarse && anyFine) return ['Tablet (with Stylus/Mouse)', 'Medium'];
  if (!hasTouch && !fine) return ['TV / Console / No Pointer', 'Low'];
  return ['Unknown', 'Low'];
}

async function batteryRows() {
  if (typeof navigator.getBattery !== 'function') {
    return { 'Battery API': { value: 'Not Supported', url: `${MDN}Battery_Status_API` } };
  }
  try {
    const battery = await navigator.getBattery();
    const url = `${MDN}Battery_Status_API`;
    const minutes = (seconds) => (Number.isFinite(seconds) ? `${Math.round(seconds / 60)} min` : 'N/A');
    return {
      'Battery Level': { value: `${Math.round(battery.level * 100)}%`, url },
      'Charging': { value: battery.charging ? 'Yes' : 'No', url },
      'Time to Full': { value: minutes(battery.chargingTime), url },
      'Time to Empty': { value: minutes(battery.dischargingTime), url },
    };
  } catch {
    return { 'Battery API': { value: 'Blocked', url: `${MDN}Battery_Status_API` } };
  }
}

async function storageRows() {
  if (!navigator.storage?.estimate) return {};
  try {
    const { quota, usage } = await navigator.storage.estimate();
    const url = `${MDN}StorageManager/estimate`;
    // Chromium derives the quota from free disk space, so it hints at disk size.
    return {
      'Storage Quota': { value: `${(quota / 1024 ** 3).toFixed(2)} GB`, url },
      'Storage Used by Site': { value: `${(usage / 1024 ** 2).toFixed(2)} MB`, url },
    };
  } catch {
    return { 'Storage Estimate': { value: 'Blocked' } };
  }
}

/** Devices the user previously granted this site; without a grant every API returns none. */
async function pairedDeviceRows() {
  const rows = {};
  const ids = (devices) => devices.map((d) => `${d.vendorId.toString(16)}:${d.productId.toString(16)}`).join(', ');
  const probes = [
    ['USB', navigator.usb, (api) => api.getDevices(), `${MDN}WebUSB_API`],
    ['HID', navigator.hid, (api) => api.getDevices(), `${MDN}WebHID_API`],
    ['Serial', navigator.serial, (api) => api.getPorts(), `${MDN}Web_Serial_API`],
  ];
  await Promise.all(probes.map(async ([name, api, list, url]) => {
    if (!api) return;
    try {
      const devices = await list(api);
      rows[`Paired ${name} Devices`] = {
        value: devices.length > 0 && name !== 'Serial' ? `${devices.length} (${ids(devices)})` : devices.length,
        warning: devices.length > 0,
        url,
      };
    } catch {
      rows[`Paired ${name} Devices`] = { value: 'Blocked by Policy', url };
    }
  }));
  if (navigator.bluetooth?.getAvailability) {
    try {
      rows['Bluetooth Adapter'] = {
        value: (await navigator.bluetooth.getAvailability()) ? 'Present' : 'Absent',
        url: `${MDN}Bluetooth/getAvailability`,
      };
    } catch {}
  }
  const pads = navigator.getGamepads?.().filter(Boolean) ?? [];
  if (pads.length > 0) rows['Connected Gamepads'] = { value: pads.map((p) => p.id).join(', '), warning: true };
  return rows;
}

export async function collectHardwareData() {
  const [deviceClass, confidence] = inferDeviceClass();
  const data = {
    'Device Class': { value: deviceClass },
    'Classification Confidence': { value: confidence },
    'CPU Cores (Logical)': { value: navigator.hardwareConcurrency || 'Hidden', url: `${MDN}Navigator/hardwareConcurrency` },
    'Device Memory': {
      // Browsers round this to a coarse bucket and cap it to limit fingerprinting.
      value: 'deviceMemory' in navigator ? `${navigator.deviceMemory} GB (bucketed)` : 'Hidden',
      url: `${MDN}Navigator/deviceMemory`,
    },
    'Touch Points': { value: navigator.maxTouchPoints, url: `${MDN}Navigator/maxTouchPoints` },
  };

  if (performance.memory) {
    data['JS Heap Limit'] = {
      value: `${Math.round(performance.memory.jsHeapSizeLimit / 1024 ** 2)} MB`,
      url: `${MDN}Performance/memory`,
    };
  }

  const sections = await Promise.all([batteryRows(), storageRows(), pairedDeviceRows()]);
  return Object.assign(data, ...sections);
}
