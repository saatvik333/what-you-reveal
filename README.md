<div align="center">
  <pre>
 __        ___   _    _  _____  __   _____  _   _   ____  _______     _______    _    _     
 \ \      / / | | |  / \|_   _| \ \ / / _ \| | | | |  _ \| ____\ \   / / ____|  / \  | |    
  \ \ /\ / /| |_| | / _ \ | |    \ V / | | | | | | | |_) |  _|  \ \ / /|  _|   / _ \ | |    
   \ V  V / |  _  |/ ___ \| |     | || |_| | |_| | |  _ <| |___  \ V / | |___ / ___ \| |___ 
    \_/\_/  |_| |_/_/   \_\_|     |_| \___/ \___/  |_| \_\_____|  \_/  |_____/_/   \_\_____|
  </pre>
  
  <p align="center">
    <strong>SYSTEM FINGERPRINTING // BROWSER ANALYSIS TOOL</strong>
  </p>
</div>

---

## 0x01 // ABOUT

**What You Reveal** visualises data exposed by modern web browsers.

Redesigned with a **minimalist black & white terminal aesthetic**, it focuses on speed, clarity, and deep data inspection. No external tracking. No data storage. Everything runs locally.

## 0x02 // MODULES

**NETWORK INTELLIGENCE**

- **Local Scan**: Instant detection of local IP leaks via WebRTC and latency pinging.
- **Server Scan**: Deep GeoIP analysis (ISP, Organization, ASN) and proxy/VPN detection.
- **Headers**: Full inspection of HTTP request headers.

**IDENTITY & FINGERPRINTING**

- **Canvas & WebGL**: Render hashes and GPU vendor/renderer identification.
- **System**: Font enumeration, screen properties, media devices, and battery status.
- **Privacy**: Detection of Incognito mode, automation (WebDriver), and Global Privacy Control.

**LOCALE**

- **Intl APIs**: Analysis of timezone, calendar, and numbering systems to pinpoint user origin.

## 0x03 // FEATURES

- **Dynamic Reports**: Generate comprehensive forensic text logs of all collected data.
- **Reactive UI**: Data streams in parallel; "Network Info" updates local stats instantly while server data loads.
- **Zero-CLS Design**: Architecture optimized to prevent layout shifts during loading.

## 0x04 // INSTALL & RUN

**Prerequisites**: Node.js 18+

```bash
# Clone
git clone https://github.com/saatvik333/what-you-reveal.git

# Install
cd what-you-reveal
npm install

# Development (Vite + Server)
npm run dev

# Production
npm run build
npm start
```

## 0x05 // DISCLAIMER

Educational tool for research purposes only.

> "Enter the matrix. Your browser is the gateway."
