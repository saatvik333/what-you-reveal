<script setup>
import { computed } from 'vue';
import BasePopup from './BasePopup.vue';

const props = defineProps({
  open: { type: Boolean, default: false },
  // Score factors from the privacy card; tips for protections already in place are skipped.
  // null while the privacy checks are still running: every tip is shown.
  factors: { type: Object, default: null },
});

const emit = defineEmits(['close']);

const browser = computed(() => {
  if (props.factors?.brave) return 'Brave';
  const ua = navigator.userAgent;
  if (ua.includes('Firefox/')) return 'Firefox';
  if (ua.includes('Edg/')) return 'Edge';
  if (ua.includes('Chrome/')) return 'Chrome';
  if (ua.includes('Safari/')) return 'Safari';
  return 'Unknown';
});

const tips = computed(() => {
  const f = props.factors ?? {};
  const b = browser.value;
  const list = [];

  if (!f.fingerprintProtection) {
    list.push(b === 'Firefox'
      ? {
        title: 'Turn on fingerprinting protection',
        description: 'Strict Enhanced Tracking Protection blocks known fingerprinters and randomizes canvas readback.',
        action: 'Settings → Privacy & Security → Enhanced Tracking Protection → Strict',
      }
      : {
        title: 'Use a browser that resists fingerprinting',
        description: 'Tor Browser and Mullvad Browser make every user look the same; Brave randomizes canvas, audio and other readings per site.',
        link: 'https://mullvad.net/en/browser',
      });
  }

  if (!f.adBlocker && b !== 'Brave') {
    const blockers = {
      Firefox: { title: 'Install uBlock Origin', link: 'https://addons.mozilla.org/firefox/addon/ublock-origin/' },
      Chrome: { title: 'Install uBlock Origin Lite', link: 'https://chromewebstore.google.com/detail/ublock-origin-lite/ddkjiahejlhfcafbddmgiahcphecmpfh' },
      Edge: { title: 'Install uBlock Origin Lite', link: 'https://chromewebstore.google.com/detail/ublock-origin-lite/ddkjiahejlhfcafbddmgiahcphecmpfh' },
    };
    list.push({
      ...(blockers[b] ?? { title: 'Install a content blocker', link: 'https://github.com/gorhill/uBlock#ublock-origin-ubo' }),
      description: 'Blocks ads and the tracking and fingerprinting scripts that load with them.',
    });
  }

  if (!f.gpcEnabled) {
    list.push(b === 'Firefox'
      ? {
        title: 'Send Global Privacy Control',
        description: 'A legally recognized "do not sell or share my data" signal in California, Colorado and other jurisdictions.',
        action: 'Settings → Privacy & Security → Tell websites not to sell or share my data',
      }
      : {
        title: 'Send Global Privacy Control',
        description: 'A legally recognized opt-out signal. Brave and Firefox can send it; Privacy Badger adds it to other browsers.',
        link: 'https://globalprivacycontrol.org/',
      });
  }

  if (f.webrtcLeaking) {
    const fixes = {
      Firefox: 'about:config → media.peerconnection.ice.default_address_only → true',
      Brave: 'Settings → Privacy and security → WebRTC IP handling policy → Disable non-proxied UDP',
    };
    list.push({
      title: 'Stop the WebRTC IP leak',
      description: 'WebRTC is exposing an address that your regular traffic hides.',
      action: fixes[b] ?? 'Use your VPN\'s WebRTC leak protection, or an extension such as uBlock Origin that limits WebRTC.',
    });
  }

  if (!f.vpnDetected && !f.torDetected) {
    list.push({
      title: 'Hide your IP address',
      description: 'A trustworthy VPN or Tor hides your IP and location from sites. It does not stop fingerprinting by itself.',
      link: 'https://www.privacyguides.org/en/vpn/',
    });
  }

  list.push({
    title: 'Blend in',
    description: 'Rare fonts, many extensions and unusual settings make a fingerprint more unique. Fewer customizations make you harder to single out.',
  });

  return list;
});
</script>

<template>
  <BasePopup :open="open" title="enhance_privacy.sh" @close="emit('close')">
    <pre class="intro">$ ./enhance_privacy.sh --browser={{ browser }}</pre>
    <p class="output">
      [*] {{ tips.length }} recommendation(s)
      {{ factors ? 'based on this scan' : '(privacy checks still running: showing all)' }}
    </p>

    <ul class="recommendations">
      <li v-for="tip in tips" :key="tip.title" class="tip">
        <h3 class="tip-title">{{ tip.title }}</h3>
        <p class="tip-description">{{ tip.description }}</p>
        <p v-if="tip.action" class="tip-action"><span aria-hidden="true">&rarr; </span>{{ tip.action }}</p>
        <a v-if="tip.link" :href="tip.link" target="_blank" rel="noopener noreferrer" class="tip-link">
          Open<span class="sr-only">: {{ tip.title }} (new tab)</span> ↗
        </a>
      </li>
    </ul>
  </BasePopup>
</template>

<style scoped>
.intro {
  color: var(--fg);
}

.output {
  color: var(--fg-dim);
  margin-bottom: 1rem;
}

.recommendations {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.tip {
  border: 1px solid var(--border);
  padding: 0.75rem;
  background: var(--bg-dim);
}

.tip-title {
  font-size: inherit;
  margin-bottom: 0.5rem;
}

.tip-description {
  color: var(--fg-dim);
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.tip-action {
  color: var(--fg-muted);
  font-size: 0.85rem;
}

.tip-link {
  display: inline-block;
  margin-top: 0.25rem;
  color: var(--fg);
  text-decoration: none;
  font-size: 0.85rem;
  border: 1px solid var(--border);
  padding: 0.25rem 0.5rem;
}

.tip-link:hover,
.tip-link:focus-visible {
  background: var(--fg);
  color: var(--bg);
}
</style>
