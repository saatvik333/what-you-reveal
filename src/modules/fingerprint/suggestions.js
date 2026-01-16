/**
 * Privacy Suggestions Module
 * Smart personalized recommendations based on detected state
 * Focuses on practical, actionable steps within the user's current browser
 */

/**
 * Gets browser-specific privacy settings recommendations
 * @param {Object} browserInfo - Browser detection info
 * @returns {Object} Browser-specific suggestions
 */
function getBrowserPrivacySettings(browserInfo) {
  const settings = {
    firefox: {
      action: 'Enable Firefox Enhanced Tracking Protection (Strict)',
      description: 'Settings → Privacy & Security → Enhanced Tracking Protection → Strict',
      impact: 'HIGH',
      reason: 'Firefox has built-in tracking protection that blocks trackers, fingerprinters, and cryptominers',
    },
    chrome: {
      action: 'Enable Chrome Enhanced Safe Browsing',
      description: 'Settings → Privacy → Safe Browsing → Enhanced protection. Also disable 3rd party cookies.',
      impact: 'MEDIUM',
      reason: 'Enhanced protection provides real-time security and blocks dangerous downloads',
    },
    safari: {
      action: 'Enable Safari Intelligent Tracking Prevention',
      description: 'Preferences → Privacy → Prevent cross-site tracking & Hide IP address',
      impact: 'HIGH',
      reason: 'Safari blocks known trackers and hides your IP from them',
    },
    edge: {
      action: 'Enable Edge Strict Tracking Prevention',
      description: 'Settings → Privacy → Tracking prevention → Strict',
      impact: 'HIGH',
      reason: 'Blocks most trackers from all sites and may cause some sites to not work properly',
    },
    brave: {
      action: 'Already using Brave!',
      description: 'Consider enabling "Aggressive" fingerprinting protection in Shields settings',
      impact: 'INFO',
      reason: 'Brave has excellent privacy defaults',
    },
    opera: {
      action: 'Enable Opera\'s Built-in VPN',
      description: 'Settings → Features → Enable VPN',
      impact: 'MEDIUM',
      reason: 'Opera has a free built-in VPN for basic privacy',
    },
  };

  return settings[browserInfo.browser] || settings.chrome;
}

/**
 * Generates personalized privacy recommendations based on detected state
 * Focuses on practical improvements within the user's current setup
 * @param {Object} context - Detection context with all results
 * @returns {Array} Personalized suggestions
 */
export function generatePersonalizedSuggestions(context) {
  const suggestions = [];
  const {
    isTor,
    isBrave,
    isIncognito,
    hasGPC,
    browserInfo,
    normalizedScore,
    isVPNDetected,
    hasPrivacyExtensions,
  } = context;

  // If already in Tor, they're doing great
  if (isTor) {
    suggestions.push({
      action: 'Excellent! You\'re using Tor Browser',
      impact: 'INFO',
      description: 'Maximum anonymity achieved with onion routing',
      reason: 'Tor provides the strongest privacy protection available',
    });
    return suggestions;
  }

  // If score is already very high, congratulate them
  if (normalizedScore >= 80 && isIncognito && hasPrivacyExtensions) {
    suggestions.push({
      action: 'Excellent Privacy Setup!',
      impact: 'INFO',
      description: 'Your current configuration is well-protected',
      reason: 'Private mode + extensions = strong protection',
    });
    return suggestions;
  }

  // 1. Private/Incognito mode - only if not using it
  if (!isIncognito) {
    suggestions.push({
      action: 'Use Private/Incognito Mode',
      impact: 'HIGH',
      description: 'Prevents local history, cookies, and cache from being saved',
      reason: 'You are browsing in standard mode - your history and cookies are being stored',
    });
  }

  // 2. Browser-specific privacy settings (most actionable!)
  if (!isBrave && normalizedScore < 70) {
    const browserSettings = getBrowserPrivacySettings(browserInfo);
    suggestions.push(browserSettings);
  }

  // 3. Privacy extensions if not detected
  if (!hasPrivacyExtensions) {
    suggestions.push({
      action: 'Install a Content Blocker',
      impact: 'HIGH',
      description: 'uBlock Origin is recommended - blocks ads, trackers, and malware',
      reason: 'No ad blocker detected - you\'re exposed to tracking scripts',
    });
  }

  // 4. Global Privacy Control (GPC) - legal opt-out in some jurisdictions
  if (!hasGPC) {
    suggestions.push({
      action: 'Enable Global Privacy Control (GPC)',
      impact: 'MEDIUM',
      description: 'Legal opt-out signal for California, Colorado, Connecticut residents',
      reason: 'GPC tells websites not to sell/share your personal data',
    });
  }

  // 5. VPN recommendation (but don't push specific products)
  if (!isVPNDetected && normalizedScore < 50) {
    suggestions.push({
      action: 'Consider Using a VPN',
      impact: 'MEDIUM',
      description: 'Hides your IP from websites and encrypts traffic from your ISP',
      reason: 'Your real IP address is visible to websites you visit',
    });
  }

  // 6. DNS over HTTPS
  if (normalizedScore < 60) {
    suggestions.push({
      action: 'Enable DNS over HTTPS (DoH)',
      impact: 'LOW',
      description: `${browserInfo.browser === 'firefox' ? 'Settings → Privacy → DNS over HTTPS → Max Protection' : 'Use Cloudflare 1.1.1.1 or Google DNS with DoH'}`,
      reason: 'Encrypts DNS queries so your ISP can\'t see which sites you visit',
    });
  }

  // If still no suggestions (shouldn't happen), add a generic one
  if (suggestions.length === 0) {
    suggestions.push({
      action: 'Your privacy setup looks good!',
      impact: 'INFO',
      description: 'Keep your browser and extensions updated',
      reason: 'Regular updates patch security vulnerabilities',
    });
  }

  return suggestions;
}
