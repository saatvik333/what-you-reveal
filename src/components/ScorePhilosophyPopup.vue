<script setup>
import BasePopup from './BasePopup.vue';

defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['close']);
</script>

<template>
  <BasePopup
    :isOpen="isOpen"
    title="score_philosophy.txt"
    prompt="root@privacy:~#"
    @close="emit('close')"
  >
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
          <tbody>
            <tr><td>Ad Blocker Active</td><td>+15</td></tr>
            <tr><td>WebRTC Protected</td><td>+15</td></tr>
            <tr><td>Global Privacy Control</td><td>+10</td></tr>
            <tr><td>Storage Partitioned</td><td>+10</td></tr>
            <tr><td>VPN/Proxy Detected</td><td>+10</td></tr>
            <tr><td>Tor Network</td><td>+10</td></tr>
            <tr><td>Private Browsing</td><td>+5</td></tr>
            <tr><td>Do Not Track</td><td>+5</td></tr>
            <tr><td>Brave Shields</td><td>+5</td></tr>
          </tbody>
        </table>
      </div>

      <div class="section">
        <h4>Penalties (Privacy Risks)</h4>
        <table>
          <tbody>
            <tr><td>WebRTC Leaking IP</td><td>-15</td></tr>
            <tr><td>WebDriver Detected</td><td>-10</td></tr>
            <tr><td>GPC Explicitly Disabled</td><td>-5</td></tr>
            <tr><td>DNT Explicitly Disabled</td><td>-5</td></tr>
          </tbody>
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
  </BasePopup>
</template>

<style scoped>
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
