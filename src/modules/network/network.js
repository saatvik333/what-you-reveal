/**
 * Network information collection module
 * Enhanced with connection quality, DNS leak detection, and threat intelligence
 */



/**
 * Runs a ping test to measure latency with jitter calculation
 * @returns {Promise<Object>} Latency metrics
 */
async function runPingTest() {
  try {
    const pings = [];
    for (let i = 0; i < 5; i++) {
      const start = performance.now();
      await fetch('/api/ping', { cache: 'no-store' });
      const end = performance.now();
      pings.push(end - start);
    }
    
    if (pings.length > 0) {
      const avg = pings.reduce((a, b) => a + b) / pings.length;
      const min = Math.min(...pings);
      const max = Math.max(...pings);
      // Jitter = average deviation from mean
      const jitter = pings.reduce((acc, p) => acc + Math.abs(p - avg), 0) / pings.length;
      
      return {
        avg: avg.toFixed(2),
        min: min.toFixed(2),
        max: max.toFixed(2),
        jitter: jitter.toFixed(2),
        samples: pings.length,
      };
    }
  } catch (e) {
    return { avg: 'Failed', error: e.message };
  }
  return { avg: 'Unknown' };
}





/**
 * Fetches server-side detected information
 * @returns {Promise<Object|null>} Server data or null on error
 */
export async function fetchServerInfo() {
  try {
    const response = await fetch('/api/info', { cache: 'no-store' });
    return await response.json();
  } catch (e) {
    console.error('Error fetching /api/info', e);
    return null;
  }
}

/**
 * Parses device info from server response with enhanced detection
 * @param {Object} serverData - Server response data
 * @returns {Object} Parsed device data
 */
export function parseDeviceInfo(serverData) {
  const ua = serverData.uaResult;
  
  const deviceData = {
    'OS Name': ua.os.name || 'Unknown',
    'OS Version': ua.os.version || 'Unknown',
    'Browser Name': ua.browser.name || 'Unknown',
    'Browser Version': ua.browser.version || 'Unknown',
    'Device Vendor': ua.device.vendor || 'Unknown',
    'Device Model': ua.device.model || 'Unknown',
    'Device Type': ua.device.type || 'Desktop/Laptop',
    'CPU Architecture': ua.cpu.architecture || 'Unknown',
    'Engine Name': ua.engine.name || 'Unknown',
    'Engine Version': ua.engine.version || 'Unknown',
  };
  
  // Enhanced Browser Detection
  const browserName = ua.browser.name?.toLowerCase() || '';
  if (browserName.includes('chrome') && !browserName.includes('edge')) {
    deviceData['Browser Family'] = 'Chromium';
  } else if (browserName.includes('firefox')) {
    deviceData['Browser Family'] = 'Gecko';
  } else if (browserName.includes('safari')) {
    deviceData['Browser Family'] = 'WebKit';
  } else if (browserName.includes('edge')) {
    deviceData['Browser Family'] = 'Chromium (Edge)';
  }

  return deviceData;
}

/**
 * Collects local network data (Ping, WebRTC) with enhanced metrics
 * @param {Function} onUpdate - Callback when data changes
 * @returns {Promise<Object>} Final local network data
 */
