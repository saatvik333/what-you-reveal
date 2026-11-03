/**
 * GeoIP lookup shared by the network and privacy cards.
 *
 * ipapi.co has the richest free data but rate-limits shared IPs aggressively (HTTP 429),
 * so get.geojs.io (no key, no published limit) answers when it fails. Both send CORS headers.
 * Results are normalized to one shape so callers never see provider differences.
 */

const PROVIDERS = [
  {
    name: 'ipapi.co',
    url: 'https://ipapi.co/json/',
    normalize: (g) => {
      // ipapi.co reports some failures (rate limit, reserved range) as HTTP 200 with { error: true }.
      if (g.error) throw new Error(g.reason || 'lookup failed');
      return {
        ip: g.ip,
        city: g.city,
        region: g.region,
        country: g.country_name,
        latitude: g.latitude,
        longitude: g.longitude,
        timezone: g.timezone,
        org: g.org,
        asn: g.asn,
        postal: g.postal,
      };
    },
  },
  {
    name: 'geojs.io',
    url: 'https://get.geojs.io/v1/ip/geo.json',
    normalize: (g) => ({
      ip: g.ip,
      city: g.city,
      region: g.region,
      country: g.country,
      latitude: g.latitude,
      longitude: g.longitude,
      timezone: g.timezone,
      org: g.organization_name,
      asn: g.asn ? `AS${g.asn}` : undefined,
      postal: undefined,
    }),
  },
];

async function lookup(provider) {
  const response = await fetch(provider.url);
  if (!response.ok) throw new Error(`${provider.name} HTTP ${response.status}`);
  const geo = provider.normalize(await response.json());
  if (typeof geo.ip !== 'string' || !geo.ip) throw new Error(`${provider.name} returned no IP`);
  return { ...geo, source: provider.name };
}

async function lookupWithFallback() {
  const errors = [];
  for (const provider of PROVIDERS) {
    try {
      return await lookup(provider);
    } catch (error) {
      errors.push(`${provider.name}: ${error.message}`);
    }
  }
  throw new Error(errors.join('; '));
}

let geoIPPromise = null;

/** One lookup per page load; a failed lookup is evicted so the next caller retries. */
export function fetchCachedGeoIP() {
  if (geoIPPromise) return geoIPPromise;

  const request = lookupWithFallback().catch((error) => {
    // A request started before a cache reset must not evict its replacement.
    if (geoIPPromise === request) geoIPPromise = null;
    throw error;
  });

  geoIPPromise = request;
  return request;
}

export function clearGeoIPCache() {
  geoIPPromise = null;
}

/**
 * Hosting, cloud and VPN operators whose address space ordinary home and mobile
 * connections do not use. Matched as whole words against the AS organization name.
 * Generic words ("Private", "Cloud", "Server") are deliberately absent: they match
 * residential ISPs such as "… Broadband Private Limited".
 */
const HOSTING_ORGS = [
  'VPN', 'Proxy', 'Hosting', 'Datacenter', 'Data Center', 'Colocation',
  'Amazon', 'AWS', 'Google LLC', 'Google Cloud', 'Microsoft', 'Azure', 'Oracle', 'Alibaba', 'Tencent',
  'DigitalOcean', 'Linode', 'Akamai', 'Vultr', 'Choopa', 'Constant Company', 'Hetzner', 'OVH',
  'Scaleway', 'Contabo', 'Leaseweb', 'IONOS', 'Hostinger', 'Cloudflare', 'Fastly', 'Zenlayer',
  'M247', 'Datacamp', 'CDN77', 'Clouvider', 'QuadraNet', 'Psychz', 'GTHost', 'Packethub',
  'Mullvad', 'NordVPN', 'Tefincom', 'Surfshark', 'ExpressVPN', 'Proton', 'Private Internet Access',
];

const HOSTING_PATTERN = new RegExp(
  `\\b(${HOSTING_ORGS.map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`,
  'i',
);

/** Returns the matched operator name when the IP belongs to a hosting/VPN network, else null. */
export function hostingProvider(geo) {
  return geo?.org?.match(HOSTING_PATTERN)?.[1] ?? null;
}
