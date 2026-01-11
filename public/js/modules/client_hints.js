/**
 * Advanced Client Hints Module
 * Uses navigator.userAgentData.getHighEntropyValues()
 */

export async function collectClientHints() {
    if (!navigator.userAgentData) {
        return { 'Client Hints API': 'Not Supported' };
    }

    try {
        const hints = await navigator.userAgentData.getHighEntropyValues([
            "architecture",
            "model",
            "platformVersion",
            "bitness",
            "fullVersionList",
            "wow64"
        ]);

        const data = {
            'Mobile': hints.mobile ? 'Yes' : 'No',
            'Platform': hints.platform,
            'Architecture': hints.architecture || 'Unknown',
            'Bitness': hints.bitness ? hints.bitness + '-bit' : 'Unknown',
            'Model': hints.model || 'Unknown',
            'Platform Version': hints.platformVersion || 'Unknown',
            'WoW64': hints.wow64 ? 'Yes' : 'No'
        };

        if (hints.fullVersionList) {
            data['Full Browser List'] = hints.fullVersionList
                .map(v => `${v.brand} v${v.version}`)
                .join(', ');
        }

        return data;
    } catch (e) {
        return { 'Error': 'Failed to retrieve high entropy values' };
    }
}
