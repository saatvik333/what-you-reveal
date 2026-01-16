/**
 * Bot Detection Module
 * Analyzes browser environment for signs of automation
 */

export function detectBot() {
  const findings = [];
  let score = 0;
  const webDriverUrl = 'https://developer.mozilla.org/en-US/docs/Web/API/Navigator/webdriver';
  const uaUrl = 'https://developer.mozilla.org/en-US/docs/Web/API/Navigator/userAgent';

  // 1. Check for WebDriver
  if (navigator.webdriver) {
    findings.push('navigator.webdriver is true');
    score += 100;
  }

  // 2. Check for inconsistent User-Agent / Platform
  if (navigator.userAgent.length < 20) {
    findings.push('User-Agent too short');
    score += 20;
  }

  // 3. Check for Headless Chrome user agent
  if (/HeadlessChrome/.test(navigator.userAgent)) {
    findings.push('HeadlessChrome detected in UA');
    score += 100;
  }

  // 4. Check for Chrome-specific properties if Chrome
  const isChrome = /Chrome/.test(navigator.userAgent) && !/Edge/.test(navigator.userAgent);
  if (isChrome) {
    if (!window.chrome) {
      findings.push('window.chrome missing in Chrome');
      score += 50;
    }
  }

  // 5. Check for Selenium-specific attributes
  const seleniumAttrs = [
    'cdc_adoQpoasnfa76pfcZLmcfl_Array',
    '__webdriver_evaluate',
    '__selenium_evaluate',
    '__webdriver_script_function',
    '__webdriver_script_func',
    '__webdriver_script_fn',
    '__fxdriver_evaluate',
    '__driver_unwrapped',
    '__webdriver_unwrapped',
    '__driver_evaluate',
    '__selenium_unwrapped',
    '__fxdriver_unwrapped',
  ];

  for (const attr of seleniumAttrs) {
    if (window[attr] || document.documentElement.getAttribute(attr)) {
      findings.push(`Selenium attribute found: ${attr}`);
      score += 100;
    }
  }

  // 6. Puppeteer Detection
  const puppeteerSignatures = [
    '_phantom',
    '__nightmare',
    '_selenium',
    'callPhantom',
    '_Selenium_IDE_Recorder',
  ];
  for (const sig of puppeteerSignatures) {
    if (window[sig]) {
      findings.push(`Puppeteer/Phantom signature: ${sig}`);
      score += 80;
    }
  }

  // 7. CDP (Chrome DevTools Protocol) detection
  if (window.cdc_adoQpoasnfa76pfcZLmcfl_Promise) {
    findings.push('CDP (Puppeteer/Playwright) detected');
    score += 100;
  }

  // 8. Check for automation-related prototype modifications
  try {
    const descriptors = Object.getOwnPropertyDescriptor(navigator, 'webdriver');
    if (descriptors && descriptors.get && descriptors.get.toString().includes('native code') === false) {
      findings.push('navigator.webdriver getter is modified');
      score += 50;
    }
  } catch (e) { /* ignore */ }

  // 9. Playwright Signature (navigator.webdriver is often undefined in Playwright)
  if (navigator.webdriver === undefined && /Chrome/.test(navigator.userAgent)) {
    // In real Chrome, webdriver should be false, not undefined
    findings.push('Possible Playwright (webdriver is undefined in Chrome)');
    score += 30;
  }

  // 10. Check for eval masking (common in automation)
  const evalStr = eval.toString();
  if (!evalStr.includes('native code')) {
    findings.push('eval() has been modified');
    score += 40;
  }

  // Result
  let status = 'Likely Human';
  if (score >= 100) {
    status = 'BOT DETECTED!';
  } else if (score > 0) {
    status = 'Suspicious';
  }

  const data = {
    'Integrity Status': { 
        value: status, 
        warning: score >= 50,
        url: webDriverUrl
    },
    'Automation Score': {
        value: score > 0 ? score + '/100' : '0/100 (Clean)',
        warning: score > 50,
        url: webDriverUrl
    },
    
    // Explicit checks
    'Navigator.webdriver': { 
        value: navigator.webdriver ? 'TRUE' : 'False', 
        warning: !!navigator.webdriver,
        url: webDriverUrl 
    },
    'Headless Chrome': { 
        value: /HeadlessChrome/.test(navigator.userAgent) ? 'DETECTED' : 'False', 
        warning: /HeadlessChrome/.test(navigator.userAgent),
        url: uaUrl
    },
    'Selenium Attributes': {
        value: 'None Found',
        url: 'https://developer.mozilla.org/en-US/docs/Web/API/Document/documentElement'
    },
    'Puppeteer/Playwright': {
        value: findings.some(f => f.includes('Puppeteer') || f.includes('CDP') || f.includes('Playwright')) ? 'DETECTED' : 'Not Detected',
        warning: findings.some(f => f.includes('Puppeteer') || f.includes('CDP') || f.includes('Playwright')),
        url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Browser_detection_using_the_user_agent'
    },
    'Languages': { 
        value: navigator.languages.length, 
        url: 'https://developer.mozilla.org/en-US/docs/Web/API/Navigator/languages' 
    },
  };

  if (findings.length > 0) {
    data['Flags Raised'] = { 
        value: findings.join(', '), 
        warning: true,
        url: webDriverUrl
    };
  }

  return data;
}
