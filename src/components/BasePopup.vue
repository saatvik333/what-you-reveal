<script setup>
import { ref, watch, onMounted, useId } from 'vue';

// Native modal <dialog>: the browser provides the focus trap, inert background, Escape to
// close, top-layer stacking and focus return to the opener.
const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, required: true },
  prompt: { type: String, default: 'root@privacy:~#' },
});

const emit = defineEmits(['close']);
const dialog = ref(null);
const titleId = useId();

function sync(open) {
  if (!dialog.value) return;
  if (open && !dialog.value.open) dialog.value.showModal();
  else if (!open && dialog.value.open) dialog.value.close();
}

watch(() => props.open, sync);
onMounted(() => sync(props.open));

// A click whose target is the <dialog> itself landed on the backdrop, outside the panel.
function onClick(event) {
  if (event.target === dialog.value) dialog.value.close();
}
</script>

<template>
  <dialog ref="dialog" :aria-labelledby="titleId" @close="emit('close')" @click="onClick">
    <div class="popup-container">
      <div class="popup-header">
        <span class="prompt" aria-hidden="true">{{ prompt }}</span>
        <h2 :id="titleId" class="title">{{ title }}</h2>
        <button type="button" class="close-btn" aria-label="Close dialog" autofocus @click="dialog.close()">[X]</button>
      </div>
      <div class="popup-content">
        <slot />
      </div>
    </div>
  </dialog>
</template>

<style scoped>
dialog {
  margin: auto;
  padding: 0;
  border: 1px solid var(--fg-dim);
  background: var(--bg);
  color: var(--fg);
  max-width: min(600px, 90vw);
  width: 100%;
  max-height: 80vh;
}

dialog::backdrop {
  background: rgb(0 0 0 / 0.85);
}

.popup-container {
  display: flex;
  flex-direction: column;
  max-height: 80vh;
}

.popup-header {
  display: flex;
  align-items: center;
  gap: 1ch;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid var(--border);
}

.prompt {
  color: var(--fg-dim);
}

.title {
  color: var(--fg);
  flex: 1;
  font-size: inherit;
  font-weight: inherit;
}

.close-btn {
  background: none;
  border: none;
  color: var(--fg);
  font: inherit;
  cursor: pointer;
  padding: 0.25rem;
}

.close-btn:hover {
  color: var(--warning);
}

.close-btn:focus-visible {
  outline: 1px solid var(--fg);
  outline-offset: 2px;
}

.popup-content {
  padding: 1rem;
  overflow-y: auto;
  flex: 1;
}
</style>
