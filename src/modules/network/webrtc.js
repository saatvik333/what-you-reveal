/**
 * WebRTC ICE candidate probe, shared by the network and privacy cards.
 *
 * Gathers candidates once with a public STUN server:
 * - host candidates carry the device's local address unless the browser hides it behind an
 *   mDNS name (`<uuid>.local`), which current Chrome, Firefox and Safari do by default;
 * - server-reflexive (srflx) candidates carry the public address the STUN server saw. When it
 *   differs from the address HTTP requests come from, WebRTC is bypassing the VPN or proxy.
 */

import { fetchPublicIPs } from '../../utils/publicip.js';

const STUN_SERVER = 'stun:stun.cloudflare.com:3478';
const GATHER_TIMEOUT_MS = 3000;

function parseCandidate(candidate) {
  // RTCIceCandidate exposes address/type directly; older engines only fill the SDP line:
  // "candidate:<foundation> <component> <transport> <priority> <address> <port> typ <type> …"
  const fields = candidate.candidate.split(' ');
  const address = candidate.address ?? fields[4];
  return {
    // Chrome reports IPv6 candidate addresses in brackets ("[2001:db8::1]"); HTTP lookups don't.
    address: address?.replace(/^\[(.*)\]$/, '$1').toLowerCase(),
    type: candidate.type ?? fields[7],
  };
}

function gatherCandidates() {
  if (typeof RTCPeerConnection !== 'function') return Promise.resolve(null);

  return new Promise((resolve) => {
    const candidates = [];
    let pc;
    const finish = () => {
      clearTimeout(timer);
      try { pc?.close(); } catch {}
      resolve(candidates);
    };
    // UDP to the STUN server may be blocked; gathering then never completes.
    const timer = setTimeout(finish, GATHER_TIMEOUT_MS);

    try {
      pc = new RTCPeerConnection({ iceServers: [{ urls: STUN_SERVER }] });
      pc.onicecandidate = (event) => {
        if (!event.candidate) return finish(); // null candidate = gathering complete
        if (event.candidate.candidate) candidates.push(parseCandidate(event.candidate));
      };
      pc.createDataChannel('probe');
      pc.createOffer().then((offer) => pc.setLocalDescription(offer)).catch(finish);
    } catch {
      finish();
    }
  });
}

async function probe() {
  const [candidates, httpIPs] = await Promise.all([gatherCandidates(), fetchPublicIPs()]);
  if (candidates === null) return { supported: false };

  const localIPs = new Set();
  const stunIPs = new Set();
  let mdnsHidden = false;

  for (const { address, type } of candidates) {
    if (!address) continue;
    if (address.endsWith('.local')) mdnsHidden = true;
    else if (type === 'host') localIPs.add(address);
    else if (type === 'srflx') stunIPs.add(address);
  }

  const leakedPublicIPs = [...stunIPs].filter((ip) => {
    const httpIP = ip.includes(':') ? httpIPs.v6 : httpIPs.v4;
    return httpIP !== null && !sameHost(ip, httpIP);
  });

  return {
    supported: true,
    localIPs: [...localIPs],
    stunIPs: [...stunIPs],
    mdnsHidden,
    leakedPublicIPs,
  };
}

/**
 * IPv4 must match exactly. IPv6 hosts rotate temporary (privacy-extension) addresses inside
 * their /64, so two connections from one machine can differ in the last 64 bits.
 */
function sameHost(a, b) {
  if (!a.includes(':')) return a === b;
  return ipv6Prefix64(a) === ipv6Prefix64(b);
}

function ipv6Prefix64(ip) {
  const [head, tail = ''] = ip.toLowerCase().split('::');
  const left = head ? head.split(':') : [];
  const right = tail ? tail.split(':') : [];
  const groups = ip.includes('::') ? [...left, ...Array(8 - left.length - right.length).fill('0'), ...right] : left;
  return groups.slice(0, 4).map((g) => parseInt(g, 16)).join(':');
}

let probePromise = null;

/** @returns {Promise<{supported: boolean, localIPs?: string[], stunIPs?: string[], mdnsHidden?: boolean, leakedPublicIPs?: string[]}>} */
export function probeWebRTC() {
  probePromise ??= probe();
  return probePromise;
}

/** Summary for the privacy card and the score: leaking = WebRTC reveals an address HTTP does not. */
export function webrtcLeakStatus(result) {
  const url = 'https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Protocols#ice';
  if (!result.supported) return { leaking: false, protected: true, row: { value: 'WebRTC Disabled', url } };
  if (result.leakedPublicIPs.length > 0) {
    return {
      leaking: true,
      protected: false,
      row: { value: `Leaking public IP ${result.leakedPublicIPs.join(', ')} (differs from HTTP IP)`, warning: true, url },
    };
  }
  if (result.localIPs.length > 0) {
    return { leaking: true, protected: false, row: { value: `Leaking local IP ${result.localIPs.join(', ')}`, warning: true, url } };
  }
  return { leaking: false, protected: true, row: { value: 'Protected (no extra IPs exposed)', url } };
}
