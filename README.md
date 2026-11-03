```text

╦ ╦╦ ╦╔═╗╔╦╗  ╦ ╦╔═╗╦ ╦  ╦═╗╔═╗╦  ╦╔═╗╔═╗╦
║║║╠═╣╠═╣ ║   ╚╦╝║ ║║ ║  ╠╦╝║╣ ╚╗╔╝║╣ ╠═╣║
╚╩╝╩ ╩╩ ╩ ╩    ╩ ╚═╝╚═╝  ╩╚═╚═╝ ╚╝ ╚═╝╩ ╩╩═╝
```

### SYSTEM ANALYSIS TOOL // BROWSER FINGERPRINT DEMO

**What You Reveal** reads your browser the way tracking scripts do and shows the results:
15 groups of signals any website can collect without asking. Live at
[what-you-reveal.vercel.app](https://what-you-reveal.vercel.app/).

---

### >\_ WHAT IT CHECKS

- **Privacy score**: protections the page can observe (content blocker, canvas fingerprint protection, WebRTC, Global Privacy Control, VPN/Tor, private browsing, Brave) minus real exposure (WebRTC IP leak, automation). Every rule is in [`src/modules/privacy/score.js`](src/modules/privacy/score.js) and the in-app explanation is rendered from it.
- **Network**: public IPv4/IPv6, approximate IP location and ISP, timezone-vs-IP consistency, WebRTC local and STUN-reflected addresses, latency.
- **Fingerprints**: canvas, WebGL render, emoji, audio, speech voices, installed fonts (measured by text metrics), locale/Intl formatting.
- **Device and browser**: CPU, memory, battery, storage quota, paired USB/HID/serial devices, screen and color capabilities, Client Hints (real OS version), supported web APIs, media codecs and DRM, permissions, clipboard access, automation detection.

### >\_ WHERE YOUR DATA GOES

Fingerprint values are computed in the browser and never sent anywhere; the JSON report is generated locally. The only requests leaving the page are the ones needed to show your network identity, and each of these services sees your IP address:

| Service | Purpose |
| --- | --- |
| `api.ipify.org`, `api6.ipify.org` | Public IPv4 / IPv6 |
| `ipapi.co`, falling back to `get.geojs.io` | IP location, ISP, ASN |
| `onionoo.torproject.org` | Is your IP a Tor exit relay? |
| `stun.cloudflare.com` (STUN, UDP) | Which public IP WebRTC exposes |

The production Content-Security-Policy in [`vercel.json`](vercel.json) allows no other connections.

### >\_ DEVELOPMENT

```bash
git clone https://github.com/saatvik333/what-you-reveal.git
cd what-you-reveal
bun install
bun run dev      # Vite dev server
bun run test     # node:test suites in tests/
bun run lint     # ESLint (src, tests, config)
bun run build    # production build in dist/
```

The version lives only in `package.json`; the header and the HTML structured data read it at build time.

---

> **DISCLAIMER**: This tool is for **educational purposes only**. Detection is heuristic: a protection that is not detected may still be active, and fingerprinting scripts in the wild use more signals than shown here.
