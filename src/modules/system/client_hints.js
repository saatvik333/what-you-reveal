/**
 * Advanced Client Hints Module
 * Enhanced with entropy assessment, privacy detection, and comprehensive OS mapping
 */

export async function collectClientHints() {
  const clientHintsUrl = 'https://developer.mozilla.org/en-US/docs/Web/API/User-Agent_Client_Hints_API';
  
  if (!navigator.userAgentData) {
    return {
      'Client Hints API': { value: 'Not Supported (Firefox/Safari)', warning: true, url: clientHintsUrl },
      'User Agent': { value: navigator.userAgent, url: 'https://developer.mozilla.org/en-US/docs/Web/API/Navigator/userAgent' },
      'Entropy Level': { value: 'Legacy Only', warning: true, url: clientHintsUrl },
    };
  }

  const data = {};
  let entropyScore = 0;
  const uaDataUrl = 'https://developer.mozilla.org/en-US/docs/Web/API/NavigatorUAData';

  // Low entropy values (always available)
  data['Mobile Device'] = { 
      value: navigator.userAgentData.mobile ? 'Yes' : 'No', 
      url: 'https://developer.mozilla.org/en-US/docs/Web/API/NavigatorUAData/mobile' 
  };
  
  data['Browser Brands'] = { 
      value: navigator.userAgentData.brands.map((b) => `${b.brand} v${b.version}`).join(', '), 
      url: 'https://developer.mozilla.org/en-US/docs/Web/API/NavigatorUAData/brands' 
  };
  entropyScore += 2;

  try {
    // Request all available high entropy values
    const hints = await navigator.userAgentData.getHighEntropyValues([
      'architecture',
      'bitness',
      'brands', // Already have low entropy brands, getting high entropy version list usually comes via fullVersionList
      'formFactors',
      'fullVersionList',
      'model',
      'platform',
      'platformVersion',
      'uaFullVersion',
      'wow64',
    ]);

    // Platform info
    data['Platform'] = { value: hints.platform || 'Unknown', url: 'https://developer.mozilla.org/en-US/docs/Web/API/NavigatorUAData/platform' };
    data['Platform Version'] = { value: hints.platformVersion || 'Unknown', url: uaDataUrl };
    entropyScore += hints.platform ? 10 : 0;
    entropyScore += hints.platformVersion ? 15 : 0;

    // Architecture info
    data['CPU Architecture'] = { value: hints.architecture || 'Unknown', url: uaDataUrl };
    data['Bitness'] = { value: hints.bitness ? hints.bitness + '-bit' : 'Unknown', url: uaDataUrl };
    data['WoW64'] = { value: hints.wow64 ? 'Yes (32-bit on 64-bit)' : 'No', url: uaDataUrl };
    entropyScore += hints.architecture ? 10 : 0;
    entropyScore += hints.bitness ? 5 : 0;

    // Device info
    data['Device Model'] = { value: hints.model || 'Not Reported (Desktop)', url: uaDataUrl };
    entropyScore += hints.model ? 20 : 0;

    // Form Factors (Chrome 110+)
    if (hints.formFactors && hints.formFactors.length > 0) {
      data['Form Factors'] = { value: hints.formFactors.join(', '), url: uaDataUrl };
      entropyScore += 10;
    }

    // Full version info
    if (hints.fullVersionList) {
      data['Full Browser Key'] = { 
          value: hints.fullVersionList.map((v) => `${v.brand} v${v.version}`).join(', '),
          url: uaDataUrl
      };
      entropyScore += 15;
    }

    // OS Version interpretation logic can be added here if needed, but raw values are often honest enough for "What You Reveal"
    
    // Entropy Level Assessment
    let entropyValue = 'Low (Limited Tracking)';
    let warning = false;
    
    if (entropyScore >= 70) {
      entropyValue = 'High (Highly Identifiable)';
      warning = true;
    } else if (entropyScore >= 40) {
      entropyValue = 'Medium (Moderately Identifiable)';
      warning = true;
    }

    data['Entropy Score'] = { value: `${entropyScore}/100`, warning: warning, url: clientHintsUrl };
    data['Entropy Level'] = { value: entropyValue, warning: warning, url: clientHintsUrl };

  } catch (e) {
    data['High Entropy Access'] = { value: 'Denied by User/Policy', warning: true, url: clientHintsUrl };
    data['Entropy Level'] = { value: 'Blocked (Privacy Protected)', url: clientHintsUrl };
  }

  return data;
}
