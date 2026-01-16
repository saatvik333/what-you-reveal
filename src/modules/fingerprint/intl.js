import { sha256 } from '../../utils/crypto';

export async function collectIntlData() {
  const data = {};
  const intlUrl = 'https://developer.mozilla.org/en-US/docs/Web/API/Intl';

  // Basic Locale Info
  data['Navigator Language'] = { 
      value: navigator.language, 
      url: 'https://developer.mozilla.org/en-US/docs/Web/API/Navigator/language' 
  };
  data['Languages List'] = { 
      value: navigator.languages ? navigator.languages.join(', ') : 'N/A', 
      url: 'https://developer.mozilla.org/en-US/docs/Web/API/Navigator/languages' 
  };

  // Timezone
  try {
    const dtf = Intl.DateTimeFormat();
    const resolved = dtf.resolvedOptions();
    const dtfUrl = 'https://developer.mozilla.org/en-US/docs/Web/API/Intl/DateTimeFormat/resolvedOptions';
    
    data['Timezone'] = { value: resolved.timeZone, url: dtfUrl };
    data['Locale (Resolved)'] = { value: resolved.locale, url: dtfUrl };
    data['Calendar'] = { value: resolved.calendar, url: dtfUrl };
    data['Numbering System'] = { value: resolved.numberingSystem, url: dtfUrl };
  } catch (e) {
    /* ignore */
  }

  // Date/Time Formatting Fingerprint
  try {
    const testDate = new Date(2024, 0, 15, 13, 30, 45); // Jan 15, 2024 13:30:45

    // Default format
    data['Date Format (Default)'] = { value: testDate.toLocaleDateString(), url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleDateString' };
    
    // Long format reveals locale differences
    const longFormat = new Intl.DateTimeFormat(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      timeZoneName: 'long',
    }).format(testDate);
    data['Full DateTime Format'] = { value: longFormat, url: 'https://developer.mozilla.org/en-US/docs/Web/API/Intl/DateTimeFormat/format' };
  } catch (e) {
    /* ignore */
  }

  // Number Formatting
  try {
    const testNum = 1234567.89;
    data['Number Format'] = { value: testNum.toLocaleString(), url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toLocaleString' };

    // Currency format
    const currencyFormat = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'USD',
    }).format(testNum);
    data['Currency Format (USD)'] = { value: currencyFormat, url: 'https://developer.mozilla.org/en-US/docs/Web/API/Intl/NumberFormat' };

    // Percent
    const percentFormat = new Intl.NumberFormat(undefined, {
      style: 'percent',
    }).format(0.75);
    data['Percent Format'] = { value: percentFormat, url: 'https://developer.mozilla.org/en-US/docs/Web/API/Intl/NumberFormat' };
  } catch (e) {
    /* ignore */
  }

  // RelativeTimeFormat
  try {
    if (Intl.RelativeTimeFormat) {
      const rtf = new Intl.RelativeTimeFormat();
      data['Relative Time (-1 day)'] = { value: rtf.format(-1, 'day'), url: 'https://developer.mozilla.org/en-US/docs/Web/API/Intl/RelativeTimeFormat' };
    }
  } catch (e) { /* ignore */ }

  // ListFormat
  try {
    if (Intl.ListFormat) {
      const lf = new Intl.ListFormat();
      data['List Format'] = { value: lf.format(['Apple', 'Banana', 'Cherry']), url: 'https://developer.mozilla.org/en-US/docs/Web/API/Intl/ListFormat' };
    }
  } catch (e) { /* ignore */ }

  // PluralRules
  try {
    if (Intl.PluralRules) {
      const pr = new Intl.PluralRules();
      data['Plural Rules'] = { 
          value: `1:${pr.select(1)}, 2:${pr.select(2)}, 5:${pr.select(5)}`, 
          url: 'https://developer.mozilla.org/en-US/docs/Web/API/Intl/PluralRules' 
      };
    }
  } catch (e) { /* ignore */ }

  // Generate locale fingerprint hash
  try {
      const localeComponents = [
        navigator.language,
        (navigator.languages || []).join(','),
        Intl.DateTimeFormat().resolvedOptions().timeZone,
        new Date().toLocaleDateString(),
        (1234567.89).toLocaleString(),
      ].join('||');

      const hash = (await sha256(localeComponents)).toUpperCase();
      
      data['Locale Fingerprint'] = {
        value: hash,
        warning: true,
        url: intlUrl
      };
  } catch(e) {
      // ignore
  }

  return data;
}
