/**
 * Browser privacy signals that need no network access.
 * Each detector reports what it can observe; none of them can prove a protection is absent.
 */

const DNT_URL = 'https://developer.mozilla.org/en-US/docs/Web/API/Navigator/doNotTrack';
const GPC_URL = 'https://developer.mozilla.org/en-US/docs/Web/API/Navigator/globalPrivacyControl';

export function doNotTrackState() {
  const dnt = navigator.doNotTrack ?? window.doNotTrack;
  if (dnt === '1' || dnt === 'yes') return 'Enabled';
  if (dnt === '0' || dnt === 'no') return 'Disabled';
  return 'Not Set';
}

/** @returns {true | false | undefined} undefined when the browser does not implement GPC */
export function globalPrivacyControl() {
  return navigator.globalPrivacyControl;
}

export async function isBrave() {
  try {
    return (await navigator.brave?.isBrave?.()) === true;
  } catch {
    return false;
  }
}

/**
 * Cosmetic-filter bait: elements named like ads that EasyList-style filter lists hide.
 * Network-only blockers (and Brave's default first-party mode) are not detected this way.
 */
export function detectAdBlocker() {
  const baits = [
    { className: 'adsbox', id: 'ad-container' },
    { className: 'ad-placement pub_300x250', id: 'google_ads_frame' },
    { className: 'textAd banner-ad ad-banner', id: 'advert' },
    { className: 'sponsored-content', id: 'sponsored_ad' },
    { className: 'adsbygoogle', id: '' },
  ].map(({ className, id }) => {
    const bait = document.createElement('div');
    bait.textContent = '\u00a0';
    bait.className = className;
    if (id) bait.id = id;
    bait.setAttribute('aria-hidden', 'true');
    bait.style.cssText = 'width:1px;height:1px;position:absolute;left:-10000px;top:-1000px;pointer-events:none;';
    document.body.appendChild(bait);
    return bait;
  });

  return new Promise((resolve) => {
    // Give injected cosmetic stylesheets a frame plus a moment to apply.
    requestAnimationFrame(() => setTimeout(() => {
      const hidden = baits.some((bait) => {
        if (!bait.isConnected) return true;
        const style = getComputedStyle(bait);
        return bait.offsetHeight === 0 || bait.offsetWidth === 0 ||
          style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0';
      });
      baits.forEach((bait) => bait.remove());
      resolve(hidden);
    }, 150));
  });
}

/** Rows for the signals that are plain browser settings. */
export function signalRows({ adBlocker, brave }) {
  const dnt = doNotTrackState();
  const gpc = globalPrivacyControl();
  const rows = {
    'Ad Blocker': adBlocker
      ? { value: 'Active (cosmetic filtering)' }
      : { value: 'Not Detected', warning: true },
    'Global Privacy Control': {
      value: gpc === true ? 'Enabled (legal opt-out signal)' : gpc === false ? 'Not Enabled' : 'Not Supported',
      warning: gpc !== true,
      url: GPC_URL,
    },
    'Do Not Track': {
      value: dnt === 'Enabled' ? 'Enabled (deprecated; adds entropy)' : dnt,
      url: DNT_URL,
    },
    'Cookies': {
      value: navigator.cookieEnabled ? 'Enabled' : 'Blocked',
      url: 'https://developer.mozilla.org/en-US/docs/Web/API/Navigator/cookieEnabled',
    },
  };
  if (brave) rows['Brave Browser'] = { value: 'Detected (built-in farbling and blocking)' };
  return rows;
}
