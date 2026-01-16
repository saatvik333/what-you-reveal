<script setup>
import { ref, onMounted } from 'vue';
import TheHeader from "./components/TheHeader.vue";
import TerminalCard from "./components/TerminalCard.vue";
import TerminalDataGrid from "./components/TerminalDataGrid.vue";
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

onMounted(async () => {
  clipboardData.value = await collectClipboardData();
  hardwareData.value = await collectHardwareData();
  screenData.value = await collectScreenData();
  permissionsData.value = await collectPermissionsData();
  mediaDeviceData.value = await collectMediaDevices();
  mediaCodecData.value = await collectMediaCodecs();
  clientHintsData.value = await collectClientHints();
  intlData.value = await collectIntlData();
  integrityData.value = detectBot();
  navigatorData.value = await collectNavigatorData();
  fontData.value = await collectFontData();
  webglData.value = await collectWebGLData();
  
  // Start network collection (accepts callback for updates)
  networkData.value = await collectNetworkData((newData) => {
      networkData.value = newData;
  });
});
</script>

<template>
  <div class="container">
    <TheHeader />

    <main class="grid">
      <TerminalCard title="0. PRIVACY_MODE">
        <pre>Analyzing storage...</pre>
      </TerminalCard>

      <TerminalCard title="1. NETWORK_INFO">
        <TerminalDataGrid v-if="networkData" :data="networkData" />
        <pre v-else>Scanning network environment...</pre>
      </TerminalCard>

      <TerminalCard title="2. DEVICE_CORE">
        <TerminalDataGrid v-if="hardwareData" :data="hardwareData" />
        <pre v-else>Scanning hardware...</pre>
      </TerminalCard>

      <TerminalCard title="3. SCREEN_INFO">
        <TerminalDataGrid v-if="screenData" :data="screenData" />
        <pre v-else>Analyzing display...</pre>
      </TerminalCard>

      <TerminalCard title="4. PERMISSIONS_CHECK">
        <TerminalDataGrid v-if="permissionsData" :data="permissionsData" />
        <pre v-else>Querying permissions...</pre>
      </TerminalCard>

      <TerminalCard title="5. MEDIA_DEVICES">
        <TerminalDataGrid v-if="mediaDeviceData" :data="mediaDeviceData" />
        <pre v-else>Enumerating devices...</pre>
      </TerminalCard>

      <TerminalCard title="6. MEDIA_CODECS">
        <TerminalDataGrid v-if="mediaCodecData" :data="mediaCodecData" />
        <pre v-else>Checking codecs...</pre>
      </TerminalCard>

      <TerminalCard title="7. CLIENT_HINTS">
        <TerminalDataGrid v-if="clientHintsData" :data="clientHintsData" />
        <pre v-else>Analyzing User Agent Data...</pre>
      </TerminalCard>

      <TerminalCard title="8. INTL_FINGERPRINT">
        <TerminalDataGrid v-if="intlData" :data="intlData" />
        <pre v-else>Calculating locale fingerprint...</pre>
      </TerminalCard>

      <TerminalCard title="9. INTEGRITY_CHECK">
        <TerminalDataGrid v-if="integrityData" :data="integrityData" />
        <pre v-else>Scanning environment...</pre>
      </TerminalCard>

      <TerminalCard title="10. NAVIGATOR_VARS">
        <TerminalDataGrid v-if="navigatorData" :data="navigatorData" />
        <pre v-else>Reading headers...</pre>
      </TerminalCard>

      <TerminalCard title="11. FONTS_FINGERPRINT">
        <TerminalDataGrid v-if="fontData" :data="fontData" />
        <pre v-else>Scanning font library...</pre>
      </TerminalCard>

      <TerminalCard title="12. WEBGL_RENDERER">
        <TerminalDataGrid v-if="webglData" :data="webglData" />
        <pre v-else>Initializing WebGL context...</pre>
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
</style>
