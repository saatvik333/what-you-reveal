<script setup>
import { computed, onMounted, ref, shallowReactive } from 'vue';
import TheHeader from './components/TheHeader.vue';
import ScanSummary from './components/ScanSummary.vue';
import TerminalCard from './components/TerminalCard.vue';
import TerminalDataGrid from './components/TerminalDataGrid.vue';
import PrivacyTipsPopup from './components/PrivacyTipsPopup.vue';
import ScorePhilosophyPopup from './components/ScorePhilosophyPopup.vue';
import { collectPrivacyData } from './modules/privacy/privacy.js';
import { collectNetworkData } from './modules/network/network.js';
import { collectHardwareData } from './modules/system/hardware.js';
import { collectScreenData } from './modules/system/screen.js';
import { collectClientHints } from './modules/system/client_hints.js';
import { collectNavigatorData } from './modules/system/navigator.js';
import { collectIntlData } from './modules/fingerprint/intl.js';
import { collectFontData } from './modules/fingerprint/fonts.js';
import { collectWebGLData } from './modules/fingerprint/webgl.js';
import { collectFingerprintData } from './modules/fingerprint/identity.js';
import { collectMediaDevices } from './modules/system/media_devices.js';
import { collectMediaCodecs } from './modules/system/media_codecs.js';
import { collectPermissionsData } from './modules/system/permissions.js';
import { collectClipboardData } from './modules/system/clipboard.js';
import { detectBot } from './modules/fingerprint/integrity.js';

// One entry per card, in display order. `collect(onUpdate)` resolves with the card's rows;
// collectors that fill in gradually also call onUpdate with partial rows.
const CARDS = [
  { title: '0. PRIVACY_MODE', group: 'privacy', collect: collectPrivacyData, loading: 'Checking Tor, VPN, WebRTC and browser protections...', error: 'Privacy checks failed' },
  { title: '1. NETWORK_INFO', group: 'privacy', collect: collectNetworkData, loading: 'Scanning network environment...', error: 'Network scan failed' },
  { title: '2. DEVICE_CORE', group: 'device', collect: collectHardwareData, loading: 'Scanning hardware...', error: 'Hardware scan failed' },
  { title: '3. SCREEN_INFO', group: 'device', collect: collectScreenData, loading: 'Analyzing display...', error: 'Display analysis failed' },
  { title: '4. CLIENT_HINTS', group: 'device', collect: collectClientHints, loading: 'Reading User-Agent Client Hints...', error: 'Client hints unavailable' },
  { title: '5. NAVIGATOR_VARS', group: 'device', collect: collectNavigatorData, loading: 'Probing browser APIs...', error: 'Navigator read failed' },
  { title: '6. INTL_FINGERPRINT', group: 'fingerprint', collect: collectIntlData, loading: 'Calculating locale fingerprint...', error: 'Intl fingerprint failed' },
  { title: '7. FONTS_FINGERPRINT', group: 'fingerprint', collect: collectFontData, loading: 'Measuring installed fonts...', error: 'Font scan failed' },
  { title: '8. WEBGL_RENDERER', group: 'fingerprint', collect: collectWebGLData, loading: 'Initializing WebGL context...', error: 'WebGL unavailable' },
  { title: '9. DIGITAL_IDENTITY', group: 'fingerprint', collect: collectFingerprintData, loading: 'Generating digital fingerprint...', error: 'Fingerprint generation failed' },
  { title: '10. MEDIA_DEVICES', group: 'access', collect: collectMediaDevices, loading: 'Enumerating devices...', error: 'Device enumeration failed' },
  { title: '11. MEDIA_CODECS', group: 'access', collect: collectMediaCodecs, loading: 'Checking codecs and DRM...', error: 'Codec check failed' },
  { title: '12. PERMISSIONS_CHECK', group: 'access', collect: collectPermissionsData, loading: 'Querying permissions...', error: 'Permission query failed' },
  { title: '13. CLIPBOARD_ACCESS', group: 'access', collect: collectClipboardData, loading: 'Checking clipboard access...', error: 'Clipboard check failed' },
  { title: '14. INTEGRITY_CHECK', group: 'access', collect: async () => detectBot(), loading: 'Scanning for automation...', error: 'Integrity scan failed' },
].map((card, index) => ({ ...card, index, anchor: card.title.replace(/^\d+\.\s*/, '').toLowerCase().replaceAll('_', '-') }));

