<script setup>
import { ref } from 'vue';
import DecryptedText from './DecryptedText.vue';

defineProps({
  title: { type: String, required: true },
  // Fragment target for the summary's links.
  anchor: { type: String, required: true },
  state: { type: String, required: true, validator: (s) => ['loading', 'error', 'done'].includes(s) },
  flagged: { type: Number, default: 0 },
});

const titleText = ref(null);
</script>

<template>
  <section
    :id="anchor"
    class="card"
    :aria-labelledby="`${anchor}-title`"
    :aria-busy="state === 'loading'"
    @mouseenter="titleText?.start()"
    @mouseleave="titleText?.stop()"
  >
    <header class="card-header">
      <h3 :id="`${anchor}-title`">
        <span class="prefix" aria-hidden="true">&gt; </span>
        <DecryptedText ref="titleText" :text="title" />
      </h3>
      <span v-if="state === 'loading'" class="status scanning">scanning</span>
      <span v-else-if="state === 'error'" class="status error">error</span>
      <span v-else-if="flagged > 0" class="status flagged"><span aria-hidden="true">! </span>{{ flagged }} flagged</span>
      <span v-else class="status">ok</span>
    </header>
    <div class="card-body">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.card {
  container: card / inline-size;
  border: 1px solid var(--border);
  background: var(--bg);
  min-width: 0;
  scroll-margin-top: var(--spacing-sm);
}

.card:target {
  border-color: var(--fg-dim);
}

.card-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1ch;
  padding: 0.6rem var(--spacing-sm);
  border-bottom: 1px solid var(--border);
}

h3 {
  font-size: var(--font-size-sm);
  font-weight: 700;
  letter-spacing: 0.08em;
  min-width: 0;
}

.prefix {
  color: var(--fg-muted);
  white-space: pre;
}

.status {
  flex-shrink: 0;
  font-size: var(--font-size-sm);
  color: var(--fg-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.status.flagged,
.status.error {
  color: var(--warning);
}

.status.scanning {
  animation: pulse 2s ease-in-out infinite;
}

.card-body {
  padding: 0.5rem var(--spacing-sm) 0.75rem;
  font-size: var(--font-size-sm);
}

@keyframes pulse {
  50% {
    opacity: 0.4;
  }
}

@media (prefers-reduced-motion: reduce) {
  .status.scanning {
    animation: none;
  }
}
</style>
