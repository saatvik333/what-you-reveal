/**
 * User-Agent Client Hints card. Chromium freezes much of the UA string; the high-entropy
 * hints any script may request return what it hides (exact OS version, CPU, model).
 */

const API_URL = 'https://developer.mozilla.org/en-US/docs/Web/API/User-Agent_Client_Hints_API';
const UA_DATA_URL = 'https://developer.mozilla.org/en-US/docs/Web/API/NavigatorUAData';
const HINTS = ['architecture', 'bitness', 'formFactors', 'fullVersionList', 'model', 'platformVersion', 'wow64'];

/** Microsoft documents the mapping: platformVersion major 13+ = Windows 11, 1–10 = Windows 10. */
function describeOS(platform, version) {
  if (!version) return platform || 'Unknown';
  const major = parseInt(version, 10);
  if (platform === 'Windows') {
    if (major >= 13) return `Windows 11 (${version})`;
    if (major > 0) return `Windows 10 (${version})`;
    return `Windows 7/8/8.1 (${version})`;
  }
  return `${platform} ${version}`;
}

export async function collectClientHints() {
  const uaData = navigator.userAgentData;
  if (!uaData) {
    return {
      'Client Hints API': { value: 'Not Supported (UA string only)', url: API_URL },
    };
  }

  const data = {
    'Brands': {
      value: uaData.brands.map((b) => `${b.brand} ${b.version}`).join(', ') || 'Empty (withheld by browser)',
      url: `${UA_DATA_URL}/brands`,
    },
    'Mobile': { value: uaData.mobile ? 'Yes' : 'No', url: `${UA_DATA_URL}/mobile` },
    'Platform': { value: uaData.platform || 'Empty (withheld by browser)', url: `${UA_DATA_URL}/platform` },
  };

  let hints;
  try {
    hints = await uaData.getHighEntropyValues(HINTS);
  } catch {
    data['High-Entropy Hints'] = { value: 'Blocked', url: `${UA_DATA_URL}/getHighEntropyValues` };
    return data;
  }

  data['OS Version (Real)'] = { value: describeOS(hints.platform ?? uaData.platform, hints.platformVersion), warning: Boolean(hints.platformVersion), url: UA_DATA_URL };
  data['CPU Architecture'] = {
    value: hints.architecture ? `${hints.architecture}${hints.bitness ? ` ${hints.bitness}-bit` : ''}` : 'Not Reported',
    url: UA_DATA_URL,
  };
  if (hints.wow64) data['WoW64'] = { value: 'Yes (32-bit browser on 64-bit Windows)' };
  data['Device Model'] = { value: hints.model || 'Not Reported', warning: Boolean(hints.model), url: UA_DATA_URL };
  if (hints.formFactors?.length) data['Form Factors'] = { value: hints.formFactors.join(', '), url: UA_DATA_URL };
  if (hints.fullVersionList?.length) {
    data['Full Version List'] = {
      value: hints.fullVersionList.map((b) => `${b.brand} ${b.version}`).join(', '),
      warning: true,
      url: UA_DATA_URL,
    };
  }

  const exposed = HINTS.filter((name) => {
    const value = hints[name];
    return Array.isArray(value) ? value.length > 0 : Boolean(value);
  });
  data['High-Entropy Hints Exposed'] = {
    value: `${exposed.length} of ${HINTS.length} (${exposed.join(', ') || 'none'})`,
    warning: exposed.length > 0,
    url: `${UA_DATA_URL}/getHighEntropyValues`,
  };
  return data;
}
