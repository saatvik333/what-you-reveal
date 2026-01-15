/**
 * Global Configuration for What You Reveal
 */

export const CONFIG = {
    // Animation Settings
    ANIMATION: {
        BOOT_SEQUENCE_DELAY: 3500, // Match CSS animation time
        TYPEWRITER_SPEED: 5,       // ms per char
        REVEAL_THRESHOLD: 0.1      // IntersectionObserver threshold
    },

    // API Endpoints
    API: {
        PING: '/api/ping',
        INFO: '/api/info',
        GEOIP: '/api/geoip'
    },

    // Feature Flags / Toggles
    FEATURES: {
        ENABLE_CRT_FLICKER: true,
        ENABLE_SOUND: false // Future use
    },
    
    // Timeouts
    TIMEOUTS: {
        PING_TIMEOUT: 2000,
        FETCH_TIMEOUT: 5000
    }
};
