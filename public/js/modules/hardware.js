/**
 * Hardware information collection module
 */

/**
 * Collects hardware, battery, memory, and storage information
 * @returns {Promise<Object>} Hardware data object
 */
export async function collectHardwareData() {
    const hardwareData = {
        'CPU Cores (Logical)': navigator.hardwareConcurrency || 'Unknown',
        'Device Memory': ('deviceMemory' in navigator) ? (navigator.deviceMemory + ' GB') : null,
        'Touch Points': navigator.maxTouchPoints
    };

    // Battery API
    if (navigator.getBattery) {
        try {
            const battery = await navigator.getBattery();
            hardwareData['Battery Level'] = (battery.level * 100) + '%';
            hardwareData['Charging'] = battery.charging ? 'Yes' : 'No';
            hardwareData['Charging Time'] = battery.chargingTime === Infinity ? 'Unknown' : battery.chargingTime + ' s';
            hardwareData['Discharging Time'] = battery.dischargingTime === Infinity ? 'Unknown' : battery.dischargingTime + ' s';
        } catch (e) {
            hardwareData['Battery Status'] = 'Not accessible';
        }
    }
    
    // Performance Memory (Chrome only)
    if (performance && performance.memory) {
        hardwareData['JS Heap Size Limit'] = (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB';
        hardwareData['Total JS Heap Size'] = (performance.memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB';
        hardwareData['Used JS Heap Size'] = (performance.memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB';
    }
    
    // Storage Estimate
    if (navigator.storage && navigator.storage.estimate) {
        try {
            const estimate = await navigator.storage.estimate();
            hardwareData['Storage Quota'] = (estimate.quota / 1048576).toFixed(2) + ' MB';
            hardwareData['Storage Usage'] = (estimate.usage / 1048576).toFixed(2) + ' MB';
        } catch(e) {}
    }

    return hardwareData;
}
