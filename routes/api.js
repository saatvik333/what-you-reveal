const express = require('express');
const net = require('net');
const UAParser = require('ua-parser-js');

const router = express.Router();

// --- Configuration ---
const CONFIG = {
  GEOIP_RATE_LIMIT: 40, // Max 40 req/min (Buffer below 45 limit)
  GLOBAL_RATE_LIMIT: 300, // Max 300 req/min for general API
  CACHE_DURATION: 15 * 60 * 1000, // 15 minutes
  MAX_CACHE_SIZE: 2000,
};

// --- In-Memory Storage ---
// GeoIP Cache: Map<Key, { data, expires }>
const geoCache = new Map();

// Rate Limiters: Map<IP, { count, resetTime }>
const globalLimiter = new Map();
const geoipLimiter = new Map();

// --- Helpers ---

/**
 * Validates an IP address
 * @param {string} ip
 * @returns {boolean}
 */
const isValidIP = (ip) => net.isIP(ip) !== 0;

/**
 * Rate Limiting Middleware
 * @param {Map} limiterStore - The storage map for this limiter
 * @param {number} limit - Max requests per window
 * @param {number} windowMs - Time window in ms (default 1 min)
 */
const rateLimit =
  (limiterStore, limit, windowMs = 60000) =>
  (req, res, next) => {
    const ip = req.clientIp || req.ip;
    const now = Date.now();

    let record = limiterStore.get(ip);

    // Create or reset record if expired
    if (!record || now > record.resetTime) {
      record = { count: 0, resetTime: now + windowMs };
      limiterStore.set(ip, record);
    }

    // Check limit
    if (record.count >= limit) {
      return res.status(429).json({
        status: 'error',
        message: 'Too many requests. Please try again later.',
      });
    }

    // Increment
    record.count++;

    // Periodic Cleanup (approximate, to avoid memory leak)
    if (Math.random() < 0.01) {
      // 1% chance to cleanup
      for (const [key, val] of limiterStore.entries()) {
        if (now > val.resetTime) {limiterStore.delete(key);}
      }
    }

    next();
  };

// --- Routes ---

// API endpoint for latency testing
router.get('/ping', rateLimit(globalLimiter, CONFIG.GLOBAL_RATE_LIMIT), (req, res) => {
  res.sendStatus(200);
});

// API endpoint to get server-side detected info
router.get('/info', rateLimit(globalLimiter, CONFIG.GLOBAL_RATE_LIMIT), (req, res) => {
  const ip = req.clientIp;
  const userAgent = req.headers['user-agent'];
  const parser = new UAParser(userAgent);
  const uaResult = parser.getResult();

  const headers = req.headers;

  // Detect potential proxy headers
  const proxyHeaders = {};
  const proxyKeys = ['via', 'x-forwarded-for', 'cf-connecting-ip', 'forwarded', 'x-real-ip'];

  proxyKeys.forEach((key) => {
    if (headers[key]) {
      proxyHeaders[key] = headers[key];
    }
  });

  res.json({
    ip,
    headers,
    proxyHeaders,
    uaResult,
  });
});

// API endpoint to proxy GeoIP requests
// Proxies ip-api.com (HTTP only) to avoid Mixed Content
// Enforces strictly < 45 req/min
router.get('/geoip', rateLimit(geoipLimiter, CONFIG.GEOIP_RATE_LIMIT), async (req, res) => {
  const fields = req.query.fields || '';
  let ip = req.query.ip || req.clientIp || '';

  // Sanitize and Validate IP
  ip = ip.trim();
  if (!isValidIP(ip)) {
    // Handle special localhost cases gracefully, otherwise error
    if (ip === '::1' || ip === 'localhost') {
      ip = ''; // Allow empty (asks API for current public IP)
    } else {
      return res.status(400).json({ status: 'fail', message: 'Invalid IP address format' });
    }
  }

  // Handle localhost/private IPs mappings
  if (ip === '127.0.0.1' || ip === '::ffff:127.0.0.1') {
    ip = '';
  }

  // Check Cache
  const cacheKey = `${ip}_${fields}`;
  const cached = geoCache.get(cacheKey);

  if (cached) {
    if (Date.now() < cached.expires) {
      return res.json(cached.data);
    } else {
      geoCache.delete(cacheKey);
    }
  }

  try {
    // Construct upstream URL
    // Warning: ip-api.com will ban if > 45 req/min
    const apiUrl = `http://ip-api.com/json/${ip}?fields=${fields}`;

    const response = await fetch(apiUrl);
    if (!response.ok) {
      return res.status(response.status).json({ status: 'fail', message: 'Upstream API error' });
    }

    const data = await response.json();

    // Store in Cache if successful
    if (data.status === 'success') {
      // Check cache size and evict oldest if full (LRU-ish)
      if (geoCache.size >= CONFIG.MAX_CACHE_SIZE) {
        const firstKey = geoCache.keys().next().value;
        geoCache.delete(firstKey);
      }

      geoCache.set(cacheKey, {
        data: data,
        expires: Date.now() + CONFIG.CACHE_DURATION,
      });
    }

    res.json(data);
  } catch (error) {
    console.error('GeoIP Proxy Error:', error);
    res.status(500).json({ status: 'fail', message: 'Internal Server Error' });
  }
});

module.exports = router;
