<script setup>
import { ref, onUnmounted, watch } from 'vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['close']);

// Handle Escape key to close popup
function handleKeydown(e) {
  if (e.key === 'Escape') {
    close();
  }
}

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    document.addEventListener('keydown', handleKeydown);
  } else {
    document.removeEventListener('keydown', handleKeydown);
  }
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
});

function close() {
  emit('close');
}
</script>

<template>
  <Teleport to="body">
    <div v-if="isOpen" class="popup-overlay" @click.self="close">
      <div class="popup-container">
        <div class="popup-header">
          <span class="prompt">root@privacy:~#</span>
          <span class="title">score_philosophy.txt</span>
          <button class="close-btn" @click="close">[X]</button>
        </div>
        
        <div class="popup-content">
          <div class="intro">
            <pre>$ cat score_philosophy.txt</pre>
          </div>
          
          <div class="philosophy">
            <h3>Privacy Score Calculation</h3>
            
            <div class="section">
              <h4>Base Score: 30</h4>
              <p>Starting point - unprotected browsing is risky</p>
            </div>
            
            <div class="section">
              <h4>Bonuses (Active Protections)</h4>
              <table>
                <tr><td>Ad Blocker Active</td><td>+15</td></tr>
                <tr><td>WebRTC Protected</td><td>+15</td></tr>
                <tr><td>Global Privacy Control</td><td>+10</td></tr>
                <tr><td>Storage Partitioned</td><td>+10</td></tr>
                <tr><td>VPN/Proxy Detected</td><td>+10</td></tr>
                <tr><td>Tor Network</td><td>+10</td></tr>
                <tr><td>Private Browsing</td><td>+5</td></tr>
                <tr><td>Do Not Track</td><td>+5</td></tr>
                <tr><td>Brave Shields</td><td>+5</td></tr>
              </table>
            </div>
            
            <div class="section">
              <h4>Penalties (Privacy Risks)</h4>
              <table>
                <tr><td>WebRTC Leaking IP</td><td>-15</td></tr>
                <tr><td>WebDriver Detected</td><td>-10</td></tr>
                <tr><td>GPC Explicitly Disabled</td><td>-5</td></tr>
                <tr><td>DNT Explicitly Disabled</td><td>-5</td></tr>
              </table>
            </div>
            
            <div class="section philosophy-note">
              <h4>Philosophy</h4>
              <p>We <strong>reward protections</strong>, not punish defaults.</p>
              <p>Not having an ad blocker = neutral (0), not a penalty.</p>
              <p>Only actual <strong>risks/leaks</strong> are penalized.</p>
            </div>
          </div>
          
          <div class="footer">
            <pre>$ exit</pre>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.popup-container {
  background: var(--bg);
  border: 1px solid var(--fg-dim);
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 0 30px rgba(0, 255, 0, 0.1);
}

.popup-header {
  display: flex;
  align-items: center;
  gap: 1ch;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid var(--border);
  background: var(--bg-dim);
}

.prompt {
  color: var(--fg-dim);
}

.title {
  color: var(--fg);
  flex: 1;
}

.close-btn {
  background: none;
  border: none;
  color: var(--fg);
  font-family: inherit;
  font-size: inherit;
  cursor: pointer;
  padding: 0;
}

.close-btn:hover {
  color: var(--warning);
}

.popup-content {
  padding: 1rem;
  overflow-y: auto;
  flex: 1;
}

.intro pre {
  margin: 0 0 1rem 0;
  font-family: inherit;
  color: var(--fg-dim);
}

.philosophy h3 {
  margin: 0 0 1rem 0;
  color: var(--fg);
  border-bottom: 1px solid var(--border);
  padding-bottom: 0.5rem;
}

.section {
  margin-bottom: 1rem;
  padding: 0.5rem;
  border: 1px solid var(--border);
  background: var(--bg-dim);
}

.section h4 {
  margin: 0 0 0.5rem 0;
  color: var(--fg);
  font-size: 0.9rem;
}

.section p {
  margin: 0;
  color: var(--fg-dim);
  font-size: 0.85rem;
}

.section table {
  width: 100%;
  font-size: 0.85rem;
}

.section table td {
  padding: 0.25rem 0;
  color: var(--fg-dim);
}

.section table td:last-child {
  text-align: right;
  color: var(--fg);
  font-family: monospace;
}

.philosophy-note {
  border-color: var(--fg-dim);
}

.philosophy-note p {
  margin-bottom: 0.25rem;
}

.philosophy-note strong {
  color: var(--fg);
}

.footer {
  margin-top: 1rem;
  border-top: 1px solid var(--border);
  padding-top: 0.5rem;
}

.footer pre {
  margin: 0;
  color: var(--fg-dim);
}
</style>
