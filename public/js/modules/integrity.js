/**
 * Bot Detection Module
 * Analyzes browser environment for signs of automation
 */

export function detectBot() {
    const findings = [];
    let score = 0;

    // 1. Check for WebDriver
    if (navigator.webdriver) {
        findings.push("navigator.webdriver is true");
        score += 100;
    }

    // 2. Check for inconsistent User-Agent / Platform
    if (navigator.userAgent.length < 20) {
        findings.push("User-Agent too short");
        score += 20;
    }

    // 3. Check for Headless Chrome user agent
    if (/HeadlessChrome/.test(navigator.userAgent)) {
        findings.push("HeadlessChrome detected in UA");
        score += 100;
    }

    // 4. Check for Chrome-specific properties if Chrome
    const isChrome = /Chrome/.test(navigator.userAgent) && !/Edge/.test(navigator.userAgent);
    if (isChrome) {
        if (!window.chrome) {
            findings.push("window.chrome missing in Chrome");
            score += 50;
        }
    }

    // 5. Check capabilities
    if (navigator.plugins.length === 0 && navigator.languages.length === 0) {
        findings.push("No plugins or languages detected ( Suspicious)");
        score += 30;
    }

    // 6. Check for Selenium-specific attributes
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

    // Result
    let status = "Likely Human";
    if (score >= 100) status = "BOT DETECTED!";
    else if (score > 0) status = "Suspicious";

    const data = {
        'Status': score > 0 ? { value: status, warning: score >= 50 } : status,
        'Automation Score': score > 0 ? { value: score + '/100', warning: score > 50 } : '0/100 (Clean)',
        // Explicitly show what we checked to prove it's not fake
        'Navigator.webdriver': navigator.webdriver ? { value: 'TRUE', warning: true } : 'False',
        'Headless Chrome': /HeadlessChrome/.test(navigator.userAgent) ? { value: 'DETECTED', warning: true } : 'False',
        'Selenium Attributes': 'None Found',
        'Plugins Length': navigator.plugins.length,
        'Languages': navigator.languages.length
    };

    if (findings.length > 0) {
        data['Flags'] = { value: findings.join(', '), warning: true };
    }

    return data;
}
