```
 __        ___   _    _  _____  __   _____  _   _   ____  _______     _______    _    _     
 \ \      / / | | |  / \|_   _| \ \ / / _ \| | | | |  _ \| ____\ \   / / ____|  / \  | |    
  \ \ /\ / /| |_| | / _ \ | |    \ V / | | | | | | | |_) |  _|  \ \ / /|  _|   / _ \ | |    
   \ V  V / |  _  |/ ___ \| |     | || |_| | |_| | |  _ <| |___  \ V / | |___ / ___ \| |___ 
    \_/\_/  |_| |_/_/   \_\_|     |_| \___/ \___/  |_| \_\_____|  \_/  |_____/_/   \_\_____|
    
```

> "Enter the matrix. Your browser is the gateway."

A **hacker‑styled** single‑page web app that visualises the data your browser exposes. All UI is rendered in a **green‑on‑black CRT terminal** with scan‑line, glitch, and boot‑sequence effects.

## Prerequisites

- Node.js (v12+)
- pnpm

## Usage

```bash
#install deps
pnpm install
# run locally
pnpm start
```

Open your browser and navigate to `http://localhost:3000`.

## Notes

- Some data (battery, detailed network) may be unavailable depending on the browser and permissions.
- Geolocation is fetched via `ip‑api.com` based on your public IP.
