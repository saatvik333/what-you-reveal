<div align="center">
  <pre>
 __        ___   _    _  _____  __   _____  _   _   ____  _______     _______    _    _     
 \ \      / / | | |  / \|_   _| \ \ / / _ \| | | | |  _ \| ____\ \   / / ____|  / \  | |    
  \ \ /\ / /| |_| | / _ \ | |    \ V / | | | | | | | |_) |  _|  \ \ / /|  _|   / _ \ | |    
   \ V  V / |  _  |/ ___ \| |     | || |_| | |_| | |  _ <| |___  \ V / | |___ / ___ \| |___ 
    \_/\_/  |_| |_/_/   \_\_|     |_| \___/ \___/  |_| \_\_____|  \_/  |_____/_/   \_\_____|
  </pre>
  
  <p align="center">
    <strong>A cinematographic system fingerprinting tool.</strong>
  </p>

  <p align="center">
    <a href="#features">Features</a> •
    <a href="#installation">Installation</a> •
    <a href="#disclaimer">Disclaimer</a>
  </p>
</div>

---

## 🕵️‍♂️ About

**What You Reveal** is an advanced browser fingerprinting and system analysis tool wrapped in a immersive, cinematic terminal interface. It demonstrates just how much information websites can collect about your device, network, and identity without your explicit permission.

Unlike standard "IP check" sites, this project focuses on **aesthetic presentation** and **deep data collection**, utilizing modern APIs like WebGL, WebRTC, Gamepad, Bluetooth, and Intl.

## ✨ Features

### 🔍 Deep System Analysis

- **Hardware Fingerprinting**: GPU model, memory estimation, battery status, CPU concurrency.
- **Identity & Tracking**: Canvas fingerprinting, AudioContext analysis, WebGL rendering hash.
- **Network Intelligence**: WebRTC local IP leaks, DNS/mDNS obfuscation detection, comprehensive GeoIP data.
- **Internationalization**: Deep locale analysis (timezone, currency, calendar, numbering systems) to pinpoint user location/origin.
- **Privacy Detection**: Detects Incognito/Private modes, Tor Browser, Brave, and Global Privacy Control (GPC) signals.
- **Font Enumeration**: Detects installed system fonts to infer Operating System (Windows vs macOS vs Linux).

### 🎨 Immersive UI

- **Realistic CRT Simulation**: Scanlines, chromatic aberration, screen currency/barrel distortion, and phosphor persistency.
- **Cinematic Boot Sequence**: Retro BIOS-style startup animation.
- **Responsive Layout**: Works on desktop and mobile (with adaptations for touch interfaces).

## 🛠️ Installation

```bash
# 1. Clone the repository
git clone https://github.com/saatvik333/what-you-reveal.git

# 2. Enter directory
cd what-you-reveal

# 3. Install dependencies
npm install
# or
pnpm install

# 4. Start the development server
npm start
```

Open your browser to `http://localhost:3000`.

## 🏗️ Tech Stack

- **Frontend**: Vanilla JavaScript (ES6 Modules), CSS Variables for theming.
- **Backend**: Node.js / Express (for IP, Header, and GeoIP proxying).
- **Styling**: Pure CSS with advanced filters (`feDisplacementMap`, `drop-shadow`) and fluid typography (`clamp()`).
- **No Frameworks**: Built without React/Vue for maximum performance and "close to the metal" feel.

## ⚠️ Disclaimer

This tool is for **educational and research purposes only**. It runs entirely locally or communicates only with its own backend. No data is stored, shared, or sold. The goal is to raise awareness about browser fingerprinting techniques.

---

> _"Enter the matrix. Your browser is the gateway."_
