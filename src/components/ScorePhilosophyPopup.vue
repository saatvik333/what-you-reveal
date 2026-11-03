<script setup>
import BasePopup from './BasePopup.vue';
import { BASE_SCORE, SCORE_RULES, formatPoints } from '../modules/privacy/score.js';

defineProps({
  open: { type: Boolean, default: false },
});

const emit = defineEmits(['close']);
const bonuses = SCORE_RULES.filter((rule) => rule.points > 0);
const penalties = SCORE_RULES.filter((rule) => rule.points < 0);
</script>

<template>
  <BasePopup :open="open" title="score_philosophy.txt" @close="emit('close')">
    <pre class="intro">$ cat score_philosophy.txt</pre>

    <h3>Privacy Score Calculation</h3>

    <section class="section">
      <h4>Base score: {{ BASE_SCORE }}</h4>
      <p>Where a browser with no protections starts. The total is capped to 0–100.</p>
    </section>

    <section class="section">
      <h4>Bonuses (protections you turned on)</h4>
      <table>
        <tbody>
          <tr v-for="rule in bonuses" :key="rule.factor">
            <td>{{ rule.label }}</td>
            <td>{{ formatPoints(rule.points) }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section class="section">
      <h4>Penalties (actual exposure)</h4>
      <table>
        <tbody>
          <tr v-for="rule in penalties" :key="rule.factor">
            <td>{{ rule.label }}</td>
            <td>{{ formatPoints(rule.points) }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section class="section philosophy-note">
      <h4>Philosophy</h4>
      <p>Protections earn points; browser defaults are neutral, never penalties.</p>
      <p>Only real exposure, such as an IP leaking through WebRTC, costs points.</p>
      <p>
        Do Not Track is not scored: it is deprecated, ignored by most sites, and adds one more
        bit to your fingerprint. Global Privacy Control replaces it.
      </p>
      <p>
        The score measures protections this page can observe. It is not a measure of how unique
        your fingerprint is.
      </p>
    </section>
  </BasePopup>
</template>

<style scoped>
.intro {
  margin: 0 0 1rem;
  color: var(--fg-dim);
}

h3 {
  margin: 0 0 1rem;
  font-size: inherit;
  border-bottom: 1px solid var(--border);
  padding-bottom: 0.5rem;
}

.section {
  margin-bottom: 1rem;
  padding: 0.5rem;
  border: 1px solid var(--border);
  background: var(--bg-dim);
}

h4 {
  margin: 0 0 0.5rem;
  font-size: 0.9rem;
}

.section p {
  color: var(--fg-dim);
  font-size: 0.85rem;
}

.section p + p {
  margin-top: 0.25rem;
}

table {
  width: 100%;
  font-size: 0.85rem;
  border-collapse: collapse;
}

td {
  padding: 0.25rem 0;
  color: var(--fg-dim);
}

td:last-child {
  text-align: right;
  color: var(--fg);
}

.philosophy-note {
  border-color: var(--fg-dim);
}
</style>
