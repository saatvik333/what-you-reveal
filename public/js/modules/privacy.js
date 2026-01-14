/**
 * Privacy Mode Detection Module (Incognito / Tor)
 */

/**
 * Attempts to detect if the user is in Incognito / Private Browsing mode
 * or using Tor Browser based on storage quotas and known behaviors.
 * 
 * Note: Browser vendors actively fight these detection methods.
 * This is a "best effort" estimation.
 */
export async function detectPrivacyMode() {
    let findings = [];
    let score = 0; // Higher score = more likely private/incognito

    // 1. Storage Quota Check (Chrome/Edge/Firefox often limit quota in Incognito)
    if (navigator.storage && navigator.storage.estimate) {
        try {
            const { quota } = await navigator.storage.estimate();
            // In Incognito, quota is often significantly lower (e.g. < 120MB or 10% of disk)
            // Normal browsing usually has gigabytes available.
            // Threshold: 200MB (approx 200 * 1024 * 1024 bytes)
            const quotaMB = quota / (1024 * 1024);
            
            if (quotaMB < 200) {
                findings.push(`Low Storage Quota (${quotaMB.toFixed(0)}MB)`);
                score += 40;
            }
        } catch (e) {
            // Failure to access storage is also suspicious
        }
    }

    // 2. Filesystem API (Chrome specific)
    // Deprecated in some versions but still a classic check
    if ('webkitRequestFileSystem' in window) {
         // In some versions, this fails instantly in Incognito
    }

    // 3. Tor Browser Checks
    // Tor usually forces window size, generic screen dims, and specific timezone
    const isTorSize = (window.outerWidth === 1000 && window.outerHeight === 1000) || 
                      (window.innerWidth === window.outerWidth && window.innerHeight === window.outerHeight); // Maximized often discouraged in Tor
    
    // Tor usually spoofs timezone to UTC
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz === 'UTC' && navigator.hardwareConcurrency === 2) { 
         // Common Tor spoofing profile (UTC + 2 cores)
         findings.push("Tor-like Profile (UTC + 2 Cores)");
         score += 30;
    }

    // 4. Memory API
    // Some private modes disable deviceMemory
    if (!('deviceMemory' in navigator)) {
        findings.push("deviceMemory API hidden");
        score += 10;
    }
    
    // Result Interpretation
    let status = "Standard Mode";
    let warning = false;

    if (score >= 40) {
        status = "Private / Incognito Detected";
        warning = true;
    } else if (score >= 20) {
        status = "Suspicious / Hybrid";
    }

    // Tor Check override
    // Simple canvas checks (already done in Identity) might hint, but here we look for layout traits
    if (findings.some(f => f.includes('Tor'))) {
        status = "Tor Browser / Privacy Hardened";
        warning = true;
    }

    const result = {
        'Browsing Mode': { value: status, warning: warning },
        'Risk Score': score + '/100',
    };

    if (findings.length > 0) {
        result['Indicators'] = { value: findings.join(', '), warning: true };
    } else {
        result['Indicators'] = 'None found';
    }

    return result;
}
