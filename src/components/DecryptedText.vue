<script setup>
import { ref, onUnmounted } from 'vue';

// Hover effect for card titles: scramble the text, then reveal it left to right.
const props = defineProps({
  text: { type: String, required: true },
  speed: { type: Number, default: 60 },
});

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+';
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const chars = ref([...props.text].map((char) => ({ char, revealed: true })));
let timer = null;

function render(revealedCount) {
  chars.value = [...props.text].map((char, i) =>
    i < revealedCount || char === ' '
      ? { char, revealed: true }
      : { char: CHARS[Math.floor(Math.random() * CHARS.length)], revealed: false });
}

function stop() {
  clearInterval(timer);
  timer = null;
  render(props.text.length);
}

function start() {
  if (reducedMotion.matches) return;
  clearInterval(timer);
  let revealed = 0;
  render(0);
  timer = setInterval(() => {
    revealed++;
    if (revealed >= props.text.length) stop();
    else render(revealed);
  }, props.speed);
}

onUnmounted(() => clearInterval(timer));

defineExpose({ start, stop });
</script>

<template>
  <span class="decrypted-text">
    <span class="sr-only">{{ text }}</span>
    <span aria-hidden="true">
      <span v-for="(c, i) in chars" :key="i" :class="{ encrypted: !c.revealed }">{{ c.char }}</span>
    </span>
  </span>
</template>

<style scoped>
.decrypted-text {
  display: inline-block;
  white-space: pre-wrap;
}

.encrypted {
  color: var(--fg-dim);
}
</style>
