/**
 * Privacy Extensions Detection Module
 * Detects ad blockers, privacy extensions, and fingerprint protection
 * 
 * Detection Techniques:
 * - Bait element technique (multiple ad-related CSS classes)
 * - Bait script injection (blocked ad script URLs)
 * - Network blocking detection (multiple ad domains)
 * - Canvas fingerprint protection
 * - WebRTC leak protection detection
 */

/**
 * Tests if ad blockers are hiding bait elements
 * Uses multiple detection methods for reliability
 * @returns {Promise<boolean>} True if ad blocker detected
 */
async function testBaitElement() {
  return new Promise((resolve) => {
    // Create bait container with multiple ad-related classes
    const bait = document.createElement('div');
    bait.id = 'ad-banner-container';
    bait.className = [
      'adsbox',
      'ad-banner',
      'ad-wrapper',
      'advertisement',
      'google-ad',
      'textads',
      'banner-ads',
      'sponsored-ad',
      'advert',
      'ad-container',
      'ad_wrapper',
      'adslot',
    ].join(' ');
    bait.innerHTML = '<div class="ad-text ads-banner-content">&nbsp;</div>';
    bait.style.cssText = 'position:absolute !important;left:-9999px !important;top:-9999px !important;width:1px !important;height:1px !important;background:transparent !important;';
    
    document.body.appendChild(bait);

    // Give ad blocker time to process - use longer timeout for slower extensions
    setTimeout(() => {
      const computedStyle = getComputedStyle(bait);
      const innerDiv = bait.querySelector('div');
      const innerStyle = innerDiv ? getComputedStyle(innerDiv) : null;
      
      const isBlocked = 
        bait.offsetHeight === 0 || 
        bait.offsetWidth === 0 || 
        bait.clientHeight === 0 ||
        computedStyle.display === 'none' ||
        computedStyle.visibility === 'hidden' ||
        computedStyle.opacity === '0' ||
        (innerDiv && (
          innerStyle.display === 'none' ||
          innerStyle.visibility === 'hidden'
        ));
      
      bait.remove();
      resolve(isBlocked);
    }, 200); // Increased timeout for better detection
  });
}

/**
 * Tests through multiple ad domains for more reliable detection
 * @returns {Promise<boolean>} True if network blocking detected
 */
async function testNetworkBlocking() {
  const adDomains = [
    'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js',
    'https://www.googleadservices.com/pagead/conversion.js',
    'https://static.ads-twitter.com/uwt.js',
  ];

  let blockedCount = 0;
  
  for (const url of adDomains) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300);
      
      await fetch(url, {
        method: 'HEAD',
        mode: 'no-cors',
        signal: controller.signal,
        cache: 'no-store',
      });
      clearTimeout(timeoutId);
      // If fetch succeeds, not blocked
    } catch (e) {
      // Network error or abort means blocked
      blockedCount++;
    }
    
    // If even one is blocked, we have detection
    if (blockedCount > 0) {
      return true;
    }
  }
  
  return false;
}

/**
 * Creates a script element to test if ad scripts are blocked
 * @returns {Promise<boolean>} True if script injection blocked
 */
async function testScriptBlocking() {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.id = 'ad-blocker-test-script';
    script.type = 'text/javascript';
    // Use a data URL that looks like an ad script
    script.src = 'data:text/javascript,window.__adBlockTest=true';
    script.async = true;
    
    let resolved = false;
    
    script.onload = () => {
      if (!resolved) {
        resolved = true;
        script.remove();
        resolve(false); // Script loaded = no blocking
      }
    };
    
    script.onerror = () => {
      if (!resolved) {
        resolved = true;
        script.remove();
        resolve(true); // Script blocked
      }
    };
    
    // Timeout fallback
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        script.remove();
        resolve(false);
      }
    }, 300);
    
    document.head.appendChild(script);
  });
}

/**
 * Tests for canvas fingerprint protection
 * Some extensions add noise to canvas data
 * @returns {Object} Detection result with detected flag and method
 */
