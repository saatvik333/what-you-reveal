const express = require('express');

const UAParser = require('ua-parser-js');

const router = express.Router();

// Simple in-memory cache for GeoIP responses
// Map Key: IP address, Value: { data: Object, expires: Number }
const geoCache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// API endpoint for latency testing
router.get('/ping', (req, res) => {
    res.sendStatus(200);
});

// API endpoint to get server-side detected info
router.get('/info', (req, res) => {
    const ip = req.clientIp;
    const userAgent = req.headers['user-agent'];
    const parser = new UAParser(userAgent);
    const uaResult = parser.getResult();

    const headers = req.headers;

    // Detect potential proxy headers
    const proxyHeaders = {};
    const proxyKeys = ['via', 'x-forwarded-for', 'cf-connecting-ip', 'forwarded', 'x-real-ip'];
    
    proxyKeys.forEach(key => {
        if (headers[key]) {
            proxyHeaders[key] = headers[key];
        }
    });

    res.json({
        ip,
        headers,
        proxyHeaders,
        uaResult
    });
});

// API endpoint to proxy GeoIP requests (Fixes Mixed Content & CORS)
// Note: ip-api.com free tier only supports HTTP. We proxy it here to avoid Mixed Content blocks in the browser.
// Implements caching to respect rate limits (45 req/min).
router.get('/geoip', async (req, res) => {
    const fields = req.query.fields || '';
    const ip = req.query.ip || req.clientIp || ''; 
    
    let target = ip;
    // Handle localhost/private IPs
    if (target === '::1' || target === '127.0.0.1' || target === '::ffff:127.0.0.1') {
        target = '';
    }

    // Check Cache
    const cacheKey = `${target}_${fields}`;
    const cached = geoCache.get(cacheKey);
    if (cached) {
        if (Date.now() < cached.expires) {
            return res.json(cached.data);
        } else {
            geoCache.delete(cacheKey); // Clean up expired
        }
    }
    
    try {
        const apiUrl = `http://ip-api.com/json/${target}?fields=${fields}`;
        const response = await fetch(apiUrl);
        if (!response.ok) {
           return res.status(response.status).json({ status: 'fail', message: 'Upstream API error' });
        }
        const data = await response.json();

        // Store in Cache if successful
        if (data.status === 'success') {
            geoCache.set(cacheKey, {
                data: data,
                expires: Date.now() + CACHE_DURATION
            });
            
            // Basic cleanup to prevent memory leaks if many unique IPs are hit
            if (geoCache.size > 1000) {
                const firstKey = geoCache.keys().next().value;
                geoCache.delete(firstKey);
            }
        }

        res.json(data);
    } catch (error) {
        console.error('GeoIP Proxy Error:', error);
        res.status(500).json({ status: 'fail', message: 'Internal Server Error' });
    }
});

module.exports = router;
