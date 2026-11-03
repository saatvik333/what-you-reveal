<script setup>
import { computed } from 'vue';

const props = defineProps({
  // { score, grade } once the privacy card has finished, else null.
  score: { type: Object, default: null },
  finished: { type: Number, required: true },
  total: { type: Number, required: true },
  // Cards with flagged rows, in page order: [{ anchor, title, labels }]
  flagged: { type: Array, required: true },
});

const emit = defineEmits(['tips', 'scoring']);

// Pure ASCII so the bar renders in the page font everywhere.
const bar = (fraction, width) => '#'.repeat(Math.round(fraction * width)).padEnd(width, '.');

const complete = computed(() => props.finished === props.total);
const flaggedCount = computed(() => props.flagged.reduce((n, card) => n + card.labels.length, 0));
</script>

<template>
  <section class="summary" aria-labelledby="summary-title">
    <h2 id="summary-title" class="summary-title"><span aria-hidden="true">&gt; </span>SCAN_SUMMARY</h2>

    <div class="summary-grid">
      <div class="score-panel">
        <p class="label">Privacy score</p>
        <p class="score" :class="{ low: score && score.score < 50 }">
          <span class="score-value">{{ score ? score.score : '--' }}</span><span class="score-max">/100</span>
        </p>
        <p class="meter" aria-hidden="true">[{{ bar((score?.score ?? 0) / 100, 20) }}]</p>
        <p class="grade">{{ score ? score.grade : 'Calculating...' }}</p>
        <div class="actions">
          <button type="button" class="action primary" @click="emit('tips')">[ How to improve ]</button>
          <button type="button" class="action" @click="emit('scoring')">[ How it's scored ]</button>
        </div>
      </div>

      <div class="flagged-panel">
        <p class="label">
          Flagged
          <span class="muted">({{ flaggedCount }} items: exposures and missing protections)</span>
        </p>
        <ul v-if="flagged.length" class="flagged-list">
          <li v-for="card in flagged" :key="card.anchor">
            <a :href="`#${card.anchor}`" class="card-link">{{ card.title }}</a>
            <span class="count"><span aria-hidden="true">! </span>{{ card.labels.length }}</span>
            <span class="labels">{{ card.labels.join(', ') }}</span>
          </li>
        </ul>
        <p v-else class="muted">{{ complete ? 'Nothing flagged.' : 'Waiting for results...' }}</p>
      </div>
    </div>

    <p class="progress">
      <span aria-hidden="true">[{{ bar(finished / total, 30) }}] </span>
      {{ complete ? `Scan complete: ${total} modules` : `Scanning: ${finished} of ${total} modules done` }}
    </p>
    <!-- Announced once, when the scan finishes, instead of on every card. -->
    <p role="status" class="sr-only">{{ complete ? `Scan complete. ${flaggedCount} items flagged.` : '' }}</p>
  </section>
</template>

<style scoped>
.summary {
  border: 1px solid var(--border-bright);
  margin-bottom: var(--spacing-lg);
}

.summary-title {
  font-size: var(--font-size-sm);
  font-weight: 700;
  letter-spacing: 0.08em;
  padding: 0.6rem var(--spacing-sm);
  border-bottom: 1px solid var(--border);
}

.summary-grid {
  display: grid;
  grid-template-columns: minmax(16rem, 1fr) minmax(0, 2fr);
}

.score-panel,
.flagged-panel {
  padding: var(--spacing-sm);
}

.score-panel {
  border-right: 1px solid var(--border);
}

.label {
  color: var(--fg-dim);
  font-size: var(--font-size-sm);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 0.5rem;
}

.muted {
  color: var(--fg-muted);
  text-transform: none;
  letter-spacing: 0;
}

.score {
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.score-value {
  font-size: 3.5rem;
  font-weight: 700;
}

.score-max {
  font-size: 1.25rem;
  color: var(--fg-dim);
}

.score.low .score-value {
  color: var(--warning);
}

.meter {
  margin-top: 0.5rem;
  color: var(--fg-dim);
  white-space: pre;
  font-size: var(--font-size-sm);
}

.score.low + .meter {
  color: var(--warning);
}

.grade {
  margin-top: 0.25rem;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: var(--spacing-sm);
}

.action {
  background: transparent;
  border: 1px solid var(--border-bright);
  color: var(--fg);
  font: inherit;
  font-size: var(--font-size-sm);
  padding: 0.45rem 0.75rem;
  min-height: 32px;
  cursor: pointer;
}

.action.primary {
  background: var(--fg);
  border-color: var(--fg);
  color: var(--bg);
}

.action:hover {
  border-color: var(--fg);
}

.action.primary:hover {
  background: var(--fg-dim);
  border-color: var(--fg-dim);
}

.flagged-list {
  list-style: none;
  font-size: var(--font-size-sm);
}

.flagged-list li {
  display: grid;
  grid-template-columns: 22ch 5ch minmax(0, 1fr);
  gap: 1ch;
  padding: 0.3rem 0;
  border-bottom: 1px solid var(--border);
}

.flagged-list li:last-child {
  border-bottom: none;
}

.card-link {
  color: var(--fg);
  text-underline-offset: 0.2em;
}

.count {
  color: var(--warning);
  font-variant-numeric: tabular-nums;
}

.labels {
  color: var(--fg-dim);
}

.progress {
  border-top: 1px solid var(--border);
  padding: 0.6rem var(--spacing-sm);
  font-size: var(--font-size-sm);
  color: var(--fg-dim);
  white-space: pre-wrap;
}

/* Forced colors drop authored backgrounds; keep the primary action visibly filled. */
@media (forced-colors: active) {
  .action.primary {
    forced-color-adjust: none;
    background: ButtonText;
    border-color: ButtonText;
    color: ButtonFace;
  }
}

@media (max-width: 760px) {
  .summary-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .score-panel {
    border-right: none;
    border-bottom: 1px solid var(--border);
  }

  .flagged-list li {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .labels {
    grid-column: 1 / -1;
  }
}
</style>
