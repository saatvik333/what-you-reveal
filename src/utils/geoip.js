/**
 * Utility for fetching GeoIP data
 * Caches the promise to prevent multiple concurrent requests to the rate-limited API
 */

let geoIPPromise = null;

export async function fetchCachedGeoIP() {
    if (geoIPPromise) {
        return geoIPPromise;
    }

    const request = fetch('https://ipapi.co/json/')
        .then(async (response) => {
            if (!response.ok) {
                throw new Error('API Error: ' + response.status);
            }
            const geo = await response.json();
            if (geo.error) {
                throw new Error(geo.reason || 'GeoIP Lookup Failed');
            }
            return geo;
        })
        .catch(error => {
            // A request started before a cache reset must not evict its replacement.
            if (geoIPPromise === request) geoIPPromise = null;
            throw error;
        });

    geoIPPromise = request;
    return geoIPPromise;
}

// Allow clearing the cache if needed (e.g. for testing or if the user connects to a VPN and wants to refresh)
export function clearGeoIPCache() {
    geoIPPromise = null;
}
