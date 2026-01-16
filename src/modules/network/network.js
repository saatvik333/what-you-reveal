/**
 * Unified Network Module
 * Combines Connection, Latency, GeoIP, and Threat Detection
 */

export async function collectNetworkData(onUpdate) {
  const data = {};
  
  // Helper to notify updates
  const notify = () => {
    if (onUpdate && typeof onUpdate === 'function') {
      onUpdate({ ...data });
    }
  };

  // --- 1. Connection Info (Network API) ---
  if (navigator.connection) {
    const conn = navigator.connection;
    data['RTT (Est.)'] = { 
        value: (conn.rtt || 0) + ' ms', 
        url: 'https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation/rtt' 
    };
    data['Effective Type'] = {
        value: conn.effectiveType ? conn.effectiveType.toUpperCase() : 'Unknown',
        url: 'https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation/effectiveType'
    };
    data['Downlink'] = {
        value: (conn.downlink || 0) + ' Mbps',
        url: 'https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation/downlink'
    };
  } else {
    data['Network Info API'] = { value: 'Not Supported', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Network_Information_API' };
  }
  notify();

  // --- 2. Time Info ---
  const now = new Date();
  data['Local Time'] = { value: now.toLocaleString(), url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleString' };
  data['UTC Time'] = { value: now.toUTCString(), url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toUTCString' };
  data['Timezone Offset'] = { value: (now.getTimezoneOffset() / -60) + ' hrs', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getTimezoneOffset' };
  notify();

  // --- 3. WebRTC Local IP Detection ---
  detectLocalIP(data, notify);

  // --- 4. Latency & Jitter ---
  measureLatency(data, notify);

  // --- 5. GeoIP & Threat Intelligence ---
  fetchGeoIPAndThreats(data, notify);

  return data; // Return initial state (updates happen via callback)
}

async function detectLocalIP(data, notify) {
  try {
    const rtcCandidates = new Set();
    const rtcPeer = new RTCPeerConnection({ iceServers: [] });
    rtcPeer.createDataChannel('');
    const offer = await rtcPeer.createOffer();
    await rtcPeer.setLocalDescription(offer);
    
    data['Local IP Detection'] = { value: 'Scanning via WebRTC...', url: 'https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API' };
    notify();

    await new Promise(resolve => {
      rtcPeer.onicecandidate = (event) => {
        if (event?.candidate?.candidate) {
          const candidate = event.candidate.candidate;
          // Extract IPv4/IPv6 or .local
          const ipMatch = candidate.match(/([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/);
          if (ipMatch) {
             // Simple validity check
             if (candidate.indexOf('.local') > 0 || candidate.match(/^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$/) || candidate.indexOf(':') > -1) {
                rtcCandidates.add(ipMatch[1]);
             }
          }
        }
      };
      setTimeout(() => { rtcPeer.close(); resolve(); }, 1500);
    });

    delete data['Local IP Detection'];

    if (rtcCandidates.size > 0) {
      const detectedIps = Array.from(rtcCandidates).join(', ');
      // Private IP ranges check
      const isPrivate = detectedIps.startsWith('192.168.') || detectedIps.startsWith('10.') || detectedIps.startsWith('172.');
      
      data['Local IP (WebRTC)'] = { 
          value: detectedIps, 
          warning: !isPrivate && !detectedIps.includes('.local'), // Public IP leak via WebRTC is bad
          url: 'https://developer.mozilla.org/en-US/docs/Web/API/RTCIceCandidate' 
      };
    } else {
      data['Local IP (WebRTC)'] = { value: 'Not Detected / Blocked', url: 'https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API' };
    }
    notify();
  } catch (e) {
    data['Local IP (WebRTC)'] = { value: 'Error: ' + e.message, warning: true };
    notify();
  }
}

async function measureLatency(data, notify) {
  try {
    const pings = [];
    const samples = 5;
    const target = '/favicon.ico?t=' + Date.now(); 

    for (let i = 0; i < samples; i++) {
        const start = performance.now();
        await fetch(target, { cache: 'no-store' });
        const end = performance.now();
        pings.push(end - start);
    }
    
    if (pings.length > 0) {
        const avg = pings.reduce((a, b) => a + b) / pings.length;
        const min = Math.min(...pings);
        const max = Math.max(...pings);
        const jitter = pings.reduce((acc, p) => acc + Math.abs(p - avg), 0) / pings.length;

        data['Latency (Avg)'] = { value: avg.toFixed(2) + ' ms', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Performance' };
        data['Latency (Min/Max)'] = { value: `${min.toFixed(2)} / ${max.toFixed(2)} ms`, url: 'https://developer.mozilla.org/en-US/docs/Web/API/Performance' };
        data['Jitter'] = { value: jitter.toFixed(2) + ' ms', url: 'https://developer.mozilla.org/en-US/docs/Glossary/Jitter' };
    }
    notify();
  } catch (e) {
    data['Latency'] = { value: 'Failed', warning: true };
    notify();
  }
}

async function fetchGeoIPAndThreats(data, notify) {
    try {
        data['GeoIP Analysis'] = { value: 'Fetching...', url: 'https://ip-api.com' };
        notify();

        // Using ip-api.com as requested (Note: Free API is HTTP only, might trigger mixed content on HTTPS)
        const fields = 'status,message,country,countryCode,regionName,city,district,zip,lat,lon,timezone,isp,org,as,mobile,query';
        const response = await fetch(`http://ip-api.com/json/?fields=${fields}`);
        if (!response.ok) throw new Error('API Error');
        
        const geo = await response.json();
        
        if (geo.status !== 'success') {
            throw new Error(geo.message || 'GeoIP Lookup Failed');
        }

        delete data['GeoIP Analysis'];

        // Basic Info
        data['Public IP'] = { value: geo.query, url: 'https://ip-api.com' };
        data['ISP'] = { value: geo.isp || geo.org || 'Unknown', url: 'https://ip-api.com' };
        data['AS Number'] = { value: geo.as || 'Unknown', url: 'https://ip-api.com' };
        data['Location'] = { value: `${geo.district ? geo.district + ', ' : ''}${geo.city}, ${geo.regionName}, ${geo.country}`, url: 'https://www.openstreetmap.org/search?query=' + geo.city };
        data['Coordinates'] = { value: `${geo.lat}, ${geo.lon}`, url: `https://www.openstreetmap.org/#map=13/${geo.lat}/${geo.lon}` };
        data['Postal Code'] = { value: geo.zip || 'Unknown', url: 'https://ip-api.com' };
        data['Cellular Connection'] = { value: geo.mobile ? 'Yes' : 'No', url: 'https://ip-api.com' };
        
        // Threat Intelligence Logic
        let threatScore = 0;
        const threats = [];
        
        // 1. VPN/Proxy Keywords
        const vpnKeywords = ['VPN', 'Proxy', 'Unblocker', 'Relay', 'Private', 'Haus', 'Hosting', 'Cloud', 'Datacenter', 'DigitalOcean', 'Linode', 'AWS', 'Google', 'Azure'];
        const ispStr = ((geo.org || '') + ' ' + (geo.isp || '') + ' ' + (geo.as || '')).toUpperCase();
        
        const isSuspiciousISP = vpnKeywords.some(k => ispStr.includes(k.toUpperCase()));
        if (isSuspiciousISP) {
            threatScore += 40;
            threats.push('Datacenter/VPN ISP Detected');
        }

        // 2. Timezone Consistency
        try {
            const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const geoTz = geo.timezone;
            
            if (browserTz && geoTz) {
                if (browserTz !== geoTz) {
                    threatScore += 30;
                    threats.push(`Timezone Mismatch (${browserTz} vs ${geoTz})`);
                    data['Timezone Check'] = { value: 'MISMATCH', warning: true, url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/resolvedOptions' };
                } else {
                    data['Timezone Check'] = { value: 'Consistent', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/resolvedOptions' };
                }
            }
        } catch (e) { /* ignore */ }

        // Result
        if (threatScore > 0) {
            data['Threat Score'] = { value: `${threatScore}/100`, warning: threatScore >= 40, url: 'https://ip-api.com' };
            data['Threats'] = { value: threats.join(', '), warning: true, url: 'https://ip-api.com' };
            data['Privacy Status'] = { value: 'Suspicious / VPN', warning: true };
        } else {
            data['Threat Score'] = { value: '0/100 (Clean)', url: 'https://ip-api.com' };
            data['Privacy Status'] = { value: 'Residential / Standard', url: 'https://ip-api.com' };
        }
        
        notify();

    } catch (e) {
        data['GeoIP Analysis'] = { value: 'Failed / Blocked (' + e.message + ')', warning: true };
        notify();
    }
}

