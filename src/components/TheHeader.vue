<script setup>
import { inject } from 'vue';
import packageJson from '../../package.json';

// Inject collected data from parent (will be provided by App.vue)
const collectedData = inject('collectedData', null);

// Get version from package.json
const version = packageJson.version;

function downloadLog() {
  // Gather all data from the page
  const data = {};
  
  // Get all data grids from the DOM
  const cards = document.querySelectorAll('.terminal-card');
  cards.forEach(card => {
    const titleEl = card.querySelector('.terminal-title');
    const title = titleEl ? titleEl.textContent.trim() : 'Unknown';
    
    const rows = card.querySelectorAll('.data-row');
    const cardData = {};
    
    rows.forEach(row => {
      const keyEl = row.querySelector('.data-key');
      const valueEl = row.querySelector('.data-value');
      
      if (keyEl && valueEl) {
        // Get text content, excluding action buttons
        const key = keyEl.textContent.replace(/\[.*?\]/g, '').trim();
        const value = valueEl.textContent.replace(/\[.*?\]/g, '').trim();
        if (key && value) {
          cardData[key] = value;
        }
      }
    });
    
    if (Object.keys(cardData).length > 0) {
      data[title] = cardData;
    }
  });
  
  // Add metadata
  const report = {
    meta: {
      generated: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: Date.now(),
    },
    data
  };
  
  // Create and download the file
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `what-you-reveal-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
</script>

<template>
  <header>
    <pre class="ascii-header" aria-label="What You Reveal - ASCII Art Logo">
╦ ╦╦ ╦╔═╗╔╦╗  ╦ ╦╔═╗╦ ╦  ╦═╗╔═╗╦  ╦╔═╗╔═╗╦  
║║║╠═╣╠═╣ ║   ╚╦╝║ ║║ ║  ╠╦╝║╣ ╚╗╔╝║╣ ╠═╣║  
╚╩╝╩ ╩╩ ╩ ╩    ╩ ╚═╝╚═╝  ╩╚═╚═╝ ╚╝ ╚═╝╩ ╩╩═╝
    </pre>
    <p class="subtitle">SYSTEM ANALYSIS TOOL // BROWSER FINGERPRINT DEMO // v{{ version }}</p>
    <nav class="controls" aria-label="Main controls">
      <button 
        id="download-report" 
        class="control-btn" 
        @click="downloadLog"
        aria-label="Download fingerprint report as JSON"
      >[ DOWNLOAD LOG ]</button>
      <a
        href="https://github.com/saatvik333/what-you-reveal"
        target="_blank"
        rel="noopener noreferrer"
        class="control-btn"
        aria-label="View source code on GitHub"
      >[ GITHUB REPO ]</a>
      <a
        href="https://github.com/saatvik333/what-you-reveal/issues"
        target="_blank"
        rel="noopener noreferrer"
        class="control-btn"
        aria-label="Report a bug on GitHub Issues"
      >[ FOUND BUG? ]</a>
      <a
        href="https://www.buymeacoffee.com/saatvik333"
        target="_blank"
        rel="noopener noreferrer"
        class="control-btn"
        aria-label="Support the project on Buy Me a Coffee"
      >[ BUY ME A COFFEE ]</a>
    </nav>
  </header>
</template>

<style scoped>
header {
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--border);
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
  letter-spacing: 0.1em;
  margin: 0 0 var(--spacing-md) 0;
  text-transform: uppercase;
}

.controls {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.control-btn {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--fg-dim);
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  cursor: pointer;
  transition: all 0.15s ease;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.control-btn:hover {
  border-color: var(--fg);
  color: var(--fg);
}

.control-btn:focus {
  outline: 1px solid var(--fg);
  outline-offset: 2px;
}
</style>
