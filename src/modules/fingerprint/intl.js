import { sha256 } from '../../utils/crypto.js';

const JS_REF = 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/';
const INTL = `${JS_REF}Intl/`;

// Fixed inputs: the fingerprint must not change from one day (or minute) to the next.
const SAMPLE_DATE = new Date(2024, 0, 15, 13, 30, 45);
const SAMPLE_NUMBER = 1234567.89;

/** Runs a formatter and records its output; engines that lack an Intl feature skip the row. */
function addFormatted(data, label, url, format) {
  try {
    data[label] = { value: format(), url };
  } catch {}
}

export async function collectIntlData() {
  const data = {};

  data['Languages'] = {
    value: navigator.languages?.length ? navigator.languages.join(', ') : navigator.language,
    url: 'https://developer.mozilla.org/en-US/docs/Web/API/Navigator/languages',
  };

  const resolved = Intl.DateTimeFormat().resolvedOptions();
  const resolvedUrl = `${INTL}DateTimeFormat/resolvedOptions`;
  data['Timezone'] = { value: resolved.timeZone, url: resolvedUrl };
  const offset = -new Date().getTimezoneOffset(); // minutes east of UTC; may be fractional hours
  const pad = (n) => String(n).padStart(2, '0');
  data['UTC Offset'] = {
    value: `UTC${offset >= 0 ? '+' : '-'}${pad(Math.floor(Math.abs(offset) / 60))}:${pad(Math.abs(offset) % 60)}`,
    url: `${JS_REF}Date/getTimezoneOffset`,
  };
  data['Locale (Resolved)'] = { value: resolved.locale, url: resolvedUrl };
  data['Calendar'] = { value: resolved.calendar, url: resolvedUrl };
  data['Numbering System'] = { value: resolved.numberingSystem, url: resolvedUrl };
  data['Hour Cycle'] = {
    value: new Intl.DateTimeFormat(undefined, { hour: 'numeric' }).resolvedOptions().hourCycle ?? 'Unknown',
    url: resolvedUrl,
  };

  addFormatted(data, 'Date Format', `${JS_REF}Date/toLocaleDateString`, () => SAMPLE_DATE.toLocaleDateString());
  addFormatted(data, 'Full DateTime Format', `${INTL}DateTimeFormat`, () =>
    new Intl.DateTimeFormat(undefined, {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: 'numeric', minute: 'numeric', timeZoneName: 'long',
    }).format(SAMPLE_DATE));
  addFormatted(data, 'Number Format', `${INTL}NumberFormat`, () => SAMPLE_NUMBER.toLocaleString());
  addFormatted(data, 'Currency Format (USD)', `${INTL}NumberFormat`, () =>
    new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(SAMPLE_NUMBER));
  addFormatted(data, 'Relative Time (-1 day)', `${INTL}RelativeTimeFormat`, () =>
    new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' }).format(-1, 'day'));
  addFormatted(data, 'List Format', `${INTL}ListFormat`, () =>
    new Intl.ListFormat().format(['Apple', 'Banana', 'Cherry']));
  addFormatted(data, 'Plural Rules', `${INTL}PluralRules`, () => {
    const pr = new Intl.PluralRules();
    return [0, 1, 2, 5].map((n) => `${n}:${pr.select(n)}`).join(', ');
  });

  // The UTC offset shifts with daylight saving time; the zone name already covers it.
  const hashInput = Object.entries(data)
    .filter(([key]) => key !== 'UTC Offset')
    .map(([key, row]) => `${key}=${row.value}`)
    .join('|');
  data['Locale Fingerprint'] = {
    value: (await sha256(hashInput)).slice(0, 16).toUpperCase(),
    warning: true,
    url: 'https://developer.mozilla.org/en-US/docs/Glossary/Fingerprinting',
  };

  return data;
}
