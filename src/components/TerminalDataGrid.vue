<script setup>
defineProps({
  data: {
    type: Object,
    required: true,
  },
});
</script>

<template>
  <div class="data-grid">
    <div v-for="(value, key) in data" :key="key" class="data-row">
      <span class="data-key" v-if="value && value.url">
        <a :href="value.url" target="_blank" rel="noopener noreferrer" class="resource-link">{{ key }}</a>
      </span>
      <span class="data-key" v-else>{{ key }}</span>
      
      <span class="data-value" :class="{ 'warning': value && value.warning }">
        {{ (value && typeof value === 'object' && 'value' in value) ? value.value : value }}
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
</style>
