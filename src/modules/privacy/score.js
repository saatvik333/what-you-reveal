/**
 * Privacy score: the one definition of every rule. The privacy card computes the score
 * from it and the score explanation dialog renders it, so the two cannot drift.
 *
 * Protections the user turned on earn points; defaults are neutral; only real exposure
 * (an IP leak, automation) costs points. Signals that protect nothing are not scored:
 * Do Not Track is deprecated and ignored by sites, and a first-party page cannot
 * observe third-party storage partitioning.
 */

export const BASE_SCORE = 30;

export const SCORE_RULES = [
  { factor: 'adBlocker', label: 'Ad/tracker blocker active', points: 15 },
  { factor: 'fingerprintProtection', label: 'Canvas fingerprint protection', points: 15 },
  { factor: 'webrtcProtected', label: 'WebRTC exposes no extra IP', points: 15 },
  { factor: 'gpcEnabled', label: 'Global Privacy Control sent', points: 10 },
  { factor: 'vpnDetected', label: 'VPN or hosting network', points: 10 },
  { factor: 'torDetected', label: 'Tor exit node', points: 10 },
  { factor: 'privateBrowsing', label: 'Private browsing', points: 5 },
  { factor: 'brave', label: 'Brave browser', points: 5 },
  { factor: 'webrtcLeaking', label: 'WebRTC leaks an IP', points: -15 },
  { factor: 'webdriverDetected', label: 'Browser automation (WebDriver)', points: -10 },
];

export const GRADES = [
  { min: 90, label: 'A+ (Maximum Privacy)' },
  { min: 80, label: 'A (Excellent Privacy)' },
  { min: 70, label: 'B (Strong Privacy)' },
  { min: 60, label: 'C (Moderate Privacy)' },
  { min: 50, label: 'D (Basic Privacy)' },
  { min: 30, label: 'E (Weak Privacy)' },
  { min: 0, label: 'F (At Risk)' },
];

/**
 * @param {Record<string, boolean>} factors keyed by SCORE_RULES[].factor
 * @returns {{ score: number, grade: string, breakdown: { label: string, points: number }[] }}
 */
export function calculatePrivacyScore(factors) {
  const breakdown = SCORE_RULES.filter((rule) => factors[rule.factor] === true);
  const raw = breakdown.reduce((sum, rule) => sum + rule.points, BASE_SCORE);
  const score = Math.max(0, Math.min(100, raw));
  const grade = GRADES.find((g) => score >= g.min).label;
  return { score, grade, breakdown: breakdown.map(({ label, points }) => ({ label, points })) };
}

export function formatPoints(points) {
  return points > 0 ? `+${points}` : String(points);
}
