<script setup>
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'

const props = defineProps({
  text: {
    type: String,
    required: true
  },
  speed: {
    type: Number,
    default: 50
  },
  maxIterations: {
    type: Number,
    default: 10
  },
  sequential: {
    type: Boolean,
    default: false
  },
  revealDirection: {
    type: String,
    default: 'start', // 'start' | 'end' | 'center'
    validator: (value) => ['start', 'end', 'center'].includes(value)
  },
  useOriginalCharsOnly: {
    type: Boolean,
    default: false
  },
  characters: {
    type: String,
    default: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+'
  },
  className: {
    type: String,
    default: ''
  },
  parentClassName: {
    type: String,
    default: ''
  },
  encryptedClassName: {
    type: String,
    default: ''
  },
  animateOn: {
    type: String,
    default: 'hover', // 'view' | 'hover' | 'both' | 'manual'
    validator: (value) => ['view', 'hover', 'both', 'manual'].includes(value)
  }
})

const displayText = ref(props.text)
const isHovering = ref(false)
const isScrambling = ref(false)
const revealedIndices = ref(new Set())
const hasAnimated = ref(false)
const containerRef = ref(null)

let interval = null

const availableChars = computed(() => {
  return props.useOriginalCharsOnly
    ? Array.from(new Set(props.text.split(''))).filter(char => char !== ' ')
    : props.characters.split('')
})

const getNextIndex = (revealedSet) => {
  const textLength = props.text.length
  switch (props.revealDirection) {
    case 'start':
      return revealedSet.size
    case 'end':
      return textLength - 1 - revealedSet.size
    case 'center': {
      const middle = Math.floor(textLength / 2)
      const offset = Math.floor(revealedSet.size / 2)
      const nextIndex = revealedSet.size % 2 === 0 ? middle + offset : middle - offset - 1

      if (nextIndex >= 0 && nextIndex < textLength && !revealedSet.has(nextIndex)) {
        return nextIndex
      }

      for (let i = 0; i < textLength; i++) {
        if (!revealedSet.has(i)) return i
      }
      return 0
    }
    default:
      return revealedSet.size
  }
}

const shuffleText = (originalText, currentRevealed) => {
  if (props.useOriginalCharsOnly) {
    const positions = originalText.split('').map((char, i) => ({
      char,
      isSpace: char === ' ',
      index: i,
      isRevealed: currentRevealed.has(i)
    }))

    const nonSpaceChars = positions.filter(p => !p.isSpace && !p.isRevealed).map(p => p.char)

    for (let i = nonSpaceChars.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [nonSpaceChars[i], nonSpaceChars[j]] = [nonSpaceChars[j], nonSpaceChars[i]]
    }

    let charIndex = 0
    return positions
      .map(p => {
        if (p.isSpace) return ' '
        if (p.isRevealed) return originalText[p.index]
        return nonSpaceChars[charIndex++]
      })
      .join('')
  } else {
    return originalText
      .split('')
      .map((char, i) => {
        if (char === ' ') return ' '
        if (currentRevealed.has(i)) return originalText[i]
        return availableChars.value[Math.floor(Math.random() * availableChars.value.length)]
      })
      .join('')
  }
}

const startScramble = () => {
  setIsHovering(true)
}

const stopScramble = () => {
  setIsHovering(false)
}

const setIsHovering = (value) => {
  isHovering.value = value
}

watch([isHovering, () => props.text], () => {
  if (isHovering.value) {
    isScrambling.value = true
    let currentIteration = 0
    
    // Clear any existing interval
    if (interval) clearInterval(interval)

    interval = setInterval(() => {
        const prevRevealed = revealedIndices.value
        
        if (props.sequential) {
            if (prevRevealed.size < props.text.length) {
                const nextIndex = getNextIndex(prevRevealed)
                const newRevealed = new Set(prevRevealed)
                newRevealed.add(nextIndex)
                revealedIndices.value = newRevealed
                displayText.value = shuffleText(props.text, newRevealed)
            } else {
                clearInterval(interval)
                isScrambling.value = false
            }
        } else {
            displayText.value = shuffleText(props.text, prevRevealed)
            currentIteration++
            if (currentIteration >= props.maxIterations) {
                clearInterval(interval)
                isScrambling.value = false
                displayText.value = props.text
            }
        }
    }, props.speed)
  } else {
    if (interval) clearInterval(interval)
    displayText.value = props.text
    revealedIndices.value = new Set()
    isScrambling.value = false
  }
})

// Observer logic
let observer = null

onMounted(() => {
  if (props.animateOn !== 'view' && props.animateOn !== 'both') return

  observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !hasAnimated.value) {
        setIsHovering(true)
        hasAnimated.value = true
      }
    })
  }, { threshold: 0.1 })

  if (containerRef.value) {
    observer.observe(containerRef.value)
  }
})

onUnmounted(() => {
  if (interval) clearInterval(interval)
  if (observer) observer.disconnect()
})

const hoverProps = computed(() => {
  return (props.animateOn === 'hover' || props.animateOn === 'both')
    ? {
        onMouseenter: startScramble,
        onMouseleave: stopScramble
      }
    : {}
})

defineExpose({
  startScramble,
  stopScramble
})
</script>

<template>
  <span 
    :class="['decrypted-text', parentClassName]" 
    ref="containerRef"
    v-bind="hoverProps"
  >
    <span class="sr-only">{{ displayText }}</span>

    <span aria-hidden="true" class="text-wrapper">
      <span 
        v-for="(char, index) in displayText" 
        :key="index" 
        :class="[
            (revealedIndices.has(index) || !isScrambling || !isHovering) ? className : encryptedClassName
        ]"
      >
        {{ char }}
      </span>
    </span>
  </span>
</template>

<style scoped>
.decrypted-text {
  display: inline-block;
  white-space: pre-wrap;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0,0,0,0);
  border: 0;
}

/* .text-wrapper {} */
</style>
