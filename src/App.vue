<script setup>
import { ref, computed, provide, onMounted } from 'vue';
import TheHeader from "./components/TheHeader.vue";
import TerminalCard from "./components/TerminalCard.vue";
import TerminalDataGrid from "./components/TerminalDataGrid.vue";
import PrivacyTipsPopup from "./components/PrivacyTipsPopup.vue";
import ScorePhilosophyPopup from "./components/ScorePhilosophyPopup.vue";
import { collectClipboardData } from "./modules/system/clipboard";
import { collectHardwareData } from "./modules/system/hardware";
import { collectScreenData } from "./modules/system/screen";
import { collectPermissionsData } from "./modules/system/permissions";
import { collectMediaDevices } from "./modules/system/media_devices";
import { collectMediaCodecs } from "./modules/system/media_codecs";
import { collectClientHints } from "./modules/system/client_hints";
import { collectIntlData } from "./modules/fingerprint/intl";
import { detectBot } from "./modules/fingerprint/integrity";
import { collectNetworkData } from "./modules/network/network";
import { collectNavigatorData } from "./modules/system/navigator";
import { collectFontData } from "./modules/fingerprint/fonts";
import { collectWebGLData } from "./modules/fingerprint/webgl";
import { collectFingerprintData } from "./modules/fingerprint/identity";
import { collectTorData } from "./modules/privacy/tor";

// Error sentinel value used to distinguish failed loads from pending (null)
const ERROR = Symbol('error');

const clipboardData = ref(null);
const hardwareData = ref(null);
const screenData = ref(null);
const permissionsData = ref(null);
const mediaDeviceData = ref(null);
const mediaCodecData = ref(null);
const clientHintsData = ref(null);
const intlData = ref(null);
const integrityData = ref(null);
const networkData = ref(null);
const navigatorData = ref(null);
const fontData = ref(null);
const webglData = ref(null);
const identityData = ref(null);
const privacyData = ref(null);
const showPrivacyTips = ref(false);
const showScorePhilosophy = ref(false);

function isError(val) {
  return val === ERROR;
}

function collectWithErrorHandling(collectFn, target) {
  collectFn()
    .then(d => target.value = d)
    .catch(() => target.value = ERROR);
}

// Provide all collected data to children (for download)
const collectedData = computed(() => {
  const cards = {
    '0. PRIVACY_MODE': privacyData.value,
    '1. NETWORK_INFO': networkData.value,
    '2. DEVICE_CORE': hardwareData.value,
    '3. SCREEN_INFO': screenData.value,
    '4. CLIENT_HINTS': clientHintsData.value,
    '5. NAVIGATOR_VARS': navigatorData.value,
    '6. INTL_FINGERPRINT': intlData.value,
    '7. FONTS_FINGERPRINT': fontData.value,
    '8. WEBGL_RENDERER': webglData.value,
    '9. DIGITAL_IDENTITY': identityData.value,
    '10. MEDIA_DEVICES': mediaDeviceData.value,
    '11. MEDIA_CODECS': mediaCodecData.value,
    '12. PERMISSIONS_CHECK': permissionsData.value,
    '13. CLIPBOARD_ACCESS': clipboardData.value,
    '14. INTEGRITY_CHECK': integrityData.value,
  };

  const result = {};
  for (const [title, data] of Object.entries(cards)) {
    if (data && data !== ERROR) {
      const cardData = {};
      for (const [key, val] of Object.entries(data)) {
        cardData[key] = (val && typeof val === 'object' && 'value' in val) ? val.value : val;
      }
      result[title] = cardData;
    }
  }
  return result;
});

provide('collectedData', collectedData);

onMounted(() => {
  // Execute all checks in parallel to prevent blocking
  collectWithErrorHandling(collectClipboardData, clipboardData);
  collectWithErrorHandling(collectHardwareData, hardwareData);
  collectWithErrorHandling(collectScreenData, screenData);
  collectWithErrorHandling(collectPermissionsData, permissionsData);
  collectWithErrorHandling(collectMediaDevices, mediaDeviceData);
  collectWithErrorHandling(collectMediaCodecs, mediaCodecData);
  collectWithErrorHandling(collectClientHints, clientHintsData);
  collectWithErrorHandling(collectIntlData, intlData);
  integrityData.value = detectBot(); // Sync
  collectWithErrorHandling(collectNavigatorData, navigatorData);
  collectWithErrorHandling(collectFontData, fontData);
  collectWithErrorHandling(collectWebGLData, webglData);
  collectWithErrorHandling(collectFingerprintData, identityData);
  collectWithErrorHandling(collectTorData, privacyData);

  // Start network collection (accepts callback for updates)
  collectNetworkData((newData) => {
      networkData.value = newData;
  }).then(d => networkData.value = d).catch(() => networkData.value = ERROR);
});

