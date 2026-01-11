```
 __        ___   _    _  _____  __   _____  _   _   ____  _______     _______    _    _     
 \ \      / / | | |  / \|_   _| \ \ / / _ \| | | | |  _ \| ____\ \   / / ____|  / \  | |    
  \ \ /\ / /| |_| | / _ \ | |    \ V / | | | | | | | |_) |  _|  \ \ / /|  _|   / _ \ | |    
   \ V  V / |  _  |/ ___ \| |     | || |_| | |_| | |  _ <| |___  \ V / | |___ / ___ \| |___ 
    \_/\_/  |_| |_/_/   \_\_|     |_| \___/ \___/  |_| \_\_____|  \_/  |_____/_/   \_\_____|
    
```

> "Enter the matrix. Your browser is the gateway."

A **hacker‑styled** single‑page web app that visualises the data your browser exposes. All UI is rendered in a **green‑on‑black CRT terminal** with scan‑line, glitch, and boot‑sequence effects.

## Features

- **Boot sequence** – authentic dmesg‑style logs using real browser data (`navigator.hardwareConcurrency`, `navigator.deviceMemory`, `navigator.userAgent`, network connection, etc.).
- **Fingerprinting** – Canvas, AudioContext, and a composite Device ID.
- **ASCII tables** – filtered to hide unknown/unsupported values.
- **CRT overlay** – covers the whole page while scrolling.
- **Glitchy headers** and a **blinking cursor** for that vintage mainframe feel.
- **No fade transition** – the boot screen disappears instantly with `$ clear`.

## Prerequisites

- Node.js (v12+)
- npm

## Installation

```bash
npm install
```

## Usage

```bash
npm start
```

Open your browser and navigate to `http://localhost:3000`.

## Notes

- Some data (battery, detailed network) may be unavailable depending on the browser and permissions.
- Geolocation is fetched via `ip‑api.com` based on your public IP.

---

_Enjoy the hack!_

This is a simple web application that displays all the information it can gather about you just by you visiting the page. It demonstrates what data is exposed via browser APIs and HTTP request headers.

## Features

- **Network & Location:** IP address, ISP, location (City, Country, Coordinates), and local time.
- **Device & OS:** Operating System, Browser type and version, Device model (if available), and CPU architecture.
- **Browser Info:** detailed browser capabilities, cookies status, Do Not Track setting, and connection speed.
- **Screen & Window:** Screen resolution, available screen size, window size, and pixel depth.
- **Battery & Hardware:** Battery level and status (if supported), CPU logical cores, and device memory.
- **Graphics (WebGL):** GPU vendor and renderer information.
- **Request Headers:** Full list of HTTP headers sent by your browser.

## Prerequisites

- Node.js (v12 or higher)
- npm

## Installation

1.  Install dependencies:
    ```bash
    npm install
    ```

## Usage

1.  Start the server:
    ```bash
    npm start
    ```
2.  Open your browser and navigate to:
    ```
    http://localhost:3000
    ```

## Notes

- Some information (like Battery status or detailed Network info) might not be available in all browsers or may require specific permissions/contexts (though this app attempts to fetch what is available passively).
- Geolocation data is fetched using a free external API (ip-api.com) and is based on your public IP address.
