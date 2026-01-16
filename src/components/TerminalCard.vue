<script setup>
import DecryptedText from './DecryptedText.vue'

defineProps({
  title: {
    type: String,
    required: true,
  },
  id: {
    type: String,
    default: "",
  },
});
</script>

<template>
  <section class="card" :id="id">
    <h2>
      <span class="prefix">&gt; </span>
      <DecryptedText 
        :text="title" 
        animate-on="hover" 
        :speed="60" 
        sequential
        reveal-direction="start"
        class="decrypt-content"
        encrypted-class-name="decrypt-char encrypted"
        class-name="decrypt-char revealed"
      />
    </h2>
    <div class="info-block">
      <slot>
        <pre>Initializing...</pre>
      </slot>
    </div>
  </section>
</template>

<style scoped>
/* Decrypt text effect styles */
:deep(.decrypt-char) {
  transition: none;
}

:deep(.decrypt-char.encrypted) {
  color: var(--fg-dim);
}

:deep(.decrypt-char.revealed) {
  color: var(--fg);
}

.card {
  border: 1px solid var(--border);
  background: var(--bg);
  position: relative;
  display: flex;
  flex-direction: column;
}

/* Terminal window title bar */
.card::before {
  content: "";
  display: block;
  height: 1px;
  background: var(--border);
}

.card h2 {
  font-size: var(--font-size-sm);
  font-weight: 400;
  color: var(--fg);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-bottom: 1px solid var(--border);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
  transition: color 0.2s ease;
  display: flex;
  align-items: center;
}

.prefix {
  color: var(--fg-muted);
  margin-right: 0.5em;
  white-space: pre;
}

.card h2:hover {
  color: var(--fg);
}

.info-block {
  padding: var(--spacing-sm);
  font-size: var(--font-size-sm);
  min-height: 120px;
  max-height: 300px;
  overflow-y: auto;
  flex: 1;
}

.info-block :deep(pre) {
  white-space: pre-wrap;
  word-break: break-word;
  font-family: var(--font-mono);
  color: var(--fg);
  line-height: 1.6;
  margin: 0;
}
</style>
