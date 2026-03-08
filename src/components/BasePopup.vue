<script setup>
import { ref, watch, onUnmounted, nextTick } from 'vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    required: true,
  },
  prompt: {
    type: String,
    default: 'root@privacy:~#',
  },
});

const emit = defineEmits(['close']);
const containerRef = ref(null);
let previouslyFocused = null;

function close() {
  emit('close');
}

function handleKeydown(e) {
  if (e.key === 'Escape') {
    close();
    return;
  }

  // Focus trapping
  if (e.key === 'Tab' && containerRef.value) {
    const focusable = containerRef.value.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }
}

watch(() => props.isOpen, async (newVal) => {
  if (newVal) {
    previouslyFocused = document.activeElement;
    document.addEventListener('keydown', handleKeydown);
    await nextTick();
    // Focus the close button when the dialog opens
    if (containerRef.value) {
      const closeBtn = containerRef.value.querySelector('.close-btn');
      if (closeBtn) closeBtn.focus();
    }
  } else {
    document.removeEventListener('keydown', handleKeydown);
    // Restore focus to the element that opened the popup
    if (previouslyFocused && previouslyFocused.focus) {
      previouslyFocused.focus();
    }
  }
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="popup-overlay"
      @click.self="close"
      role="dialog"
      aria-modal="true"
      :aria-label="title"
    >
      <div class="popup-container" ref="containerRef">
        <div class="popup-header">
          <span class="prompt">{{ prompt }}</span>
          <span class="title">{{ title }}</span>
          <button class="close-btn" @click="close" aria-label="Close dialog">[X]</button>
        </div>

        <div class="popup-content">
          <slot />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.popup-container {
  background: var(--bg);
  border: 1px solid var(--fg-dim);
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 0 30px rgba(0, 255, 0, 0.1);
}

.popup-header {
  display: flex;
  align-items: center;
  gap: 1ch;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid var(--border);
  background: var(--bg-dim);
}

.prompt {
  color: var(--fg-dim);
}

.title {
  color: var(--fg);
  flex: 1;
}

.close-btn {
  background: none;
  border: none;
  color: var(--fg);
  font-family: inherit;
  font-size: inherit;
  cursor: pointer;
  padding: 0.25rem;
}

.close-btn:hover {
  color: var(--warning);
}

.close-btn:focus {
  outline: 1px solid var(--fg);
  outline-offset: 2px;
}

.popup-content {
  padding: 1rem;
  overflow-y: auto;
  flex: 1;
}
</style>
