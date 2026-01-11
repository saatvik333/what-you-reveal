document.addEventListener('DOMContentLoaded', async () => {
    // Helper to create table rows
    // Helper to create ASCII-style output
    // Helper to create ASCII-style output with filtering
    function createTable(data) {
        let output = '';
        // Filter keys first
        const entries = Object.entries(data).filter(([k, v]) => {
            if (!v) return false;
            const strVal = (typeof v === 'object' && v.value) ? v.value : String(v);
            const lower = strVal.toLowerCase();
            return !lower.includes('unknown') && 
                   !lower.includes('unsupported') && 
                   !lower.includes('not accessible') &&
                   !lower.includes('undefined') &&
                   strVal !== '';
        });
        
        if (entries.length === 0) return '<span class="loading">No accessible data.</span>';

        const maxKeyLen = Math.max(...entries.map(([k]) => k.length));
        
        for (const [key, value] of entries) {
            // Handle nested objects or arrays by converting to string
            let displayValue = value;
            let warning = false;

            // Check if value is an object containing 'value' and 'warning' properties (for our alerts)
            if (typeof value === 'object' && value !== null && 'value' in value && 'warning' in value) {
                displayValue = value.value;
                if (value.warning) {
                    warning = true;
                }
            } else if (typeof value === 'object' && value !== null) {
                displayValue = JSON.stringify(value, null, 2); 
            }

            // ASCII Formatting: KEY ............ VALUE
            const padding = '.'.repeat(maxKeyLen - key.length + 4);
            const line = `${key} ${padding} ${displayValue}\n`;
            
            if (warning) {
                output += `<span class="warning">${line}</span>`;
            } else {
                output += line;
            }
        }
        return '<pre>' + output + '</pre>';
    }

    // --- 1. Comprehensive Browser/Navigator Data ---
    const nav = navigator;
    const browserData = {};

    // Iterate over all properties in navigator (safe iteration)
    for (const key in nav) {
        try {
            const val = nav[key];
            if (typeof val !== 'function' && typeof val !== 'object') {
                browserData[key] = val;
            }
        } catch (e) {}
    }
    
    // Explicitly add complex objects
    browserData['userAgent'] = nav.userAgent;
    browserData['appVersion'] = nav.appVersion;
    browserData['platform'] = nav.platform;
    browserData['language'] = nav.language;
    browserData['languages'] = nav.languages ? nav.languages.join(', ') : '';
    browserData['cookieEnabled'] = nav.cookieEnabled;
    browserData['onLine'] = nav.onLine;
    browserData['doNotTrack'] = nav.doNotTrack;
    browserData['hardwareConcurrency'] = nav.hardwareConcurrency;
    browserData['deviceMemory'] = ('deviceMemory' in nav) ? (nav.deviceMemory + ' GB') : null;
    browserData['maxTouchPoints'] = nav.maxTouchPoints;
    browserData['pdfViewerEnabled'] = nav.pdfViewerEnabled;
    
    // Plugins (Legacy but still useful)
    if (nav.plugins) {
        const pluginsList = [];
        for (let i = 0; i < nav.plugins.length; i++) {
            pluginsList.push(nav.plugins[i].name + ' (' + nav.plugins[i].filename + ')');
        }
        browserData['Plugins'] = pluginsList.length > 0 ? pluginsList.join('<br>') : 'None/Hidden';
    }

    // MimeTypes
    if (nav.mimeTypes) {
        const mimeList = [];
        for (let i = 0; i < nav.mimeTypes.length; i++) {
            mimeList.push(nav.mimeTypes[i].type);
        }
        browserData['MimeTypes'] = mimeList.length > 0 ? mimeList.join(', ') : 'None/Hidden';
    }

    // Connection
    if (nav.connection) {
        browserData['Connection Type'] = nav.connection.effectiveType;
        browserData['Downlink'] = nav.connection.downlink + ' Mbps';
        browserData['RTT'] = nav.connection.rtt + ' ms';
        browserData['Save Data'] = nav.connection.saveData;
    } else {
       // browserData['Connection Info'] = 'Unknown (API Unsupported in this browser)';
    }

    const browserInfoEl = document.getElementById('browser-info');
    if (browserInfoEl) browserInfoEl.innerHTML = createTable(browserData);

    // --- 2. Enhanced Screen Info ---
    const dpr = window.devicePixelRatio || 1;
    const screenData = {
        'Screen Width (CSS)': screen.width + 'px',
        'Screen Height (CSS)': screen.height + 'px',
        'Physical Width (Est.)': (screen.width * dpr) + 'px',
        'Physical Height (Est.)': (screen.height * dpr) + 'px',
        'Available Width': screen.availWidth + 'px',
        'Available Height': screen.availHeight + 'px',
        'Color Depth': screen.colorDepth + ' bits',
        'Pixel Depth': screen.pixelDepth + ' bits',
        'Window Inner Width': window.innerWidth + 'px',
        'Window Inner Height': window.innerHeight + 'px',
        'Window Outer Width': window.outerWidth + 'px',
        'Window Outer Height': window.outerHeight + 'px',
        'Device Pixel Ratio': dpr,
        'Screen Orientation': (screen.orientation ? screen.orientation.type : 'Unknown') + ' (' + (screen.orientation ? screen.orientation.angle : 0) + 'deg)',
        'Touch Support': ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) ? 'Yes' : 'No'
    };
    
    // Media Query Checks
    const mediaQueries = {
        'Dark Mode': window.matchMedia('(prefers-color-scheme: dark)').matches,
        'Light Mode': window.matchMedia('(prefers-color-scheme: light)').matches,
        'Reduced Motion': window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        'High Contrast': window.matchMedia('(prefers-contrast: more)').matches,
        'Portrait': window.matchMedia('(orientation: portrait)').matches,
        'Landscape': window.matchMedia('(orientation: landscape)').matches
    };
    
    // Merge Media Queries into Screen Data
    Object.assign(screenData, mediaQueries);

    const screenInfoEl = document.getElementById('screen-info');
    if (screenInfoEl) screenInfoEl.innerHTML = createTable(screenData);

    // --- 3. Hardware & Battery ---
    const hardwareData = {
        'CPU Cores (Logical)': navigator.hardwareConcurrency || 'Unknown',
        'Device Memory': ('deviceMemory' in navigator) ? (navigator.deviceMemory + ' GB') : null,
        'Touch Points': navigator.maxTouchPoints
    };

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
    } else {
        // hardwareData['Battery Status'] = 'Unknown (API Unsupported)';
    }
    
    // Performance Memory (Chrome only)
    if (performance && performance.memory) {
        hardwareData['JS Heap Size Limit'] = (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB';
        hardwareData['Total JS Heap Size'] = (performance.memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB';
        hardwareData['Used JS Heap Size'] = (performance.memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB';
    } else {
        // hardwareData['Memory Info'] = 'Unknown (API Unsupported)';
    }
    
    // Storage Estimate
    if (navigator.storage && navigator.storage.estimate) {
        try {
            const estimate = await navigator.storage.estimate();
            hardwareData['Storage Quota'] = (estimate.quota / 1048576).toFixed(2) + ' MB';
            hardwareData['Storage Usage'] = (estimate.usage / 1048576).toFixed(2) + ' MB';
        } catch(e) {}
    }

    const hardwareInfoEl = document.getElementById('hardware-info');
    if (hardwareInfoEl) hardwareInfoEl.innerHTML = createTable(hardwareData);

    // --- 4. Deep WebGL Info ---
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    let webglData = {};
    if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        webglData['WebGL Supported'] = 'Yes';
        webglData['Vendor'] = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'Unknown';
        webglData['Renderer'] = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'Unknown';
        webglData['Shading Language Version'] = gl.getParameter(gl.SHADING_LANGUAGE_VERSION);
        webglData['Version'] = gl.getParameter(gl.VERSION);
        webglData['Max Texture Size'] = gl.getParameter(gl.MAX_TEXTURE_SIZE);
        webglData['Max Cube Map Texture Size'] = gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE);
        webglData['Max Renderbuffer Size'] = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE);
        webglData['Max Viewport Dims'] = gl.getParameter(gl.MAX_VIEWPORT_DIMS).join(' x ');
        
        const extensions = gl.getSupportedExtensions();
        webglData['Supported Extensions'] = extensions.length + ' extensions (click to view source)';
        webglData['Extensions List'] = extensions.join(', ');
        
    } else {
        webglData['WebGL'] = 'Not Supported';
    }
    const webglInfoEl = document.getElementById('webgl-info');
    if (webglInfoEl) webglInfoEl.innerHTML = createTable(webglData);

    // --- 5. Ping Test (Latency) ---
    const runPingTest = async () => {
        try {
            const pings = [];
            for(let i=0; i<3; i++) {
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
            return "Failed";
        }
        return "Unknown";
    };

    // --- 6. Fetch Server-Side Data ---
    let serverData = null;
    try {
        const response = await fetch('/api/info');
        serverData = await response.json();
    } catch (e) {
        console.error("Error fetching /api/info", e);
        document.getElementById('network-info').innerText = "Failed to load server info.";
        document.getElementById('device-info').innerText = "Failed to load device info.";
        document.getElementById('headers-info').innerText = "Failed to load headers.";
        return; // Stop if core server info fails
    }

    if (serverData) {
        // Device & OS Info (Server)
        const deviceData = {
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
        const deviceInfoEl = document.getElementById('device-info');
        if (deviceInfoEl) deviceInfoEl.innerHTML = createTable(deviceData);

        // Network Info
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
                    const ipMatch = event.candidate.candidate.match(/([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/);
                    if (ipMatch) {
                        rtcCandidates.add(ipMatch[1]);
                        networkData['Local IP (WebRTC Leak)'] = Array.from(rtcCandidates).join(', ');
                        const netInfoEl = document.getElementById('network-info');
                        if (netInfoEl) netInfoEl.innerHTML = createTable(networkData);
                    }
                }
            };
        } catch(e) {}

        // GeoIP & Security Check
        // Default security fields
        networkData['VPN/Proxy Detected'] = 'Checking...';
        networkData['Cloud/Datacenter IP'] = 'Checking...';

        try {
             const fields = 'status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,mobile,proxy,hosting,query';
             // Use server IP if available to avoid client-side IP mismatches if behind proxy, 
             // but ip-api.com called from client usually sees the client's public IP.
             // We'll call it directly.
             // Use relative /api/geoip endpoint to proxy the request securely
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

                     // Keyword heuristics if API flags are false (just in case)
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
                         if (browserTz && geoData.timezone && browserTz !== geoData.timezone) {
                             networkData['Timezone Mismatch'] = { 
                                 value: `Mismatch! Browser: ${browserTz}, IP: ${geoData.timezone}`, 
                                 warning: true 
                             };
                         } else {
                             networkData['Timezone Check'] = 'Consistent';
                         }
                     } catch(e) {}
                 } else {
                    networkData['Geolocation'] = `API Error: ${geoData.message || 'Unknown'}`;
                    networkData['VPN/Proxy Detected'] = 'Unknown (API Error)';
                    networkData['Cloud/Datacenter IP'] = 'Unknown (API Error)';
                    networkData['Timezone Check'] = 'Skipped (API Error)';
                 }
             } else {
                 networkData['Geolocation'] = 'API Request Failed';
                 networkData['VPN/Proxy Detected'] = 'Unknown (API Request Failed)';
                 networkData['Cloud/Datacenter IP'] = 'Unknown (API Request Failed)';
                 networkData['Timezone Check'] = 'Skipped (API Request Failed)';
             }
        } catch (e) {
            networkData['Geolocation'] = 'Could not fetch geolocation data (Blocked?)';
            networkData['VPN/Proxy Detected'] = 'Unknown (Blocked?)';
            networkData['Cloud/Datacenter IP'] = 'Unknown (Blocked?)';
            networkData['Timezone Check'] = 'Skipped (Blocked?)';
            console.warn(e);
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
        } catch(e){}

        const netInfoEl = document.getElementById('network-info');
        if (netInfoEl) netInfoEl.innerHTML = createTable(networkData);

        // Request Headers (Bottom) - ASCII format
        let headersOutput = '';
        const headerKeys = Object.keys(serverData.headers);
        const maxHKeyLen = Math.max(...headerKeys.map(k => k.length));
        
        for (const [key, value] of Object.entries(serverData.headers)) {
             const padding = ' '.repeat(maxHKeyLen - key.length + 4);
             headersOutput += `${key}${padding}${value}\n`;
        }
        
        const headersInfoEl = document.getElementById('headers-info');
        if (headersInfoEl) headersInfoEl.innerHTML = '<pre>' + headersOutput + '</pre>';
    }

    // Permissions Check (Independent of server data)
    const permNames = ['geolocation', 'notifications', 'camera', 'microphone', 'clipboard-read', 'clipboard-write'];
    const permData = {};
    
    for (const name of permNames) {
        try {
            // Some browsers require specific query formats
            const result = await navigator.permissions.query({ name });
            permData[name] = result.state;
        } catch (e) {
             // permData[name] = 'Not supported';
        }
    }
    // --- 9. Digital Fingerprint (Canvas & Audio) ---
    async function getCanvasFingerprint() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 200;
        canvas.height = 50;
        
        // Text with mixing
        ctx.textBaseline = "top";
        ctx.font = "14px 'Arial'";
        ctx.textBaseline = "alphabetic";
        ctx.fillStyle = "#f60";
        ctx.fillRect(125, 1, 62, 20);
        ctx.fillStyle = "#069";
        ctx.fillText("Hello World \ud83d\ude03", 2, 15);
        ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
        ctx.fillText("Hello World \ud83d\ude03", 4, 17);
        
        return canvas.toDataURL();
    }

    async function getAudioFingerprint() {
        try {
            const AudioContext = window.OfflineAudioContext || window.webkitOfflineAudioContext;
            if (!AudioContext) return "Not Supported";
            
            const context = new AudioContext(1, 44100, 44100);
            const oscillator = context.createOscillator();
            oscillator.type = 'triangle';
            oscillator.frequency.value = 10000;
            
            const compressor = context.createDynamicsCompressor();
            compressor.threshold.value = -50;
            compressor.knee.value = 40;
            compressor.ratio.value = 12;
            compressor.attack.value = 0;
            compressor.release.value = 0.25;
            
            oscillator.connect(compressor);
            compressor.connect(context.destination);
            
            oscillator.start(0);
            const buffer = await context.startRendering();
            return buffer.getChannelData(0).slice(0, 5000).reduce((acc, val) => acc + val, 0).toString();
        } catch (e) {
            return "Error";
        }
    }
    
    // Simple mixing hash function
    function cyrb53(str, seed = 0) {
        let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
        for (let i = 0, ch; i < str.length; i++) {
            ch = str.charCodeAt(i);
            h1 = Math.imul(h1 ^ ch, 2654435761);
            h2 = Math.imul(h2 ^ ch, 1597334677);
        }
        h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
        h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
        return 4294967296 * (2097151 & h2) + (h1 >>> 0);
    }
    
    // Calculate and Display Fingerprints
    const canvasFP = await getCanvasFingerprint();
    const audioFP = await getAudioFingerprint();
    
    // Composite Hash Data
    const fingerprintComponents = [
        canvasFP,
        audioFP,
        navigator.hardwareConcurrency,
        screen.width + 'x' + screen.height,
        Intl.DateTimeFormat().resolvedOptions().timeZone,
        navigator.language
    ].join('||');
    
    const deviceHash = cyrb53(fingerprintComponents).toString(16);
    
    const fpData = {
         'Canvas Hash': cyrb53(canvasFP).toString(16),
         'Audio Hash': cyrb53(audioFP).toString(16),
         'Composite Device ID': { value: deviceHash.toUpperCase(), warning: true },
         'Trackability': { value: 'HIGH (Unique)', warning: true }
    };
    
    const fpInfoEl = document.getElementById('fingerprint-info');
    if (fpInfoEl) fpInfoEl.innerHTML = createTable(fpData);
});

