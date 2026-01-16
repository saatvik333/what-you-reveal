/**
 * DecryptedText - Vanilla JS Implementation
 *
 * Scrambling text reveal effect ported from React component.
 * Uses data attributes for configuration.
 *
 * Usage:
 * <span data-decrypt
 *       data-decrypt-speed="50"
 *       data-decrypt-iterations="10"
 *       data-decrypt-trigger="hover"
 *       data-decrypt-sequential="false"
 *       data-decrypt-direction="start">
 *   Text to animate
 * </span>
 */

const DEFAULT_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+0123456789';

class DecryptedText {
  constructor(element, options = {}) {
    this.element = element;
    this.originalText = element.textContent.trim();

    // Parse options from data attributes or defaults
    this.speed = parseInt(options.speed || element.dataset.decryptSpeed || 50);
    this.maxIterations = parseInt(options.iterations || element.dataset.decryptIterations || 10);
    this.sequential =
      (options.sequential || element.dataset.decryptSequential || 'true') === 'true';
    this.revealDirection = options.direction || element.dataset.decryptDirection || 'start';
    this.useOriginalCharsOnly =
      (options.originalChars || element.dataset.decryptOriginalChars || 'false') === 'true';
    this.characters = options.characters || element.dataset.decryptCharacters || DEFAULT_CHARS;
    this.trigger = options.trigger || element.dataset.decryptTrigger || 'hover';

    this.isAnimating = false;
    this.hasAnimated = false;
    this.revealedIndices = new Set();
    this.interval = null;

    this.init();
  }

  init() {
    // Store original text and prepare element
    this.element.setAttribute('aria-label', this.originalText);

    // Set up triggers
    if (this.trigger === 'hover' || this.trigger === 'both') {
      this.element.addEventListener('mouseenter', () => this.startAnimation());
      this.element.addEventListener('mouseleave', () => this.resetAnimation());
    }

    if (this.trigger === 'view' || this.trigger === 'both') {
      this.setupIntersectionObserver();
    }

    // Initial render
    this.render(this.originalText);
  }

  setupIntersectionObserver() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !this.hasAnimated) {
            this.startAnimation();
            this.hasAnimated = true;
          }
        });
      },
      { threshold: 0.1 },
    );

    observer.observe(this.element);
  }

  startAnimation() {
    if (this.isAnimating) {
      return;
    }

    this.isAnimating = true;
    this.revealedIndices = new Set();
    let currentIteration = 0;

    const availableChars = this.useOriginalCharsOnly
      ? [...new Set(this.originalText.split(''))].filter((c) => c !== ' ')
      : this.characters.split('');

    this.interval = setInterval(() => {
      if (this.sequential) {
        // Sequential reveal
        if (this.revealedIndices.size < this.originalText.length) {
          const nextIndex = this.getNextIndex();
          this.revealedIndices.add(nextIndex);
          this.render(this.shuffleText(availableChars));
        } else {
          this.completeAnimation();
        }
      } else {
        // Random scramble then reveal all
        currentIteration++;
        if (currentIteration >= this.maxIterations) {
          this.completeAnimation();
        } else {
          this.render(this.shuffleText(availableChars));
        }
      }
    }, this.speed);
  }

  getNextIndex() {
    const len = this.originalText.length;
    const revealed = this.revealedIndices;

    switch (this.revealDirection) {
      case 'end':
        return len - 1 - revealed.size;
      case 'center': {
        const middle = Math.floor(len / 2);
        const offset = Math.floor(revealed.size / 2);
        const nextIndex = revealed.size % 2 === 0 ? middle + offset : middle - offset - 1;

        if (nextIndex >= 0 && nextIndex < len && !revealed.has(nextIndex)) {
          return nextIndex;
        }
        // Fallback
        for (let i = 0; i < len; i++) {
          if (!revealed.has(i)) {
            return i;
          }
        }
        return 0;
      }
      case 'start':
      default:
        return revealed.size;
    }
  }

  shuffleText(availableChars) {
    return this.originalText
      .split('')
      .map((char, i) => {
        if (char === ' ') {
          return ' ';
        }
        if (this.revealedIndices.has(i)) {
          return this.originalText[i];
        }
        return availableChars[Math.floor(Math.random() * availableChars.length)];
      })
      .join('');
  }

  render(text) {
    // Create spans for each character
    const html = text
      .split('')
      .map((char, index) => {
        const isRevealed = this.revealedIndices.has(index) || !this.isAnimating;
        const className = isRevealed ? 'decrypt-char revealed' : 'decrypt-char encrypted';
        return `<span class="${className}">${char === ' ' ? '&nbsp;' : this.escapeHtml(char)}</span>`;
      })
      .join('');

    this.element.innerHTML = html;
  }

  escapeHtml(char) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return map[char] || char;
  }

  completeAnimation() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isAnimating = false;

    // Reveal all
    for (let i = 0; i < this.originalText.length; i++) {
      this.revealedIndices.add(i);
    }
    this.render(this.originalText);
  }

  resetAnimation() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isAnimating = false;
    this.revealedIndices = new Set();

    // Don't reset hasAnimated for view trigger
    if (this.trigger === 'hover') {
      this.render(this.originalText);
    }
  }
}

/**
 * Initialize all elements with data-decrypt attribute
 */
export function initDecryptedText() {
  const elements = document.querySelectorAll('[data-decrypt]');
  const instances = [];

  elements.forEach((element) => {
    instances.push(new DecryptedText(element));
  });

  return instances;
}

/**
 * Create DecryptedText instance for a specific element
 */
export function createDecryptedText(element, options) {
  return new DecryptedText(element, options);
}

/**
 * Utility to programmatically trigger animation on an element
 */
export function triggerDecrypt(element) {
  const instance = new DecryptedText(element, { trigger: 'manual' });
  instance.startAnimation();
  return instance;
}

export default DecryptedText;
