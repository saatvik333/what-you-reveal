/**
 * Automation detection: the checks bot-detection scripts run against WebDriver, headless
 * Chrome, ChromeDriver, PhantomJS/Nightmare and patched native functions.
 */

const WEBDRIVER_URL = 'https://developer.mozilla.org/en-US/docs/Web/API/Navigator/webdriver';
const UA_URL = 'https://developer.mozilla.org/en-US/docs/Web/API/Navigator/userAgent';

const SELENIUM_GLOBALS = [
  '__webdriver_evaluate', '__selenium_evaluate', '__webdriver_script_function', '__webdriver_script_func',
  '__webdriver_script_fn', '__fxdriver_evaluate', '__driver_unwrapped', '__webdriver_unwrapped',
  '__driver_evaluate', '__selenium_unwrapped', '__fxdriver_unwrapped', '_selenium', '_Selenium_IDE_Recorder',
];
const LEGACY_HEADLESS_GLOBALS = ['_phantom', 'callPhantom', '__nightmare'];

const isNative = (fn) => typeof fn === 'function' && Function.prototype.toString.call(fn).includes('[native code]');

export function detectBot() {
  const ua = navigator.userAgent;
  const isChromium = /Chrome\//.test(ua);
  const checks = [];
  const flag = (name, points) => checks.push({ name, points });

  if (navigator.webdriver === true) flag('navigator.webdriver is true', 100);
  if (/HeadlessChrome/.test(ua)) flag('HeadlessChrome in User-Agent', 100);
  if (ua.length < 20) flag('User-Agent too short', 20);
  if (isChromium && !window.chrome) flag('window.chrome missing in a Chromium UA', 50);
  // Real Chromium defines webdriver as false; some automation stacks delete the property.
  if (isChromium && navigator.webdriver === undefined) flag('navigator.webdriver deleted', 30);
  if (navigator.languages?.length === 0) flag('navigator.languages is empty', 20);

  const seleniumHits = SELENIUM_GLOBALS.filter((name) => name in window || document.documentElement.hasAttribute(name));
  // ChromeDriver injects `cdc_…`/`$cdc_…` globals.
  const chromeDriverHits = Object.keys(window).filter((name) => /^\$?cdc_/.test(name));
  const legacyHits = LEGACY_HEADLESS_GLOBALS.filter((name) => name in window);
  for (const name of seleniumHits) flag(`Selenium global ${name}`, 100);
  for (const name of chromeDriverHits) flag(`ChromeDriver global ${name}`, 100);
  for (const name of legacyHits) flag(`PhantomJS/Nightmare global ${name}`, 80);

  // Browsers define webdriver on Navigator.prototype; an own property or a non-native getter is a patch.
  const webdriverGetter = Object.getOwnPropertyDescriptor(Navigator.prototype, 'webdriver')?.get;
  if (Object.getOwnPropertyDescriptor(navigator, 'webdriver') || (webdriverGetter && !isNative(webdriverGetter))) {
    flag('navigator.webdriver patched', 50);
  }
  if (!isNative(eval)) flag('eval() patched', 40);

  const score = Math.min(100, checks.reduce((sum, c) => sum + c.points, 0));
  const status = score >= 100 ? 'Bot Detected' : score > 0 ? 'Suspicious' : 'Likely Human';

  const data = {
    'Integrity Status': { value: status, warning: score > 0, url: WEBDRIVER_URL },
    'Automation Score': { value: score > 0 ? `${score}/100` : '0/100 (Clean)', warning: score > 0 },
    'navigator.webdriver': {
      value: String(navigator.webdriver),
      warning: navigator.webdriver === true,
      url: WEBDRIVER_URL,
    },
    'Headless Chrome': { value: /HeadlessChrome/.test(ua) ? 'Detected' : 'Not Detected', warning: /HeadlessChrome/.test(ua), url: UA_URL },
    'Selenium/ChromeDriver': {
      value: seleniumHits.length + chromeDriverHits.length > 0 ? 'Detected' : 'Not Detected',
      warning: seleniumHits.length + chromeDriverHits.length > 0,
    },
    'PhantomJS/Nightmare': { value: legacyHits.length > 0 ? 'Detected' : 'Not Detected', warning: legacyHits.length > 0 },
    'Native Functions': {
      value: checks.some((c) => c.name.includes('patched')) ? 'Patched' : 'Intact',
      warning: checks.some((c) => c.name.includes('patched')),
    },
  };
  if (checks.length > 0) {
    data['Flags Raised'] = { value: checks.map((c) => c.name).join(', '), warning: true };
  }
  return data;
}