export async function collectLocalNetworkData(onUpdate) {
  const localData = {};
  
  const notify = () => {
    if (typeof onUpdate === 'function') {onUpdate({ ...localData });}
  };

  // 1. Enhanced Latency Test
  const pingResult = await runPingTest();
  if (pingResult.avg !== 'Failed' && pingResult.avg !== 'Unknown') {
    localData['Latency (Avg)'] = pingResult.avg + ' ms';
    localData['Latency (Min/Max)'] = `${pingResult.min} / ${pingResult.max} ms`;
    localData['Jitter'] = pingResult.jitter + ' ms';
  } else {
    localData['Latency'] = pingResult.error || 'Failed';
  }
  notify();
  
  // 2. Time Info
  const now = new Date();
  localData['Local Timezone Offset'] = now.getTimezoneOffset() / -60 + ' hours';
  localData['Local Time'] = now.toLocaleString();
  localData['UTC Time'] = now.toUTCString();
  try {
    localData['Intl Timezone'] = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (e) { /* ignore */ }
  notify();

  // 3. Network Information API (if available)
  if (navigator.connection) {
    const conn = navigator.connection;
    localData['Effective Type'] = conn.effectiveType?.toUpperCase() || 'Unknown';
    localData['Downlink'] = (conn.downlink || 0) + ' Mbps';
    localData['RTT (Network API)'] = (conn.rtt || 0) + ' ms';
    localData['Save Data'] = conn.saveData ? 'Enabled' : 'Disabled';
  }
  notify();

  // 4. WebRTC Local IP Detection
  try {
    const rtcCandidates = new Set();
    const rtcPeer = new RTCPeerConnection({ iceServers: [] });
    rtcPeer.createDataChannel('');
    rtcPeer.createOffer().then((offer) => rtcPeer.setLocalDescription(offer));
    
    const rtcPromise = new Promise(resolve => {
      rtcPeer.onicecandidate = (event) => {
        if (event?.candidate?.candidate) {
          const ipMatch = event.candidate.candidate.match(
            /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7}|[a-f0-9-]+\.local)/,
          );
          if (ipMatch) {
            const detectedIp = ipMatch[1];
            const isMdns = detectedIp.endsWith('.local');
            rtcCandidates.add(isMdns ? `${detectedIp} (mDNS)` : detectedIp);
            
            // Classify IP type
            if (!isMdns) {
              const parts = detectedIp.split('.');
              if (parts[0] === '192' && parts[1] === '168') {
                localData['Local Network Type'] = 'Private (192.168.x.x)';
              } else if (parts[0] === '10') {
                localData['Local Network Type'] = 'Private (10.x.x.x)';
              } else if (parts[0] === '172' && parseInt(parts[1]) >= 16 && parseInt(parts[1]) <= 31) {
                localData['Local Network Type'] = 'Private (172.16-31.x.x)';
              }
            }
            
            localData['Local IP (WebRTC)'] = { 
              value: Array.from(rtcCandidates).join(', '),
              warning: !isMdns, // Real IPs are a privacy concern
            };
            notify();
          }
        }
      };
      setTimeout(() => {
        rtcPeer.close();
        resolve();
      }, 1500);
    });
    
    await rtcPromise;
    
    // If no candidates found, WebRTC is likely blocked
    if (rtcCandidates.size === 0) {
      localData['Local IP (WebRTC)'] = 'Blocked / Not Available';
      localData['WebRTC Privacy'] = 'Protected';
    }
    
  } catch (e) {
    localData['Local IP (WebRTC)'] = 'Error: ' + e.message;
  }
  
  return localData;
}

/**
 * Collects Server-side GeoIP data with enhanced threat detection
 * @param {Object} serverData - Pre-fetched server data
 * @returns {Promise<Object>} GeoIP data
 */
