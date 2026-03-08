<script setup>
import { ref, computed, onMounted } from 'vue';
import BasePopup from './BasePopup.vue';

defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['close']);

// Detect browser for specific recommendations
const browserInfo = ref({ name: 'Unknown', isFirefox: false, isChrome: false, isBrave: false });

onMounted(async () => {
  const ua = navigator.userAgent;

  // Check for Brave first (it also has Chrome in UA)
  if (navigator.brave && typeof navigator.brave.isBrave === 'function') {
    try {
      const isBrave = await navigator.brave.isBrave();
      if (isBrave) {
        browserInfo.value = { name: 'Brave', isFirefox: false, isChrome: false, isBrave: true };
        return;
      }
    } catch (e) {}
  }

  if (ua.includes('Firefox')) {
    browserInfo.value = { name: 'Firefox', isFirefox: true, isChrome: false, isBrave: false };
  } else if (ua.includes('Chrome')) {
    browserInfo.value = { name: 'Chrome', isFirefox: false, isChrome: true, isBrave: false };
  } else if (ua.includes('Safari')) {
    browserInfo.value = { name: 'Safari', isFirefox: false, isChrome: false, isBrave: false };
  }
});

const recommendations = computed(() => {
  const tips = [];

  // Universal recommendations
  tips.push({
    title: 'Enable Do Not Track',
    description: 'Signal to websites that you don\'t want to be tracked.',
    action: 'Browser Settings → Privacy → Send "Do Not Track" request',
  });

  tips.push({
    title: 'Enable Global Privacy Control',
    description: 'Legally binding opt-out in CA/EU.',
    link: 'https://globalprivacycontrol.org/',
  });

  // Ad Blocker recommendations
  if (browserInfo.value.isFirefox) {
    tips.push({
      title: 'Install uBlock Origin',
      description: 'Best ad blocker for Firefox.',
      link: 'https://addons.mozilla.org/en-US/firefox/addon/ublock-origin/',
    });
    tips.push({
      title: 'Install Privacy Badger',
      description: 'Automatically blocks invisible trackers.',
      link: 'https://addons.mozilla.org/en-US/firefox/addon/privacy-badger17/',
    });
    tips.push({
      title: 'Enable Enhanced Tracking Protection',
      description: 'Settings → Privacy & Security → Enhanced Tracking Protection → Strict',
      action: 'Firefox Settings',
    });
  } else if (browserInfo.value.isChrome) {
    tips.push({
      title: 'Install AdGuard',
      description: 'Recommended ad blocker for Chrome (Manifest V3 compatible).',
      link: 'https://chromewebstore.google.com/detail/bgnkhhnnamicmpeenaelnjfhikgbkllg',
    });
    tips.push({
      title: 'Install Privacy Badger',
      description: 'Automatically blocks invisible trackers.',
      link: 'https://chromewebstore.google.com/detail/privacy-badger/pkehgijcmpdhfbdbbnkijodmdjhbjlgp',
    });
    tips.push({
      title: 'Consider Switching to Firefox',
      description: 'Chrome restricts ad blockers. Firefox has better privacy defaults.',
      link: 'https://www.mozilla.org/en-US/firefox/new/',
    });
  } else if (browserInfo.value.isBrave) {
    tips.push({
      title: 'You\'re using Brave!',
      description: 'Brave has built-in ad/tracker blocking. Ensure Shields are enabled.',
      action: 'Click the Brave icon in address bar → Shields Up',
    });
  }

  // WebRTC recommendation
  tips.push({
    title: 'Disable WebRTC IP Leak',
    description: browserInfo.value.isFirefox
      ? 'about:config → media.peerconnection.enabled → false'
      : 'Use browser extension or VPN with WebRTC leak protection.',
  });

  // VPN recommendation
  tips.push({
    title: 'Use a Privacy-Focused VPN',
    description: 'Mullvad, ProtonVPN, or IVPN for maximum privacy.',
    link: 'https://mullvad.net/',
  });

  return tips;
});
</script>

<template>
  <BasePopup
    :isOpen="isOpen"
    title="enhance_privacy.sh"
    prompt="root@privacy:~#"
    @close="emit('close')"
  >
    <div class="intro">
      <pre>$ ./enhance_privacy.sh --browser={{ browserInfo.name }}</pre>
      <pre class="output">[*] Generating recommendations...</pre>
    </div>

    <div class="recommendations">
      <div v-for="(tip, index) in recommendations" :key="index" class="tip">
        <div class="tip-header">
          <span class="tip-title">{{ tip.title }}</span>
        </div>
        <p class="tip-description">{{ tip.description }}</p>
        <div v-if="tip.action" class="tip-action">
          <span class="prompt-mini">&rarr;</span> {{ tip.action }}
        </div>
        <a v-if="tip.link" :href="tip.link" target="_blank" rel="noopener" class="tip-link">
          Open ↗
        </a>
      </div>
    </div>

    <div class="footer">
      <pre>$ exit</pre>
    </div>
  </BasePopup>
</template>

<style scoped>
.intro pre {
  margin: 0;
  font-family: inherit;
  color: var(--fg);
}

.intro .output {
  color: var(--fg-dim);
  margin-bottom: 1rem;
}

.recommendations {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.tip {
  border: 1px solid var(--border);
  padding: 0.75rem;
  background: var(--bg-dim);
}

.tip-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.tip-title {
  color: var(--fg);
  font-weight: bold;
}

.tip-description {
  color: var(--fg-dim);
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
}

.tip-action {
  color: var(--fg-muted);
  font-size: 0.85rem;
  font-family: monospace;
}

.prompt-mini {
  color: var(--fg-dim);
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

.tip-link:hover {
  background: var(--fg);
  color: var(--bg);
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
