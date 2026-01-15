/**
 * Internationalization Fingerprinting Module
 * Deep locale fingerprinting using Intl APIs
 */

import { cyrb53 } from './crypto.js';

/**
 * Collects comprehensive Intl/locale fingerprint data
 * The Intl API reveals detailed locale configuration that varies per system
 * @returns {Object} Internationalization fingerprint data
 */
export function collectIntlData() {
    const data = {};
    
    // Basic Locale Info
    data['Navigator Language'] = navigator.language;
    data['Languages List'] = navigator.languages ? navigator.languages.join(', ') : 'N/A';
    
    // Timezone
    try {
        const dtf = Intl.DateTimeFormat();
        const resolved = dtf.resolvedOptions();
        data['Timezone'] = resolved.timeZone;
        data['Locale'] = resolved.locale;
        data['Calendar'] = resolved.calendar;
        data['Numbering System'] = resolved.numberingSystem;
    } catch (e) { /* ignore */ }
    
    // Date/Time Formatting Fingerprint
    try {
        const testDate = new Date(2024, 0, 15, 13, 30, 45);
        
        // Default format
        data['Date Format (Default)'] = testDate.toLocaleDateString();
        data['Time Format (Default)'] = testDate.toLocaleTimeString();
        
        // Long format reveals locale differences
        const longFormat = new Intl.DateTimeFormat(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            timeZoneName: 'long'
        }).format(testDate);
        data['Full DateTime Format'] = longFormat;
    } catch (e) { /* ignore */ }
    
    // Number Formatting
    try {
        const testNum = 1234567.89;
        data['Number Format'] = testNum.toLocaleString();
        
        // Currency format (reveals locale defaults)
        const currencyFormat = new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: 'USD'
        }).format(testNum);
        data['Currency Format (USD)'] = currencyFormat;
        
        // Percent
        const percentFormat = new Intl.NumberFormat(undefined, {
            style: 'percent'
        }).format(0.75);
        data['Percent Format'] = percentFormat;
    } catch (e) { /* ignore */ }
    
    // RelativeTimeFormat (reveals locale phrasing)
    try {
        if (Intl.RelativeTimeFormat) {
            const rtf = new Intl.RelativeTimeFormat();
            data['Relative Time (-1 day)'] = rtf.format(-1, 'day');
            data['Relative Time (+2 weeks)'] = rtf.format(2, 'week');
        }
    } catch (e) { /* ignore */ }
    
    // ListFormat (reveals conjunction style)
    try {
        if (Intl.ListFormat) {
            const lf = new Intl.ListFormat();
            data['List Format'] = lf.format(['Apple', 'Banana', 'Cherry']);
        }
    } catch (e) { /* ignore */ }
    
    // PluralRules (language-specific pluralization)
    try {
        if (Intl.PluralRules) {
            const pr = new Intl.PluralRules();
            data['Plural Rule (1)'] = pr.select(1);
            data['Plural Rule (2)'] = pr.select(2);
            data['Plural Rule (5)'] = pr.select(5);
        }
    } catch (e) { /* ignore */ }
    
    // DisplayNames (how locale names things)
    try {
        if (Intl.DisplayNames) {
            const regionNames = new Intl.DisplayNames(undefined, { type: 'region' });
            const languageNames = new Intl.DisplayNames(undefined, { type: 'language' });
            const currencyNames = new Intl.DisplayNames(undefined, { type: 'currency' });
            
            data['Region Name (US)'] = regionNames.of('US');
            data['Region Name (JP)'] = regionNames.of('JP');
            data['Language Name (en)'] = languageNames.of('en');
            data['Currency Name (EUR)'] = currencyNames.of('EUR');
        }
    } catch (e) { /* ignore */ }
    
    // Collator (string sorting rules)
    try {
        const collator = new Intl.Collator();
        const resolved = collator.resolvedOptions();
        data['Collation Locale'] = resolved.locale;
        data['Collation Sensitivity'] = resolved.sensitivity;
        data['Collation Numeric'] = resolved.numeric ? 'Yes' : 'No';
    } catch (e) { /* ignore */ }
    
    // Segmenter (text segmentation - varies by language)
    try {
        if (Intl.Segmenter) {
            const segmenter = new Intl.Segmenter();
            const resolved = segmenter.resolvedOptions();
            data['Segmenter Locale'] = resolved.locale;
            data['Segmenter Granularity'] = resolved.granularity;
        }
    } catch (e) { /* ignore */ }
    
    // Generate locale fingerprint hash
    const localeComponents = [
        navigator.language,
        (navigator.languages || []).join(','),
        Intl.DateTimeFormat().resolvedOptions().timeZone,
        new Date().toLocaleDateString(),
        (1234567.89).toLocaleString()
    ].join('||');
    
    data['Locale Fingerprint'] = { 
        value: cyrb53(localeComponents).toString(16).toUpperCase(), 
        warning: true 
    };

    return data;
}