export async function collectGeoIPData(serverData) {
  const geoDataOut = {
    'Public IP': serverData.ip,
  };

  // Detect IP version
  if (serverData.ip.includes(':')) {
    geoDataOut['IP Version'] = 'IPv6';
  } else {
    geoDataOut['IP Version'] = 'IPv4';
  }

  // GeoIP & Security Check
  try {
    const fields =
      'status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,mobile,proxy,hosting,query,currency';
    const geoResponse = await fetch(`/api/geoip?ip=${serverData.ip}&fields=${fields}`);

    if (geoResponse.ok) {
      const geoData = await geoResponse.json();

      if (geoData.status === 'success') {
        // Core Info
        geoDataOut['ISP'] = geoData.isp;
        geoDataOut['Organization'] = geoData.org;
        geoDataOut['AS Number'] = geoData.as;
        
        // Location
        geoDataOut['Country'] = geoData.country;
        geoDataOut['Country Code'] = geoData.countryCode;
        geoDataOut['Region'] = geoData.regionName;
        geoDataOut['City'] = geoData.city;
        geoDataOut['Postal Code'] = geoData.zip || 'N/A';
        geoDataOut['Timezone (IP)'] = geoData.timezone;
        geoDataOut['Coordinates'] = `${geoData.lat}, ${geoData.lon}`;
        
        // Connection Type
        geoDataOut['Mobile Connection'] = geoData.mobile ? 'Yes' : 'No';

        // Enhanced Security Checks with threat scoring
        let threatScore = 0;
        const threats = [];

        // VPN/Proxy Detection
        const vpnKeywords = ['VPN', 'Proxy', 'Unblocker', 'Tor', 'Relay', 'Private', 'Anonymous', 'Hide'];
        const cloudKeywords = ['Cloudflare', 'Fastly', 'Akamai', 'AWS', 'Azure', 'Google Cloud', 
                               'DigitalOcean', 'Linode', 'Vultr', 'OVH', 'Hetzner', 'Datacenter', 'Hosting'];
        const torKeywords = ['Tor', 'Exit', 'Onion'];

        const combinedStr = ((geoData.isp || '') + ' ' + (geoData.org || '') + ' ' + (geoData.as || '')).toLowerCase();

        // Check for VPN/Proxy
        let isVPN = geoData.proxy;
        if (!isVPN && vpnKeywords.some(k => combinedStr.includes(k.toLowerCase()))) {
          isVPN = true;
        }
        if (isVPN) {
          threatScore += 30;
          threats.push('VPN/Proxy');
        }
        geoDataOut['VPN/Proxy Detected'] = isVPN ? { value: 'YES', warning: true } : 'No';

        // Check for Datacenter/Hosting
        let isCloud = geoData.hosting;
        if (!isCloud && cloudKeywords.some(k => combinedStr.includes(k.toLowerCase()))) {
          isCloud = true;
        }
        if (isCloud) {
          threatScore += 20;
          threats.push('Datacenter IP');
        }
        geoDataOut['Datacenter IP'] = isCloud ? { value: 'YES', warning: true } : 'No';

        // Check for Tor
        const isTor = torKeywords.some(k => combinedStr.includes(k.toLowerCase()));
        if (isTor) {
          threatScore += 50;
          threats.push('Tor Network');
          geoDataOut['Tor Network'] = { value: 'DETECTED', warning: true };
        }

        // Timezone Consistency Check
        try {
          const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
          if (browserTz && geoData.timezone) {
            const tzMatch = browserTz === geoData.timezone;
            if (tzMatch) {
              geoDataOut['Timezone Consistency'] = '✓ Consistent';
            } else {
              geoDataOut['Timezone Consistency'] = {
                value: `✗ Mismatch (Browser: ${browserTz})`,
                warning: true,
              };
              threatScore += 15;
              threats.push('Timezone Mismatch');
            }
          }
        } catch (e) { /* ignore */ }

        // Threat Summary
        if (threatScore > 0) {
          geoDataOut['Threat Score'] = { value: `${threatScore}/100`, warning: threatScore >= 30 };
          geoDataOut['Threats Detected'] = { value: threats.join(', '), warning: true };
        } else {
          geoDataOut['Threat Score'] = '0/100 (Clean)';
        }

      } else {
        if (geoData.message === 'reserved range') {
          geoDataOut['Geolocation'] = 'Localhost / Private Network';
          geoDataOut['ISP'] = 'Local Network';
          geoDataOut['Location'] = 'Local Machine';
          geoDataOut['VPN/Proxy Detected'] = 'N/A (Local)';
          geoDataOut['Datacenter IP'] = 'N/A (Local)';
          geoDataOut['Privacy Note'] = 'Running on local/private network';
        } else {
          geoDataOut['Geolocation'] = `API Error: ${geoData.message || 'Unknown'}`;
        }
      }
    }
  } catch (e) {
    geoDataOut['Geolocation'] = 'Blocked/Failed';
    console.warn('GeoIP error:', e);
  }
  
  // Proxy Headers Detection
  if (serverData.proxyHeaders && Object.keys(serverData.proxyHeaders).length > 0) {
    const headerList = Object.keys(serverData.proxyHeaders);
    geoDataOut['Proxy Headers Detected'] = {
      value: headerList.length + ' headers exposed',
      warning: true,
    };
    geoDataOut['Exposed Headers'] = headerList.join(', ');
  }

  return geoDataOut;
}



/**
 * Formats request headers as styled HTML
 * @param {Object} headers - Headers object
 * @returns {string} Formatted headers HTML
 */
export function formatHeaders(headers) {
  let headersOutput = '';
  const headerKeys = Object.keys(headers);
  const maxHKeyLen = Math.max(...headerKeys.map((k) => k.length));

  for (const [key, value] of Object.entries(headers)) {
    const padding = ' '.repeat(maxHKeyLen - key.length + 4);
    
    // Highlight sensitive headers
    const sensitiveHeaders = ['authorization', 'cookie', 'x-forwarded-for', 'x-real-ip', 'cf-connecting-ip'];
    const isSensitive = sensitiveHeaders.some(h => key.toLowerCase().includes(h));
    
    if (isSensitive) {
      headersOutput += `<span style="color:var(--primary)">${key}</span>${padding}${value}\n`;
    } else {
      headersOutput += `${key}${padding}${value}\n`;
    }
  }

  return '<pre style="overflow-x:auto">' + headersOutput + '</pre>';
}

