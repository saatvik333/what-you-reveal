<script setup>
defineProps({
  data: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['action']);

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
        <span v-if="value && value.element" v-html="value.element"></span>
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

.inline-action:hover {
  text-decoration: underline;
}
</style>
