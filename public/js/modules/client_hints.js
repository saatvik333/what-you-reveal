/**
 * Advanced Client Hints Module
 * Enhanced with all available high entropy values
 */

export async function collectClientHints() {
  if (!navigator.userAgentData) {
    return {
      'Client Hints API': 'Not Supported (Firefox/Safari)',
      'User Agent': navigator.userAgent,
    };
  }

  const data = {};

  // Low entropy values (always available)
  data['Mobile'] = navigator.userAgentData.mobile ? 'Yes' : 'No';
  data['Brands'] = navigator.userAgentData.brands.map((b) => `${b.brand} v${b.version}`).join(', ');

  try {
    // Request all available high entropy values
    const hints = await navigator.userAgentData.getHighEntropyValues([
      'architecture',
      'bitness',
      'brands',
      'formFactors',
      'fullVersionList',
      'model',
      'platform',
      'platformVersion',
      'uaFullVersion',
      'wow64',
    ]);

    // Platform info
    data['Platform'] = hints.platform || 'Unknown';
    data['Platform Version'] = hints.platformVersion || 'Unknown';

    // Architecture info
    data['Architecture'] = hints.architecture || 'Unknown';
    data['Bitness'] = hints.bitness ? hints.bitness + '-bit' : 'Unknown';
    data['WoW64'] = hints.wow64 ? 'Yes (32-bit on 64-bit)' : 'No';

    // Device info
    data['Model'] = hints.model || 'Not Reported (Desktop)';

    // Form Factors (new in Chrome 110+)
    if (hints.formFactors && hints.formFactors.length > 0) {
      data['Form Factors'] = hints.formFactors.join(', ');
    } else {
      data['Form Factors'] = 'Not Available';
    }

    // Full version info
    if (hints.fullVersionList) {
      data['Full Browser Versions'] = hints.fullVersionList
        .map((v) => `${v.brand} v${v.version}`)
        .join(', ');
    }

    // Legacy full version (deprecated but still useful)
    if (hints.uaFullVersion) {
      data['UA Full Version'] = hints.uaFullVersion;
    }

    // Determine likely browser
    const brands = hints.fullVersionList || hints.brands || [];
    const chromeBrand = brands.find((b) => b.brand === 'Chromium' || b.brand === 'Google Chrome');
    const edgeBrand = brands.find((b) => b.brand === 'Microsoft Edge');
    const operaBrand = brands.find((b) => b.brand === 'Opera');

    if (edgeBrand) {
      data['Detected Browser'] = `Microsoft Edge ${edgeBrand.version}`;
    } else if (operaBrand) {
      data['Detected Browser'] = `Opera ${operaBrand.version}`;
    } else if (chromeBrand) {
      data['Detected Browser'] = `Chrome/Chromium ${chromeBrand.version}`;
    }

    // OS Version interpretation
    if (hints.platform === 'Windows' && hints.platformVersion) {
      const majorVersion = parseInt(hints.platformVersion.split('.')[0]);
      if (majorVersion >= 13) {
        data['Windows Version'] = 'Windows 11';
      } else if (majorVersion >= 1) {
        data['Windows Version'] = 'Windows 10';
      }
    } else if (hints.platform === 'macOS' && hints.platformVersion) {
      data['macOS Version'] = hints.platformVersion;
    }
  } catch (e) {
    data['High Entropy'] = { value: 'Denied by User/Policy', warning: true };
  }

  return data;
}
