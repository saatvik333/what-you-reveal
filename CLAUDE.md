# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**What You Reveal** is a client-side browser fingerprinting and privacy analysis tool built with Vue 3 + Vite. It collects browser, hardware, network, and privacy data to educate users about their digital footprint. All analysis runs locally in the browser — no server-side tracking.

## Commands

```bash
bun install          # Install dependencies
bun run dev          # Start Vite dev server
bun run build        # Production build
bun run preview      # Preview production build locally
bun run lint         # Check code style (ESLint)
bun run lint:fix     # Auto-fix lint issues
```

No test framework is configured.

## Architecture

### Data Collection Pipeline

The app follows a parallel async data collection pattern:

1. `App.vue` is the orchestrator — its `onMounted()` triggers 16+ collection functions in parallel
2. Each module in `src/modules/` exports an async function that returns an object of key-value data points
3. Results update Vue reactive refs, which conditionally render `TerminalCard` components
4. Network module (`network.js`) supports incremental updates via callback

### Module Organization (`src/modules/`)

- **`fingerprint/`** — Canvas, audio, emoji, voice, WebGL, font, and Intl API fingerprinting; bot/automation detection
- **`network/`** — IP detection, GeoIP (via ipapi.co), latency measurement, connection info
- **`privacy/`** — DNT, GPC, ad blocker detection, WebRTC leak detection, Tor detection
- **`system/`** — Navigator APIs, hardware (CPU/GPU/battery/memory), screen, client hints, media devices/codecs, permissions, clipboard

### Data Point Format

Module functions return objects where values can be:
- Simple strings/numbers
- Objects with `{ value, url, warning, action, actionLabel, element }` — `url` typically links to MDN docs

### Component Hierarchy

```
App.vue (data collection orchestrator, 15 card layout)
├── TheHeader.vue (ASCII logo, download/GitHub controls)
├── TerminalCard.vue × 15 (terminal-styled card wrapper, hover scramble animation)
│   └── TerminalDataGrid.vue (renders key-value data pairs with optional links/actions)
├── PrivacyTipsPopup.vue (modal)
└── ScorePhilosophyPopup.vue (modal)
```

### Utilities

- `src/utils/crypto.js` — SHA-256 hashing and cyrb53 mixing hash for fingerprint generation

### Styling

Terminal/retro aesthetic using CSS custom properties defined in `src/assets/styles/variables.css`. Monospace font (JetBrains Mono), dark theme. Two-column responsive grid layout.

## Deployment

Deployed on Vercel. Config in `vercel.json` includes security headers (CSP, X-Frame-Options), SPA routing, and 1-year static asset caching. Build uses `bun run build`.

## Code Conventions

- Vue 3 Composition API with `<script setup>` syntax
- Plain JavaScript (TypeScript configured but not widely used in source)
- ESLint flat config (v9+) with Vue and TypeScript plugins
- Unused variables allowed with underscore prefix (`_var`)
- Browser API globals extensively defined in ESLint config
