<script setup></script>

<template>
  <header>
    <pre class="ascii-header">
╦ ╦╦ ╦╔═╗╔╦╗  ╦ ╦╔═╗╦ ╦  ╦═╗╔═╗╦  ╦╔═╗╔═╗╦  
║║║╠═╣╠═╣ ║   ╚╦╝║ ║║ ║  ╠╦╝║╣ ╚╗╔╝║╣ ╠═╣║  
╚╩╝╩ ╩╩ ╩ ╩    ╩ ╚═╝╚═╝  ╩╚═╚═╝ ╚╝ ╚═╝╩ ╩╩═╝
    </pre>
    <div class="subtitle">SYSTEM ANALYSIS TOOL // BROWSER FINGERPRINT DEMO</div>
    <div class="controls">
      <button id="download-report" class="control-btn">[ DOWNLOAD LOG ]</button>
      <a
        href="https://github.com/saatvik333/what-you-reveal"
        target="_blank"
        rel="noopener noreferrer"
        class="control-btn"
        >[ GITHUB REPO ]</a
      >
    </div>
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
  margin-bottom: var(--spacing-md);
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
  min-width: 160px;
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
