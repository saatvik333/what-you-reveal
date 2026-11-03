<script setup>
import { computed, ref, useId } from 'vue';

// Renders a collector result: { Label: value } or { Label: { value, url, warning, element } }.
// `element` is structured data ({ type: 'image', src, alt }), never HTML.
const props = defineProps({
  data: { type: Object, required: true },
  // Rows shown before "show more"; long cards stay scannable without a nested scroll area.
  limit: { type: Number, default: 10 },
});

const rows = computed(() => Object.entries(props.data).map(([label, raw]) => ({
  label,
  ...(raw !== null && typeof raw === 'object' ? raw : { value: raw }),
})));

const expanded = ref(false);
const listId = useId();
// Collapsing two or three rows saves nothing and costs a click: show them.
const MIN_HIDDEN = 4;
const shown = computed(() => (rows.value.length - props.limit >= MIN_HIDDEN ? props.limit : rows.value.length));
const hiddenCount = computed(() => rows.value.length - shown.value);
const hiddenFlagged = computed(() => rows.value.slice(shown.value).filter((row) => row.warning).length);

const isDataImage = (element) => element?.type === 'image' && /^data:image\//.test(element.src);
</script>

<template>
  <dl :id="listId" class="data-grid">
    <div
      v-for="(row, index) in rows"
      v-show="expanded || index < shown"
      :key="row.label"
      class="data-row"
      :class="{ flagged: row.warning }"
    >
      <dt>
        <span v-if="row.warning" class="flag"><span aria-hidden="true">!</span><span class="sr-only">Flagged: </span></span>
        <a v-if="row.url" :href="row.url" target="_blank" rel="noopener noreferrer" class="doc-link">
          {{ row.label }}<span class="sr-only"> (docs, new tab)</span>
        </a>
        <template v-else>{{ row.label }}</template>
      </dt>
      <dd>
        {{ row.value }}
        <img v-if="isDataImage(row.element)" :src="row.element.src" :alt="row.element.alt" class="data-image" />
      </dd>
    </div>
  </dl>
  <button
    v-if="hiddenCount > 0"
    type="button"
    class="more"
    :aria-expanded="expanded"
    :aria-controls="listId"
    @click="expanded = !expanded"
  >
    <template v-if="expanded">[-] Show fewer rows</template>
    <template v-else>[+] Show {{ hiddenCount }} more rows<template v-if="hiddenFlagged"> ({{ hiddenFlagged }} flagged)</template></template>
  </button>
</template>

<style scoped>
.data-grid {
  display: flex;
  flex-direction: column;
}

.data-row {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
  gap: 0 1.5ch;
  padding: 0.35rem 0 0.35rem 2ch;
  border-bottom: 1px solid var(--border);
  position: relative;
}

.data-row:last-child {
  border-bottom: none;
}

dt {
  color: var(--fg-dim);
  overflow-wrap: anywhere;
}

dd {
  color: var(--fg);
  overflow-wrap: anywhere;
  font-variant-numeric: tabular-nums;
}

.flagged dd,
.flag {
  color: var(--warning);
}

/* The "!" sits in the left gutter so flagged rows line up and scan as a column. */
.flag {
  position: absolute;
  left: 0;
  font-weight: 700;
}

.doc-link {
  color: inherit;
  /* Dotted and dim: these are optional "learn more" links on almost every label, not calls to action. */
  text-decoration: underline dotted;
  text-decoration-color: var(--fg-muted);
  text-underline-offset: 0.2em;
}

.doc-link:hover,
.doc-link:focus-visible {
  color: var(--fg);
  text-decoration: underline solid currentColor;
}

.data-image {
  display: block;
  margin-top: 0.4rem;
  max-width: 100%;
  height: auto;
  border: 1px solid var(--border-bright);
}

.more {
  margin-top: 0.5rem;
  padding: 0.35rem 0;
  min-height: 24px;
  background: none;
  border: none;
  color: var(--fg);
  font: inherit;
  cursor: pointer;
}

.more:hover {
  text-decoration: underline;
}

/* Narrow card: label above value. */
@container card (max-width: 26rem) {
  .data-row {
    grid-template-columns: minmax(0, 1fr);
    gap: 0.1rem;
  }
}
</style>
