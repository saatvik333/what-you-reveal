/**
 * Enhanced Report Generation Module
 * Dynamically scans collected data for threats and generates a professional system report.
 */

// ============================================================
// CONFIGURATION
// ============================================================
const CONFIG = {
  appName: 'WHAT YOU REVEAL',
  version: __APP_VERSION__,
  reportTitle: 'SYSTEM ANALYSIS & PRIVACY REPORT',
  width: 70, // Max width for ASCII tables
};



/**
 * Centers text within a defined width
 * @param {string} text
 * @param {number} width
 * @returns {string}
 */
function center(text, width = CONFIG.width) {
  const len = text.length;
  if (len >= width) {return text;}
  const padding = Math.floor((width - len) / 2);
  return ' '.repeat(padding) + text;
}

/**
 * Creates a horizontal divider line
 * @param {string} char
 * @returns {string}
 */
function line(char = '=') {
  return char.repeat(CONFIG.width);
}

/**
 * Recursively scans an object for detailed warning flags
 * @param {Object} obj - Data object to scan
 * @param {string} context - Breadcrumb context (e.g. "Network > VPN")
 * @param {Array} results - Accumulator for threats found
 */
function scanForThreats(obj, context, results) {
  if (!obj || typeof obj !== 'object') {return;}

  // Check if current object is a warning object
  if (obj.warning === true && obj.value) {
    results.push({
      vector: context,
      value: String(obj.value),
      severity: 'HIGH', // Could be dynamic if we added 'riskLevel' property later
    });
  }

  // Recursive scan
  for (const [key, value] of Object.entries(obj)) {
    if (key === 'warning' || key === 'value') {continue;} // Skip internal keys
    const nextContext = context ? `${context} > ${key}` : key;
    scanForThreats(value, nextContext, results);
  }
}

/**
 * Formats a single section of data into an aligned ASCII table look
 * @param {Object} data - Section data
 * @returns {string} Formatted string
 */
function formatSection(data) {
  let output = '';
  // Find max key length for alignment
  const keys = Object.keys(data);
  if (keys.length === 0) {return '  [No Data]\n';}

  const maxKeyLen = Math.min(30, Math.max(...keys.map((k) => k.length)));

  for (const [key, val] of Object.entries(data)) {
    let displayVal = val;
    let isWarning = false;

    // Unwrap object format
    if (typeof val === 'object' && val !== null) {
      if ('element' in val) {
        displayVal = '[Visual Evidence - Excluded from Text Report]';
      } else if ('value' in val) {
        displayVal = val.value;
        if (val.warning) {isWarning = true;}
      } else {
        // Fallback for nested objects that aren't warning containers
        displayVal = JSON.stringify(val);
      }
    }

    const keyStr = key.padEnd(maxKeyLen + 2, '.');
    const warningMark = isWarning ? ' [!]' : '';
    output += `  ${keyStr} : ${displayVal}${warningMark}\n`;
  }
  return output;
}

/**
 * Main function to generate and download the report
 */
export function downloadReport() {
  const data = window.collectedData || {};
  const timestamp = new Date().toISOString();
  const filename = `WYR_Analysis_${timestamp.replace(/[:.]/g, '-')}.txt`;

  // 1. HEADER
  let report = `
${line('=')}
${center(CONFIG.appName.toUpperCase())}
${center(CONFIG.reportTitle)}
${line('=')}

Report ID   : ${Math.random().toString(36).substr(2, 9).toUpperCase()}
Date        : ${new Date().toLocaleString()}
Build       : v${CONFIG.version}
Duration    : ${(performance.now() / 1000).toFixed(2)}s

${line('-')}
MISSION SUMMARY
${line('-')}
This document contains a forensic analysis of data exposed by your
browser to any website you visit. 

`;

  // 2. DYNAMIC THREAT SCANNING
  const threats = [];
  scanForThreats(data, '', threats);

  report += '[ THREAT INTELLIGENCE ]\n';
  if (threats.length > 0) {
    report += `\n⚠  CRITICAL EXPOSURES DETECTED: ${threats.length}\n\n`;
    threats.forEach((t, idx) => {
      report += `${idx + 1}. vector : ${t.vector}\n`;
      report += `   value  : ${t.value}\n`;
      report += `   risk   : ${t.severity}\n\n`;
    });
  } else {
    report += '\n✔  No high-risk vectors detected.\n   (Note: Zero risk is impossible on the modern web)\n\n';
  }

  // 3. DETAILED MODULE BREAKDOWN
  report += `\n${line('=')}\nRunning Full Diagnostic Dump...\n${line('=')}\n\n`;

  const sections = Object.keys(data).sort(); // Sort so headers/network don't jump around
  
  if (sections.length === 0) {
    report += '[ERROR] No data collected. Did the analysis finish?\n';
  }

  sections.forEach((section) => {
    report += `[ ${section.toUpperCase()} ]\n${line('-')}\n`;
    report += formatSection(data[section]);
    report += '\n';
  });

  // 4. FOOTER
  report += `
${line('=')}
END OF REPORT // ${CONFIG.appName}
${line('=')}
`;

  // 5. DOWNLOAD TRIGGER
  const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a); // Req for Firefox
  a.click();

  // Cleanup
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 500);
}