function handlePrivacyAction(actionName) {
  if (actionName === 'enhance') {
    showPrivacyTips.value = true;
  } else if (actionName === 'scoring') {
    showScorePhilosophy.value = true;
  }
}
</script>

<template>
  <div class="container">
    <TheHeader />
    
    <PrivacyTipsPopup :isOpen="showPrivacyTips" @close="showPrivacyTips = false" />
    <ScorePhilosophyPopup :isOpen="showScorePhilosophy" @close="showScorePhilosophy = false" />

    <main class="grid">
      <!-- Privacy & Network -->
      <TerminalCard title="0. PRIVACY_MODE">
        <TerminalDataGrid
          v-if="privacyData && !isError(privacyData)"
          :data="privacyData"
          @action="handlePrivacyAction"
        />
        <pre v-else-if="isError(privacyData)" class="error-msg">[ERR] Unable to check privacy status</pre>
        <pre v-else class="loading-msg">Checking Tor network status...</pre>
      </TerminalCard>

      <TerminalCard title="1. NETWORK_INFO">
        <TerminalDataGrid v-if="networkData && !isError(networkData)" :data="networkData" />
        <pre v-else-if="isError(networkData)" class="error-msg">[ERR] Network scan failed</pre>
        <pre v-else class="loading-msg">Scanning network environment...</pre>
      </TerminalCard>

      <!-- Hardware & Display -->
      <TerminalCard title="2. DEVICE_CORE">
        <TerminalDataGrid v-if="hardwareData && !isError(hardwareData)" :data="hardwareData" />
        <pre v-else-if="isError(hardwareData)" class="error-msg">[ERR] Hardware scan failed</pre>
        <pre v-else class="loading-msg">Scanning hardware...</pre>
      </TerminalCard>

      <TerminalCard title="3. SCREEN_INFO">
        <TerminalDataGrid v-if="screenData && !isError(screenData)" :data="screenData" />
        <pre v-else-if="isError(screenData)" class="error-msg">[ERR] Display analysis failed</pre>
        <pre v-else class="loading-msg">Analyzing display...</pre>
      </TerminalCard>

      <!-- Browser & User Agent -->
      <TerminalCard title="4. CLIENT_HINTS">
        <TerminalDataGrid v-if="clientHintsData && !isError(clientHintsData)" :data="clientHintsData" />
        <pre v-else-if="isError(clientHintsData)" class="error-msg">[ERR] Client hints unavailable</pre>
        <pre v-else class="loading-msg">Analyzing User Agent Data...</pre>
      </TerminalCard>

      <TerminalCard title="5. NAVIGATOR_VARS">
        <TerminalDataGrid v-if="navigatorData && !isError(navigatorData)" :data="navigatorData" />
        <pre v-else-if="isError(navigatorData)" class="error-msg">[ERR] Navigator read failed</pre>
        <pre v-else class="loading-msg">Reading headers...</pre>
      </TerminalCard>

      <!-- Fingerprinting -->
      <TerminalCard title="6. INTL_FINGERPRINT">
        <TerminalDataGrid v-if="intlData && !isError(intlData)" :data="intlData" />
        <pre v-else-if="isError(intlData)" class="error-msg">[ERR] Intl fingerprint failed</pre>
        <pre v-else class="loading-msg">Calculating locale fingerprint...</pre>
      </TerminalCard>

      <TerminalCard title="7. FONTS_FINGERPRINT">
        <TerminalDataGrid v-if="fontData && !isError(fontData)" :data="fontData" />
        <pre v-else-if="isError(fontData)" class="error-msg">[ERR] Font scan failed</pre>
        <pre v-else class="loading-msg">Scanning font library...</pre>
      </TerminalCard>

      <!-- Graphics & Identity -->
      <TerminalCard title="8. WEBGL_RENDERER">
        <TerminalDataGrid v-if="webglData && !isError(webglData)" :data="webglData" />
        <pre v-else-if="isError(webglData)" class="error-msg">[ERR] WebGL unavailable</pre>
        <pre v-else class="loading-msg">Initializing WebGL context...</pre>
      </TerminalCard>

      <TerminalCard title="9. DIGITAL_IDENTITY">
        <TerminalDataGrid v-if="identityData && !isError(identityData)" :data="identityData" />
        <pre v-else-if="isError(identityData)" class="error-msg">[ERR] Fingerprint generation failed</pre>
        <pre v-else class="loading-msg">Generating digital fingerprint...</pre>
      </TerminalCard>

      <!-- Media -->
      <TerminalCard title="10. MEDIA_DEVICES">
        <TerminalDataGrid v-if="mediaDeviceData && !isError(mediaDeviceData)" :data="mediaDeviceData" />
        <pre v-else-if="isError(mediaDeviceData)" class="error-msg">[ERR] Device enumeration failed</pre>
        <pre v-else class="loading-msg">Enumerating devices...</pre>
      </TerminalCard>

      <TerminalCard title="11. MEDIA_CODECS">
        <TerminalDataGrid v-if="mediaCodecData && !isError(mediaCodecData)" :data="mediaCodecData" />
        <pre v-else-if="isError(mediaCodecData)" class="error-msg">[ERR] Codec check failed</pre>
        <pre v-else class="loading-msg">Checking codecs...</pre>
      </TerminalCard>

      <!-- Access & Permissions -->
      <TerminalCard title="12. PERMISSIONS_CHECK">
        <TerminalDataGrid v-if="permissionsData && !isError(permissionsData)" :data="permissionsData" />
        <pre v-else-if="isError(permissionsData)" class="error-msg">[ERR] Permission query failed</pre>
        <pre v-else class="loading-msg">Querying permissions...</pre>
      </TerminalCard>

      <TerminalCard title="13. CLIPBOARD_ACCESS">
        <TerminalDataGrid v-if="clipboardData && !isError(clipboardData)" :data="clipboardData" />
        <pre v-else-if="isError(clipboardData)" class="error-msg">[ERR] Clipboard check failed</pre>
        <pre v-else class="loading-msg">Checking clipboard permissions...</pre>
      </TerminalCard>

      <!-- Security -->
      <TerminalCard title="14. INTEGRITY_CHECK">
        <TerminalDataGrid v-if="integrityData && !isError(integrityData)" :data="integrityData" />
        <pre v-else-if="isError(integrityData)" class="error-msg">[ERR] Integrity scan failed</pre>
        <pre v-else class="loading-msg">Scanning environment...</pre>
      </TerminalCard>

    </main>

    <footer>
      <span class="prompt">user@what-you-reveal:~$</span>
      <span id="log-line">System ready. Waiting for modules...</span
      ><span class="cursor"></span>
    </footer>
  </div>
</template>

<style scoped>
footer {
  padding: var(--spacing-md) 0;
  border-top: 1px solid var(--border);
  font-size: var(--font-size-sm);
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  margin-top: var(--spacing-lg);
}

.prompt {
  color: var(--fg-dim);
}

.prompt::before {
  content: ">";
  margin-right: 0.5ch;
  color: var(--fg-muted);
}

#log-line {
  color: var(--fg);
}

.cursor {
  display: inline-block;
  width: 0.6em;
  height: 1em;
  background: var(--fg);
  margin-left: 0.25em;
  animation: blink 1s step-end infinite;
  vertical-align: text-bottom;
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}

.privacy-actions {
  display: flex;
  gap: 1ch;
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--border);
}

.action-btn {
  background: none;
  border: none;
  color: var(--fg-dim);
  font-family: inherit;
  font-size: inherit;
  cursor: pointer;
  padding: 0;
}

.action-btn:hover {
  color: var(--fg);
}

.loading-msg {
  color: var(--fg-dim);
  animation: pulse 2s ease-in-out infinite;
}

.error-msg {
  color: var(--warning);
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
</style>
