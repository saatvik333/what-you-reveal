const express = require('express');
const requestIp = require('request-ip');
const UAParser = require('ua-parser-js');

const router = express.Router();

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
router.get('/geoip', async (req, res) => {
    const fields = req.query.fields || '';
    const ip = req.query.ip || req.clientIp || ''; 
    
    let target = ip;
    // Handle localhost/private IPs
    if (target === '::1' || target === '127.0.0.1' || target === '::ffff:127.0.0.1') {
        target = '';
    }
    
    try {
        const apiUrl = `http://ip-api.com/json/${target}?fields=${fields}`;
        const response = await fetch(apiUrl);
        if (!response.ok) {
           return res.status(response.status).json({ status: 'fail', message: 'Upstream API error' });
        }
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error("GeoIP Proxy Error:", error);
        res.status(500).json({ status: 'fail', message: 'Internal Server Error' });
    }
});

module.exports = router;
