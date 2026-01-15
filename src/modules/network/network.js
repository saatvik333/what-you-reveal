/**
 * Network information collection module
 */

import { createTable } from '../../core/utils.js';

/**
 * Runs a ping test to measure latency
 * @returns {Promise<string>} Average latency string
 */
async function runPingTest() {
  try {
    const pings = [];
    for (let i = 0; i < 3; i++) {
      const start = performance.now();
      await fetch('/api/ping');
      const end = performance.now();
      pings.push(end - start);
    }
    if (pings.length > 0) {
      const avg = pings.reduce((a, b) => a + b) / pings.length;
      return avg.toFixed(2) + ' ms';
    }
  } catch (e) {
    return 'Failed';
  }
  return 'Unknown';
}

/**
 * Fetches server-side detected information
 * @returns {Promise<Object|null>} Server data or null on error
 */
export async function fetchServerInfo() {
  try {
    const response = await fetch('/api/info');
    return await response.json();
  } catch (e) {
    console.error('Error fetching /api/info', e);
    return null;
  }
}

/**
 * Parses device info from server response
 * @param {Object} serverData - Server response data
 * @returns {Object} Parsed device data
 */
export function parseDeviceInfo(serverData) {
  return {
    'OS Name': serverData.uaResult.os.name || 'Unknown',
    'OS Version': serverData.uaResult.os.version || 'Unknown',
    'Browser Name': serverData.uaResult.browser.name || 'Unknown',
    'Browser Version': serverData.uaResult.browser.version || 'Unknown',
    'Device Vendor': serverData.uaResult.device.vendor || 'Unknown',
    'Device Model': serverData.uaResult.device.model || 'Unknown',
    'Device Type': serverData.uaResult.device.type || 'Desktop/Laptop',
    'CPU Architecture': serverData.uaResult.cpu.architecture || 'Unknown',
    'Engine Name': serverData.uaResult.engine.name || 'Unknown',
    'Engine Version': serverData.uaResult.engine.version || 'Unknown',
  };
}

/**
 * Collects local network data (Ping, WebRTC) immediately
 * @param {Function} onUpdate - Callback when data changes (data) => void
 * @returns {Promise<Object>} Final local network data
 */
export async function collectLocalNetworkData(onUpdate) {
  const localData = {};
  
  const notify = () => {
    if (typeof onUpdate === 'function') onUpdate({ ...localData });
  };

  // 1. Latency (Fastest)
  localData['Latency'] = 'Pinging...';
  notify();
  
  localData['Latency'] = await runPingTest();
  notify();
  
  // 2. Time Info (Instant)
  localData['Local Timezone Offset'] = new Date().getTimezoneOffset() / -60 + ' hours';
  localData['Local Time'] = new Date().toString();
  try {
    localData['Intl Timezone'] = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (e) { /* ignore */ }
  notify();

  // 3. WebRTC Leak (Slower)
  try {
    const rtcCandidates = new Set();
    const rtcPeer = new RTCPeerConnection({ iceServers: [] });
    rtcPeer.createDataChannel('');
    rtcPeer.createOffer().then((offer) => rtcPeer.setLocalDescription(offer));
    
    // Set a timeout for WebRTC as it can hang
    const rtcTimeout = new Promise(resolve => setTimeout(resolve, 1500));
    
    const rtcPromise = new Promise(resolve => {
        rtcPeer.onicecandidate = (event) => {
        if (event && event.candidate && event.candidate.candidate) {
            const ipMatch = event.candidate.candidate.match(
            /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7}|[a-f0-9-]+\.local)/
            );
            if (ipMatch) {
                const detectedIp = ipMatch[1];
                rtcCandidates.add(detectedIp.endsWith('.local') ? `${detectedIp} (mDNS)` : detectedIp);
                localData['Local IP'] = Array.from(rtcCandidates).join(', ');
                notify();
            }
        }
        };
        // Resolve after some time regardless of finding candidates
        setTimeout(resolve, 1000);
    });
    
    await Promise.race([rtcPromise, rtcTimeout]);
    
  } catch (e) { /* ignore */ }
  
  return localData;
}

/**
 * Collects Server-side GeoIP data
 * @param {Object} serverData - Pre-fetched server data
 * @returns {Promise<Object>} GeoIP data
 */
