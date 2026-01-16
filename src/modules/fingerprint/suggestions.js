/**
 * Privacy Suggestions Module
 * Smart personalized recommendations based on detected state
 * Focuses on practical, actionable steps within the user's current browser
 */

/**
 * Gets browser-specific privacy settings recommendations
 * Note: We cannot detect the actual privacy setting level (Standard/Strict),
 * so these are always shown as general best practices
 * @param {Object} browserInfo - Browser detection info
 * @returns {Object} Browser-specific suggestions
 */
function getBrowserPrivacySettings(browserInfo) {
  const settings = {
    firefox: {
      action: 'Check Firefox Enhanced Tracking Protection',
      description: 'Settings → Privacy & Security → set to "Strict" for maximum protection',
      impact: 'MEDIUM',
      reason: 'We cannot detect your current ETP level - verify it\'s set to Strict',
    },
    chrome: {
      action: 'Check Chrome Privacy Settings',
      description: 'Settings → Privacy → Enable "Enhanced protection" and block 3rd party cookies',
      impact: 'MEDIUM',
      reason: 'We cannot detect your current settings - verify they\'re optimized',
    },
    safari: {
      action: 'Check Safari Privacy Settings',
      description: 'Preferences → Privacy → Enable "Prevent cross-site tracking" & "Hide IP address"',
      impact: 'MEDIUM',
      reason: 'We cannot detect your current settings - verify they\'re enabled',
    },
    edge: {
      action: 'Check Edge Tracking Prevention',
      description: 'Settings → Privacy → set Tracking prevention to "Strict"',
      impact: 'MEDIUM',
      reason: 'We cannot detect your current level - verify it\'s set to Strict',
    },
    brave: {
      action: 'Brave Shields Active',
      description: 'Consider enabling "Aggressive" fingerprinting protection in Shields',
      impact: 'INFO',
      reason: 'Brave has excellent privacy defaults - you\'re well protected',
    },
    opera: {
      action: 'Enable Opera\'s Built-in VPN',
      description: 'Settings → Features → Enable VPN for basic IP masking',
      impact: 'MEDIUM',
      reason: 'Opera has a free built-in VPN',
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
    protectionScore = 0, // New: use protectionScore instead of normalizedScore
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
  if (protectionScore >= 80 && isIncognito && hasPrivacyExtensions) {
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

  // 2. Privacy extensions if not detected - this is the most impactful
  if (!hasPrivacyExtensions) {
    suggestions.push({
      action: 'Install a Content Blocker',
      impact: 'HIGH',
      description: 'uBlock Origin is recommended - blocks ads, trackers, and malware',
      reason: 'No ad blocker detected - you\'re exposed to tracking scripts',
    });
  }

  // 3. Browser-specific privacy settings (we can't detect levels, so suggest checking)
  if (!isBrave) {
    const browserSettings = getBrowserPrivacySettings(browserInfo);
    suggestions.push(browserSettings);
  }

  // 4. Global Privacy Control (GPC) - detectable
  if (!hasGPC) {
    suggestions.push({
      action: 'Enable Global Privacy Control (GPC)',
      impact: 'MEDIUM',
      description: 'Legal opt-out signal recognized in California, Colorado, Connecticut',
      reason: 'GPC signal not detected - websites may sell/share your data',
    });
  }

  // 5. VPN recommendation (only if low score)
  if (!isVPNDetected && protectionScore < 40) {
    suggestions.push({
      action: 'Consider Using a VPN',
      impact: 'LOW',
      description: 'Hides your IP from websites and encrypts traffic from your ISP',
      reason: 'Your real IP address is visible to websites you visit',
    });
  }

  // If no suggestions, the user is doing well
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
