/**
 * Browser/Navigator data collection module
 */

/**
 * Collects comprehensive browser and navigator data
 * @returns {Object} Browser data object
 */
export function collectBrowserData() {
    const nav = navigator;
    const browserData = {};

    // Iterate over all properties in navigator (safe iteration)
    for (const key in nav) {
        try {
            const val = nav[key];
            if (typeof val !== 'function' && typeof val !== 'object') {
                browserData[key] = val;
            }
        } catch (e) {}
    }
    
    // Explicitly add complex objects
    browserData['userAgent'] = nav.userAgent;
    browserData['appVersion'] = nav.appVersion;
    browserData['platform'] = nav.platform;
    browserData['language'] = nav.language;
    browserData['languages'] = nav.languages ? nav.languages.join(', ') : '';
    browserData['cookieEnabled'] = nav.cookieEnabled;
    browserData['onLine'] = nav.onLine;
    browserData['doNotTrack'] = nav.doNotTrack;
    browserData['hardwareConcurrency'] = nav.hardwareConcurrency;
    browserData['deviceMemory'] = ('deviceMemory' in nav) ? (nav.deviceMemory + ' GB') : null;
    browserData['maxTouchPoints'] = nav.maxTouchPoints;
    browserData['pdfViewerEnabled'] = nav.pdfViewerEnabled;
    
    // Plugins (Legacy but still useful)
    if (nav.plugins) {
        const pluginsList = [];
        for (let i = 0; i < nav.plugins.length; i++) {
            pluginsList.push(nav.plugins[i].name + ' (' + nav.plugins[i].filename + ')');
        }
        browserData['Plugins'] = pluginsList.length > 0 ? pluginsList.join('<br>') : 'None/Hidden';
    }

    // MimeTypes
    if (nav.mimeTypes) {
        const mimeList = [];
        for (let i = 0; i < nav.mimeTypes.length; i++) {
            mimeList.push(nav.mimeTypes[i].type);
        }
        browserData['MimeTypes'] = mimeList.length > 0 ? mimeList.join(', ') : 'None/Hidden';
    }

    // Connection
    if (nav.connection) {
        browserData['Connection Type'] = nav.connection.effectiveType;
        browserData['Downlink'] = nav.connection.downlink + ' Mbps';
        browserData['RTT'] = nav.connection.rtt + ' ms';
        browserData['Save Data'] = nav.connection.saveData;
    }

    return browserData;
}
