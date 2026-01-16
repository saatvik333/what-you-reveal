/**
 * Privacy Suggestions Module
 * Smart personalized recommendations based on detected state
 */

/**
 * Generates personalized privacy recommendations based on detected state
 * Only suggests things the user doesn't already have
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
    hasDNT,
    browserInfo,
    normalizedScore,
    isVPNDetected,
    hasPrivacyExtensions,
  } = context;

  // Only suggest Tor if not already using it and score is low
  if (!isTor && normalizedScore < 80) {
    suggestions.push({
      action: 'Switch to Tor Browser',
      impact: 'HIGH',
      description: 'Maximum anonymity with onion routing',
      icon: '🧅',
      reason: 'You are not using Tor Browser',
    });
  }

  // Only suggest VPN if not detected and not on Tor
  if (!isVPNDetected && !isTor) {
    suggestions.push({
      action: 'Use a VPN Service',
      impact: 'HIGH',
      description: 'Masks your IP address and encrypts traffic',
      icon: '🔐',
      reason: 'No VPN/proxy detected on your connection',
    });
  }

  // Only suggest incognito if not already in private mode
  if (!isIncognito && normalizedScore < 50) {
    suggestions.push({
      action: 'Use Private/Incognito Mode',
      impact: 'MEDIUM',
      description: 'Prevents local history/cookie storage',
      icon: '👤',
      reason: 'You are browsing in standard mode',
    });
  }

  // Only suggest Brave if not using Brave and not on Tor
  if (!isBrave && !isTor && browserInfo.browser !== 'brave') {
    suggestions.push({
      action: 'Switch to Brave Browser',
      impact: 'MEDIUM',
      description: 'Built-in fingerprint protection & ad blocking',
      icon: '🦁',
      reason: `You are using ${browserInfo.name}`,
    });
  }

  // Only suggest GPC if not enabled
  if (!hasGPC) {
    suggestions.push({
      action: 'Enable Global Privacy Control',
      impact: 'MEDIUM',
      description: 'Signals websites not to sell your data',
      icon: '🛡️',
      reason: 'GPC signal is not set in your browser',
    });
  }

  // Only suggest DNT if not enabled (though less impactful)
  if (!hasDNT) {
    suggestions.push({
      action: 'Enable Do Not Track',
      impact: 'LOW',
      description: 'Request websites not to track you',
      icon: '🚫',
      reason: 'DNT header is not enabled',
    });
  }

  // Only suggest privacy extensions if NOT already detected
  if (!hasPrivacyExtensions && !isTor) {
    suggestions.push({
      action: 'Install Privacy Extensions',
      impact: 'MEDIUM',
      description: 'uBlock Origin, Privacy Badger, etc.',
      icon: '🧩',
      reason: 'No ad blocker or privacy extensions detected',
    });
  }

  // Suggest DNS over HTTPS for most users
  if (!isTor && normalizedScore < 70) {
    suggestions.push({
      action: 'Enable DNS over HTTPS',
      impact: 'LOW',
      description: 'Encrypts DNS queries from your ISP',
      icon: '🌐',
      reason: 'Adds an extra layer of privacy',
    });
  }

  // If score is already very high, give a congratulatory message
  if (suggestions.length === 0) {
    suggestions.push({
      action: 'Excellent Privacy Setup!',
      impact: 'INFO',
      description: 'Your current configuration is well-protected',
      icon: '✅',
      reason: 'No additional recommendations at this time',
    });
  }

  return suggestions;
}
