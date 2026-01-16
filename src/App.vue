<script setup>
import { ref, onMounted } from 'vue';
import TheHeader from "./components/TheHeader.vue";
import TerminalCard from "./components/TerminalCard.vue";
import TerminalDataGrid from "./components/TerminalDataGrid.vue";
import { collectClipboardData } from "./modules/system/clipboard";
import { collectHardwareData } from "./modules/system/hardware";

const clipboardData = ref(null);
const hardwareData = ref(null);

onMounted(async () => {
  clipboardData.value = await collectClipboardData();
  hardwareData.value = await collectHardwareData();
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
        <pre>Initializing scan...</pre>
      </TerminalCard>

      <TerminalCard title="2. DEVICE_CORE">
        <TerminalDataGrid v-if="hardwareData" :data="hardwareData" />
        <pre v-else>Scanning hardware...</pre>
      </TerminalCard>

      <TerminalCard title="3. NAVIGATOR_VARS">
        <pre>Reading headers...</pre>
      </TerminalCard>

      <TerminalCard title="4. SCREEN_BUFFER">
        <pre>Measuring viewport...</pre>
      </TerminalCard>


      <TerminalCard title="5. CLIPBOARD_ACCESS">
        <TerminalDataGrid v-if="clipboardData" :data="clipboardData" />
        <pre v-else>Checking permissions...</pre>
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
