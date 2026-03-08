<script setup>
defineProps({
  data: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['action']);

function sanitizeHtml(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  // Only allow img elements with data: or blob: src
  const elements = div.querySelectorAll('*');
  for (const el of elements) {
    if (el.tagName !== 'IMG') {
      el.remove();
      continue;
    }
    const src = el.getAttribute('src') || '';
    if (!src.startsWith('data:') && !src.startsWith('blob:')) {
      el.remove();
      continue;
    }
    // Strip event handler attributes
    for (const attr of [...el.attributes]) {
      if (attr.name.startsWith('on')) {
        el.removeAttribute(attr.name);
      }
    }
  }
  return div.innerHTML;
}

function handleAction(actionName) {
  emit('action', actionName);
}
</script>

<template>
  <div class="data-grid">
    <div v-for="(value, key) in data" :key="key" class="data-row">
      <span class="data-key">
        <a v-if="value && value.url" :href="value.url" target="_blank" rel="noopener noreferrer" class="resource-link">{{ key }}</a>
        <span v-else>{{ key }}</span>
        <button 
          v-if="value && value.action" 
          class="inline-action" 
          @click="handleAction(value.action)"
        >[{{ value.actionLabel || 'Info' }}]</button>
      </span>
      
      <span class="data-value" :class="{ 'warning': value && value.warning }">
        <span v-if="value && value.element" v-html="sanitizeHtml(value.element)"></span>
        <span v-else>{{ (value && typeof value === 'object' && 'value' in value) ? value.value : value }}</span>
      </span>
    </div>
  </div>
</template>

<style scoped>
.data-grid {
  display: flex;
  flex-direction: column;
}

.data-row {
  display: flex;
  justify-content: space-between;
  padding: 0.3rem 0;
  border-bottom: 1px solid var(--border);
  gap: 1rem;
}

.data-row:last-child {
  border-bottom: none;
}

.data-key {
  color: var(--fg-dim);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 1ch;
}

.resource-link {
  color: var(--fg-dim);
  text-decoration: none;
  transition: color 0.2s;
}

.resource-link::after {
  content: ' ↗';
  margin-left: 0.5ch;
  display: inline-block;
  text-decoration: none;
}

.resource-link:hover {
  color: var(--fg);
}

.data-value {
  color: var(--fg);
  text-align: right;
  word-break: break-all;
}

.data-value.warning {
  color: var(--warning);
}

.inline-action {
  background: none;
  border: none;
  color: var(--fg);
  font-family: inherit;
  font-size: inherit;
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
}

.canvas-fingerprint-img {
  border: 1px solid var(--fg);
  margin-top: 5px;
  max-width: 100%;
  height: auto;
  image-rendering: pixelated;
}

.inline-action:hover {
  text-decoration: underline;
}

@media (max-width: 600px) {
  .data-row {
    flex-direction: column;
    gap: 0.25rem;
  }

  .data-value {
    text-align: left;
    word-break: break-word;
  }
}
</style>