export async function collectGeoIPData(serverData) {
   const geoDataOut = {
        'Public IP': serverData.ip
   };

   // GeoIP & Security Check
  try {
    const fields =
      'status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,mobile,proxy,hosting,query';
    const geoResponse = await fetch(`/api/geoip?ip=${serverData.ip}&fields=${fields}`);

    if (geoResponse.ok) {
      const geoData = await geoResponse.json();

      if (geoData.status === 'success') {
        geoDataOut['ISP'] = geoData.isp;
        geoDataOut['Organization'] = geoData.org;
        geoDataOut['AS'] = geoData.as;
        
        geoDataOut['Country'] = geoData.country;
        geoDataOut['Country Code'] = geoData.countryCode;
        geoDataOut['Region'] = geoData.regionName;
        geoDataOut['City'] = geoData.city;
        geoDataOut['Zip'] = geoData.zip;
        geoDataOut['Timezone'] = geoData.timezone;
        geoDataOut['Coordinates'] = `${geoData.lat}, ${geoData.lon}`;
        geoDataOut['Mobile Connection'] = geoData.mobile ? 'Yes' : 'No';

        // Security Checks
        const vpnKeywords = ['VPN', 'Proxy', 'Unblocker', 'Tor', 'Relay'];
        const cloudKeywords = ['Cloudflare', 'Fastly', 'Akamai', 'AWS', 'Azure', 'DigitalOcean', 'Datacenter', 'Hosting'];

        let isVPN = geoData.proxy;
        let isCloud = geoData.hosting;

        if (!isVPN) {
          const combinedStr = (geoData.isp + ' ' + geoData.org + ' ' + geoData.as).toLowerCase();
          if (vpnKeywords.some((k) => combinedStr.includes(k.toLowerCase()))) isVPN = true;
        }
        if (!isCloud) {
            const combinedStr = (geoData.isp + ' ' + geoData.org + ' ' + geoData.as).toLowerCase();
            if (cloudKeywords.some((k) => combinedStr.includes(k.toLowerCase()))) isCloud = true;
        }

        geoDataOut['VPN/Proxy'] = isVPN ? { value: 'YES', warning: true } : 'No';
        geoDataOut['Datacenter'] = isCloud ? { value: 'YES', warning: true } : 'No';

        // Timezone Consistency Check
        try {
          const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
          if (browserTz && geoData.timezone) {
            if (browserTz === geoData.timezone) {
              geoDataOut['Timezone Check'] = 'Consistent';
            } else {
              geoDataOut['Timezone Check'] = {
                value: `Mismatch (Browser: ${browserTz} vs IP: ${geoData.timezone})`,
                warning: true,
              };
            }
          }
        } catch (e) { /* ignore */ }

      } else {
        if (geoData.message === 'reserved range') {
          geoDataOut['Geolocation'] = 'Localhost / Private Network';
          geoDataOut['ISP'] = 'Local Network';
          geoDataOut['Location'] = 'Local Machine';
          geoDataOut['VPN/Proxy'] = 'No (Local)';
          geoDataOut['Datacenter'] = 'No (Local)';
        } else {
          geoDataOut['Geolocation'] = `API Error: ${geoData.message || 'Unknown'}`;
        }
      }
    }
  } catch (e) {
    geoDataOut['Geolocation'] = 'Blocked/Failed';
    console.warn('GeoIP error:', e);
  }
  
  // Proxy Headers
  if (serverData.proxyHeaders && Object.keys(serverData.proxyHeaders).length > 0) {
    geoDataOut['Proxy Headers'] = {
      value: Object.keys(serverData.proxyHeaders).join(', '),
      warning: true,
    };
  }

  return geoDataOut;
}

/**
 * Legacy compatibility wrapper (if needed) or removed if fully refactored.
 * Keeping a merged version for valid return types in case of full chain.
 */
export async function collectNetworkData(serverData, elementId) {
    // This is now split. The App should call collectLocalNetworkData AND collectGeoIPData.
    // We can leave this as a helper that does both sequentially if needed, but we want parallel.
    // For now, let's return an empty object or deprecated warning if named same, 
    // BUT since we are refactoring app.js too, we will change export names.
}

/**
 * Formats request headers as ASCII table
 * @param {Object} headers - Headers object
 * @returns {string} Formatted headers string
 */
export function formatHeaders(headers) {
  let headersOutput = '';
  const headerKeys = Object.keys(headers);
  const maxHKeyLen = Math.max(...headerKeys.map((k) => k.length));

  for (const [key, value] of Object.entries(headers)) {
    const padding = ' '.repeat(maxHKeyLen - key.length + 4);
    headersOutput += `${key}${padding}${value}\n`;
  }

  return '<pre>' + headersOutput + '</pre>';
}
