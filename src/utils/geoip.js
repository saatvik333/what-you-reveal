/**
 * Utility for fetching GeoIP data
 * Caches the promise to prevent multiple concurrent requests to the rate-limited API
 */

let geoIPPromise = null;

export async function fetchCachedGeoIP() {
    if (geoIPPromise) {
        return geoIPPromise;
    }

    geoIPPromise = fetch('https://ipapi.co/json/')
        .then(async (response) => {
            if (!response.ok) {
                // Clear the cached promise so we can retry later if it failed
                geoIPPromise = null;
                throw new Error('API Error: ' + response.status);
            }
            const geo = await response.json();
            if (geo.error) {
                geoIPPromise = null;
                throw new Error(geo.reason || 'GeoIP Lookup Failed');
            }
            return geo;
        })
        .catch(error => {
            // Also clear on error
            geoIPPromise = null;
            throw error;
        });

    return geoIPPromise;
}

// Allow clearing the cache if needed (e.g. for testing or if the user connects to a VPN and wants to refresh)
export function clearGeoIPCache() {
    geoIPPromise = null;
}