const GROUPS = [
  { id: 'privacy', title: 'PRIVACY & NETWORK', note: 'Who can see you, and from where' },
  { id: 'device', title: 'DEVICE & BROWSER', note: 'Hardware, display and browser details any script can read' },
  { id: 'fingerprint', title: 'FINGERPRINTS', note: 'Rendering and locale quirks that combine into a stable ID' },
  { id: 'access', title: 'MEDIA, PERMISSIONS & AUTOMATION', note: 'Devices, codecs, granted access and bot checks' },
].map((group) => ({ ...group, cards: CARDS.filter((card) => card.group === group.id) }));

// results[i]: null = nothing yet, ERROR = collector rejected, object = rows (possibly partial).
const ERROR = Symbol('error');
const results = shallowReactive(CARDS.map(() => null));
const done = shallowReactive(CARDS.map(() => false));
const finished = computed(() => done.filter(Boolean).length);

const isRows = (value) => value !== null && value !== ERROR;
const cardState = (i) => (results[i] === ERROR ? 'error' : done[i] ? 'done' : 'loading');
const flaggedLabels = (i) => (isRows(results[i])
  ? Object.entries(results[i]).filter(([, row]) => row?.warning).map(([label]) => label)
  : []);

onMounted(() => {
  CARDS.forEach((card, i) => {
    card.collect((partial) => { results[i] = partial; })
      .then((rows) => { results[i] = rows; })
      .catch((error) => {
        console.error(`${card.title} failed:`, error);
        results[i] = ERROR;
      })
      .finally(() => { done[i] = true; });
  });
});

const score = computed(() => (done[0] && isRows(results[0]) ? results[0]['Privacy Score']?.summary ?? null : null));
const flagged = computed(() => CARDS
  .map((card, i) => ({ anchor: card.anchor, title: card.title, labels: done[i] ? flaggedLabels(i) : [] }))
  .filter((card) => card.labels.length > 0));

// Downloaded report: the values exactly as shown, without links or UI hints.
const report = computed(() => Object.fromEntries(
  CARDS.flatMap((card, i) => {
    const rows = results[i];
    if (!isRows(rows)) return [];
    return [[card.title, Object.fromEntries(Object.entries(rows).map(([label, row]) =>
      [label, row !== null && typeof row === 'object' ? row.value : row]))]];
  }),
));

const tipsOpen = ref(false);
const scoringOpen = ref(false);
</script>

<template>
  <div class="container">
    <TheHeader :report="report" />

    <PrivacyTipsPopup :open="tipsOpen" :factors="score?.factors ?? null" @close="tipsOpen = false" />
    <ScorePhilosophyPopup :open="scoringOpen" @close="scoringOpen = false" />

    <main id="main" tabindex="-1">
      <ScanSummary
        :score="score"
        :finished="finished"
        :total="CARDS.length"
        :flagged="flagged"
        @tips="tipsOpen = true"
        @scoring="scoringOpen = true"
      />

      <section v-for="group in GROUPS" :key="group.id" class="group" :aria-labelledby="`group-${group.id}`">
        <div class="group-heading">
          <h2 :id="`group-${group.id}`" class="section-title">{{ group.title }}</h2>
          <p>{{ group.note }}</p>
        </div>
        <div class="grid">
          <TerminalCard
            v-for="card in group.cards"
            :key="card.title"
            :title="card.title"
            :anchor="card.anchor"
            :state="cardState(card.index)"
            :flagged="flaggedLabels(card.index).length"
          >
            <TerminalDataGrid v-if="isRows(results[card.index])" :data="results[card.index]" />
            <p v-else-if="results[card.index] === ERROR" class="error-msg">[ERR] {{ card.error }}</p>
            <p v-else class="loading-msg">{{ card.loading }}</p>
          </TerminalCard>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
main:focus {
  outline: none;
}

.group + .group {
  margin-top: var(--spacing-lg);
}

.group-heading {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0 2ch;
  margin-bottom: 0.75rem;
}

.group-heading p {
  color: var(--fg-dim);
  font-size: var(--font-size-sm);
}

.loading-msg {
  color: var(--fg-dim);
  padding: 0.35rem 0;
}

.error-msg {
  color: var(--warning);
  padding: 0.35rem 0;
}

</style>
