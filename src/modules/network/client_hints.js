/**
 * Advanced Client Hints Module
 * Enhanced with entropy assessment, privacy detection, and comprehensive OS mapping
 */

export async function collectClientHints() {
  if (!navigator.userAgentData) {
    return {
      'Client Hints API': 'Not Supported (Firefox/Safari)',
      'User Agent': navigator.userAgent,
      'Reduced UA': detectReducedUA(navigator.userAgent),
      'Entropy Level': { value: 'Legacy Only', warning: true },
    };
  }

  const data = {};
  let entropyScore = 0;

  // Low entropy values (always available)
  data['Mobile'] = navigator.userAgentData.mobile ? 'Yes' : 'No';
  data['Brands'] = navigator.userAgentData.brands.map((b) => `${b.brand} v${b.version}`).join(', ');
  entropyScore += 2;

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
    entropyScore += hints.platform ? 10 : 0;
    entropyScore += hints.platformVersion ? 15 : 0;

    // Architecture info
    data['Architecture'] = hints.architecture || 'Unknown';
    data['Bitness'] = hints.bitness ? hints.bitness + '-bit' : 'Unknown';
    data['WoW64'] = hints.wow64 ? 'Yes (32-bit on 64-bit)' : 'No';
    entropyScore += hints.architecture ? 10 : 0;
    entropyScore += hints.bitness ? 5 : 0;

    // Device info
    data['Model'] = hints.model || 'Not Reported (Desktop)';
    entropyScore += hints.model ? 20 : 0;

    // Form Factors (Chrome 110+)
    if (hints.formFactors && hints.formFactors.length > 0) {
      data['Form Factors'] = hints.formFactors.join(', ');
      entropyScore += 10;
    } else {
      data['Form Factors'] = 'Not Available';
    }

    // Full version info
    if (hints.fullVersionList) {
      data['Full Browser Versions'] = hints.fullVersionList
        .map((v) => `${v.brand} v${v.version}`)
        .join(', ');
      entropyScore += 15;
    }

    // Legacy full version
    if (hints.uaFullVersion) {
      data['UA Full Version'] = hints.uaFullVersion;
    }

    // Detect browser from brands
    const brands = hints.fullVersionList || hints.brands || [];
    const chromeBrand = brands.find((b) => b.brand === 'Chromium' || b.brand === 'Google Chrome');
    const edgeBrand = brands.find((b) => b.brand === 'Microsoft Edge');
    const operaBrand = brands.find((b) => b.brand === 'Opera');
    const braveBrand = brands.find((b) => b.brand === 'Brave');
    const vivaldiRand = brands.find((b) => b.brand === 'Vivaldi');

    if (braveBrand) {
      data['Detected Browser'] = `Brave ${braveBrand.version}`;
    } else if (vivaldiRand) {
      data['Detected Browser'] = `Vivaldi ${vivaldiRand.version}`;
    } else if (edgeBrand) {
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
      } else {
        data['Windows Version'] = 'Windows (Legacy)';
      }
    } else if (hints.platform === 'macOS' && hints.platformVersion) {
      const major = parseInt(hints.platformVersion.split('.')[0]);
      const macOSNames = {
        14: 'Sonoma', 13: 'Ventura', 12: 'Monterey', 11: 'Big Sur',
        10: 'Catalina or earlier',
      };
      data['macOS Version'] = `${hints.platformVersion} (${macOSNames[major] || 'Unknown'})`;
    } else if (hints.platform === 'Android' && hints.platformVersion) {
      const androidNames = {
        '14': 'Android 14 (U)', '13': 'Android 13 (T)', '12': 'Android 12 (S)',
        '11': 'Android 11 (R)', '10': 'Android 10 (Q)',
      };
      const major = hints.platformVersion.split('.')[0];
      data['Android Version'] = androidNames[major] || `Android ${major}`;
    } else if (hints.platform === 'Chrome OS' && hints.platformVersion) {
      data['Chrome OS Version'] = hints.platformVersion;
    }

    // Entropy Level Assessment
    data['Entropy Score'] = `${entropyScore}/100`;
    if (entropyScore >= 70) {
      data['Entropy Level'] = { value: 'High (Highly Identifiable)', warning: true };
    } else if (entropyScore >= 40) {
      data['Entropy Level'] = { value: 'Medium (Moderately Identifiable)', warning: true };
    } else {
      data['Entropy Level'] = 'Low (Limited Tracking)';
    }

  } catch (e) {
    data['High Entropy'] = { value: 'Denied by User/Policy', warning: true };
    data['Entropy Level'] = 'Blocked (Privacy Protected)';
    data['Privacy Note'] = 'High entropy values were blocked, improving privacy';
  }

  return data;
}

/**
 * Detects if browser is using Reduced User-Agent string
 */
function detectReducedUA(ua) {
  // Reduced UA has fixed version numbers and limited info
  const reducedPatterns = [
    /Chrome\/\d+\.0\.0\.0/, // Reduced Chrome version
    /Android 10; K/, // Reduced Android model
  ];
  
  const isReduced = reducedPatterns.some(pattern => pattern.test(ua));
  return isReduced ? { value: 'Yes (Privacy Enhanced)', warning: false } : 'No';
}

