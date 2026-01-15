/**
 * Network information collection module
 */

import { createTable } from '../utils.js';

/**
 * Runs a ping test to measure latency
 * @returns {Promise<string>} Average latency string
 */
async function runPingTest() {
    try {
        const pings = [];
        for(let i = 0; i < 3; i++) {
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
        'Engine Version': serverData.uaResult.engine.version || 'Unknown'
    };
}

/**
 * Collects comprehensive network and GeoIP data
 * @param {Object} serverData - Server response data
 * @param {string} elementId - Element ID to render to (for real-time updates)
 * @returns {Promise<Object>} Network data object
 */
export async function collectNetworkData(serverData, elementId) {
    let networkData = {
        'Public IP (Server detected)': serverData.ip
    };

    // Latency
    networkData['Latency (Avg of 3 pings)'] = await runPingTest();
    
            // Local IP via WebRTC (Best Effort, Multiple Candidates)
            const rtcCandidates = new Set();
            try {
                const rtcPeer = new RTCPeerConnection({iceServers: []});
                rtcPeer.createDataChannel('');
                rtcPeer.createOffer().then(offer => rtcPeer.setLocalDescription(offer));
                rtcPeer.onicecandidate = (event) => {
                    if (event && event.candidate && event.candidate.candidate) {
                        // Match IPv4, IPv6, and mDNS (.local)
                        const ipMatch = event.candidate.candidate.match(/([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7}|[a-f0-9-]+\.local)/);
                        if (ipMatch) {
                            const detectedIp = ipMatch[1];
                            
                            if (detectedIp.endsWith('.local')) {
                                // mDNS Obfuscation detected
                                rtcCandidates.add(`${detectedIp} (mDNS Obfuscated)`);
                            } else {
                                rtcCandidates.add(detectedIp);
                            }
    
                            networkData['Local IP (WebRTC Leak)'] = Array.from(rtcCandidates).join(', ');
                            const netInfoEl = document.getElementById(elementId);
                            if (netInfoEl) netInfoEl.innerHTML = createTable(networkData);
                        }
                    }
                };
            } catch(e) { /* ignore */ }
    // GeoIP & Security Check
    networkData['VPN/Proxy Detected'] = 'Checking...';
    networkData['Cloud/Datacenter IP'] = 'Checking...';

    try {
        const fields = 'status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,mobile,proxy,hosting,query';
        const geoResponse = await fetch(`/api/geoip?ip=${serverData.ip}&fields=${fields}`);
         
        if (geoResponse.ok) {
            const geoData = await geoResponse.json();
            
            if(geoData.status === 'success') {
                networkData['ISP'] = geoData.isp;
                networkData['Organization'] = geoData.org;
                networkData['AS'] = geoData.as;
                networkData['Country'] = geoData.country;
                networkData['Country Code'] = geoData.countryCode;
                networkData['Region'] = geoData.regionName;
                networkData['City'] = geoData.city;
                networkData['Zip'] = geoData.zip;
                networkData['Timezone'] = geoData.timezone;
                networkData['Coordinates'] = `${geoData.lat}, ${geoData.lon}`;
                networkData['Mobile Connection'] = geoData.mobile ? 'Yes' : 'No';

                // Security Checks
                const vpnKeywords = ['VPN', 'Proxy', 'Unblocker', 'Tor', 'Relay'];
                const cloudKeywords = ['Cloudflare', 'Fastly', 'Akamai', 'Google Cloud', 'AWS', 'Amazon', 'Azure', 'DigitalOcean', 'Hetzner', 'OVH', 'Datacenter', 'Hosting'];
                
                let isVPN = geoData.proxy;
                let isCloud = geoData.hosting;

                // Keyword heuristics if API flags are false
                if (!isVPN) {
                    const combinedStr = (geoData.isp + ' ' + geoData.org + ' ' + geoData.as).toLowerCase();
                    if (vpnKeywords.some(k => combinedStr.includes(k.toLowerCase()))) isVPN = true;
                }
                if (!isCloud) {
                    const combinedStr = (geoData.isp + ' ' + geoData.org + ' ' + geoData.as).toLowerCase();
                    if (cloudKeywords.some(k => combinedStr.includes(k.toLowerCase()))) isCloud = true;
                }

                networkData['VPN/Proxy Detected'] = isVPN ? { value: 'YES', warning: true } : 'No';
                networkData['Cloud/Datacenter IP'] = isCloud ? { value: 'YES', warning: true } : 'No';

                // Timezone Consistency Check
                try {
                    const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
                    
                    // Normalize checking (some providers use slightly different names for same zone)
                    if (browserTz && geoData.timezone) {
                         if (browserTz === geoData.timezone) {
                             networkData['Timezone Check'] = 'Consistent';
                         } else {
                             // It's a mismatch, but is it meaningful?
                             // Just report the values so the user can see.
                             networkData['Timezone Check'] = { 
                                 value: `Mismatch (Browser: ${browserTz} vs IP: ${geoData.timezone})`, 
                                 warning: true 
                             };
                         }
                    }
                } catch(e) { /* ignore */ }
            } else {
                networkData['Geolocation'] = `API Error: ${geoData.message || 'Unknown'}`;
                networkData['VPN/Proxy Detected'] = 'Unknown (API Error)';
                networkData['Cloud/Datacenter IP'] = 'Unknown (API Error)';
            }
        } else {
            networkData['Geolocation'] = 'API Request Failed';
            networkData['VPN/Proxy Detected'] = 'Unknown (API Request Failed)';
            networkData['Cloud/Datacenter IP'] = 'Unknown (API Request Failed)';
        }
    } catch (e) {
        networkData['Geolocation'] = 'Could not fetch geolocation data (Blocked?)';
        networkData['VPN/Proxy Detected'] = 'Unknown (Blocked?)';
        networkData['Cloud/Datacenter IP'] = 'Unknown (Blocked?)';
        console.warn('GeoIP fetch error:', e);
    }
    
    // Proxy Headers from Server
    if (serverData.proxyHeaders && Object.keys(serverData.proxyHeaders).length > 0) {
        networkData['Proxy Headers Found'] = {
            value: Object.keys(serverData.proxyHeaders).join(', '),
            warning: true
        };
    } else {
        networkData['Proxy Headers Found'] = 'None';
    }

    // Time Info
    networkData['Local Timezone Offset'] = new Date().getTimezoneOffset() / -60 + ' hours';
    networkData['Local Time'] = new Date().toString();
    try {
        networkData['Intl Timezone'] = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch(e) { /* ignore */ }

    return networkData;
}

/**
 * Formats request headers as ASCII table
 * @param {Object} headers - Headers object
 * @returns {string} Formatted headers string
 */
export function formatHeaders(headers) {
    let headersOutput = '';
    const headerKeys = Object.keys(headers);
    const maxHKeyLen = Math.max(...headerKeys.map(k => k.length));
    
    for (const [key, value] of Object.entries(headers)) {
        const padding = ' '.repeat(maxHKeyLen - key.length + 4);
        headersOutput += `${key}${padding}${value}\n`;
    }
    
    return '<pre>' + headersOutput + '</pre>';
}