function testCanvasProtection() {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');
    
    // Draw text and shapes that would be fingerprinted
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(0, 0, 100, 50);
    ctx.fillStyle = '#069';
    ctx.fillText('Privacy Test 🔒', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('Canvas FP Test', 4, 17);
    
    const dataUrl1 = canvas.toDataURL();
    
    // Create another canvas with identical operations
    const canvas2 = document.createElement('canvas');
    canvas2.width = 200;
    canvas2.height = 50;
    const ctx2 = canvas2.getContext('2d');
    
    ctx2.textBaseline = 'top';
    ctx2.font = '14px Arial';
    ctx2.fillStyle = '#f60';
    ctx2.fillRect(0, 0, 100, 50);
    ctx2.fillStyle = '#069';
    ctx2.fillText('Privacy Test 🔒', 2, 15);
    ctx2.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx2.fillText('Canvas FP Test', 4, 17);
    
    const dataUrl2 = canvas2.toDataURL();
    
    // If identical operations produce different results, noise is being added
    return { 
      detected: dataUrl1 !== dataUrl2, 
      blocked: false,
      method: 'noise',
    };
  } catch (e) {
    return { 
      detected: true, 
      blocked: true,
      method: 'blocked',
    };
  }
}

/**
 * Tests for WebRTC leak protection
 * @returns {Promise<Object>} Detection result
 */
async function testWebRTCProtection() {
  try {
    const pc = new RTCPeerConnection({ 
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });
    pc.createDataChannel('');
    await pc.createOffer().then(offer => pc.setLocalDescription(offer));
    
    // Check if local IPs are being hidden
    const hasLocalIP = await new Promise((resolve) => {
      let found = false;
      const ipRegex = /(\d{1,3}\.){3}\d{1,3}/;
      
      pc.onicecandidate = (e) => {
        if (e.candidate && e.candidate.candidate) {
          const match = e.candidate.candidate.match(ipRegex);
          if (match) {
            const ip = match[0];
            // Check for private IP ranges
            if (ip.startsWith('192.168.') || 
                ip.startsWith('10.') || 
                ip.startsWith('172.16.') ||
                ip.startsWith('172.17.') ||
                ip.startsWith('172.18.') ||
                ip.startsWith('172.19.') ||
                ip.startsWith('172.2') ||
                ip.startsWith('172.30.') ||
                ip.startsWith('172.31.')) {
              found = true;
            }
          }
        }
      };
      
      setTimeout(() => {
        pc.close();
        resolve(found);
      }, 500);
    });
    
    return { 
      detected: !hasLocalIP, 
      blocked: false,
      method: 'leak-protection',
    };
  } catch (e) {
    return { 
      detected: true, 
      blocked: true,
      method: 'blocked',
    };
  }
}

/**
 * Detects privacy extensions like uBlock Origin, Privacy Badger, AdBlock, etc.
 * Uses multiple detection techniques for reliability
 * @returns {Promise<Object>} Extension detection result
 */
export async function detectPrivacyExtensions() {
  const detected = [];
  let score = 0;

  // Run tests in parallel for speed
  const [baitBlocked, networkBlocked, scriptBlocked, canvasResult, webrtcResult] = await Promise.all([
    testBaitElement(),
    testNetworkBlocking(),
    testScriptBlocking(),
    Promise.resolve(testCanvasProtection()),
    testWebRTCProtection(),
  ]);

  // Method 1: Bait element technique
  if (baitBlocked) {
    detected.push('Ad Blocker (element hiding)');
    score += 25;
  }

  // Method 2: Network blocking
  if (networkBlocked) {
    detected.push('Ad Blocker (network blocking)');
    score += 20;
  }

  // Method 3: Script blocking
  if (scriptBlocked && !baitBlocked && !networkBlocked) {
    detected.push('Ad Blocker (script blocking)');
    score += 15;
  }

  // Method 4: Canvas fingerprint protection
  if (canvasResult.detected) {
    if (canvasResult.blocked) {
      detected.push('Canvas access blocked');
      score += 10;
    } else {
      detected.push('Canvas fingerprint protection');
      score += 15;
    }
  }

  // Method 5: WebRTC leak protection
  if (webrtcResult.detected) {
    if (webrtcResult.blocked) {
      detected.push('WebRTC blocked');
      score += 15;
    } else {
      detected.push('WebRTC leak protection');
      score += 10;
    }
  }

  return {
    detected,
    score,
    hasExtensions: detected.length > 0,
    count: detected.length,
    details: {
      baitBlocked,
      networkBlocked,
      scriptBlocked,
      canvasProtection: canvasResult.detected,
      webrtcProtection: webrtcResult.detected,
    },
  };
}
