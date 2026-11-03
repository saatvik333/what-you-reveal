<script setup>
import { version } from '../../package.json';

const props = defineProps({
  // Card title → { label: value }, as shown on screen.
  report: { type: Object, required: true },
});

function downloadReport() {
  const report = {
    meta: {
      generated: new Date().toISOString(),
      version,
      userAgent: navigator.userAgent,
      url: window.location.href,
    },
    data: props.report,
  };
  const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `what-you-reveal-${report.meta.generated.slice(0, 10)}.json`;
  a.click();
  // Revoking synchronously can cancel the download in some browsers (FileSaver.js waits too).
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

const LINKS = [
  ['Source on GitHub', 'https://github.com/saatvik333/what-you-reveal'],
  ['Report a bug', 'https://github.com/saatvik333/what-you-reveal/issues'],
  ['Buy me a coffee', 'https://www.buymeacoffee.com/saatvik333'],
];
</script>

<template>
  <header>
    <pre class="ascii-header" aria-hidden="true">
╦ ╦╦ ╦╔═╗╔╦╗  ╦ ╦╔═╗╦ ╦  ╦═╗╔═╗╦  ╦╔═╗╔═╗╦  
║║║╠═╣╠═╣ ║   ╚╦╝║ ║║ ║  ╠╦╝║╣ ╚╗╔╝║╣ ╠═╣║  
╚╩╝╩ ╩╩ ╩ ╩    ╩ ╚═╝╚═╝  ╩╚═╚═╝ ╚╝ ╚═╝╩ ╩╩═╝
    </pre>
    <h1 class="sr-only">What You Reveal: browser fingerprint and privacy check</h1>
    <p class="subtitle">BROWSER FINGERPRINT &amp; PRIVACY SCANNER // v{{ version }}</p>
    <p class="lead">
      Everything below was read from your browser just now, without a single permission prompt.
      Any website you visit can collect the same.
    </p>
    <div class="controls">
      <button type="button" class="control-btn" @click="downloadReport">[ Download report (JSON) ]</button>
      <a
        v-for="[label, href] in LINKS"
        :key="href"
        :href="href"
        target="_blank"
        rel="noopener noreferrer"
        class="control-link"
      >{{ label }}<span class="sr-only"> (opens in a new tab)</span></a>
    </div>
  </header>
</template>

<style scoped>
header {
  margin-bottom: var(--spacing-lg);
  padding: var(--spacing-sm) 0 var(--spacing-md);
  text-align: center;
}

.ascii-header {
  font-size: 0.6rem;
  line-height: 1.2;
  white-space: pre;
  color: var(--fg);
  margin-bottom: var(--spacing-sm);
  display: inline-block;
  text-align: left;
  font-weight: 700;
}

@media (min-width: 600px) {
  .ascii-header {
    font-size: 0.85rem;
  }
}

@media (min-width: 900px) {
  .ascii-header {
    font-size: 1rem;
  }
}

.subtitle {
  color: var(--fg-dim);
  font-size: var(--font-size-sm);
  letter-spacing: 0.12em;
}

.lead {
  max-width: 60ch;
  margin: var(--spacing-sm) auto var(--spacing-md);
  text-wrap: balance;
}

.controls {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem 2ch;
}

.control-btn {
  background: transparent;
  border: 1px solid var(--border-bright);
  color: var(--fg);
  font: inherit;
  font-size: var(--font-size-sm);
  padding: 0.45rem 0.75rem;
  min-height: 32px;
  cursor: pointer;
}

.control-btn:hover {
  border-color: var(--fg);
}

.control-link {
  color: var(--fg-dim);
  font-size: var(--font-size-sm);
  text-underline-offset: 0.2em;
  padding: 0.45rem 0;
}

.control-link:hover {
  color: var(--fg);
}
</style>
