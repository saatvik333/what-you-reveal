/**
 * Utility functions for What You Reveal
 */

/**
 * Escapes HTML special characters to prevent XSS
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  if (typeof str !== 'string') {
    return str;
  }
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Creates and shows the enhancement suggestions popup
 * @param {Array} suggestions - Array of suggestion objects
 */
function showEnhancementPopup(suggestions) {
  // Remove existing popup if any
  const existing = document.querySelector('.terminal-popup-overlay');
  if (existing) {existing.remove();}

  // Create overlay
  const overlay = document.createElement('div');
  overlay.className = 'terminal-popup-overlay';
  
  // Create popup
  const popup = document.createElement('div');
  popup.className = 'terminal-popup';
  
  // Header
  const header = document.createElement('div');
  header.className = 'terminal-popup-header';
  header.innerHTML = `
    <span class="popup-title">> PRIVACY_ENHANCEMENTS</span>
    <button class="popup-close" aria-label="Close">[X]</button>
  `;
  
  // Content
  const content = document.createElement('div');
  content.className = 'terminal-popup-content';
  
  let contentHTML = '<div class="popup-intro">Personalized recommendations based on your current setup:</div>';
  contentHTML += '<div class="enhancement-list">';
  
  for (const suggestion of suggestions) {
    const impactClass = `impact-${suggestion.impact.toLowerCase()}`;
    const reasonHTML = suggestion.reason ? `<div class="enhancement-reason">${escapeHtml(suggestion.reason)}</div>` : '';
    contentHTML += `
      <div class="enhancement-item">
        <div class="enhancement-details">
          <div class="enhancement-action">${escapeHtml(suggestion.action)}</div>
          <div class="enhancement-desc">${escapeHtml(suggestion.description)}</div>
          ${reasonHTML}
        </div>
        <span class="impact-badge ${impactClass}">${suggestion.impact}</span>
      </div>
    `;
  }
  
  contentHTML += '</div>';
  contentHTML += '<div class="popup-footer">> Press ESC or click outside to close</div>';
  content.innerHTML = contentHTML;
  
  popup.appendChild(header);
  popup.appendChild(content);
  overlay.appendChild(popup);
  document.body.appendChild(overlay);
  
  // Animate in
  requestAnimationFrame(() => {
    overlay.classList.add('visible');
  });
  
  // Close handlers
  const closePopup = () => {
    overlay.classList.remove('visible');
    setTimeout(() => overlay.remove(), 200);
  };
  
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {closePopup();}
  });
  
  header.querySelector('.popup-close').addEventListener('click', closePopup);
  
  document.addEventListener('keydown', function escHandler(e) {
    if (e.key === 'Escape') {
      closePopup();
      document.removeEventListener('keydown', escHandler);
    }
  });
}

/**
 * Creates ASCII-style table output with filtering for unknown/unsupported values
 * @param {Object} data - Key-value pairs to display
 * @returns {string} HTML string with formatted table
 */
export function createTable(data) {
  let output = '';
  // Filter keys first
  const entries = Object.entries(data).filter(([_k, v]) => {
    if (!v) {
      return false;
    }
    const strVal = typeof v === 'object' && v.value ? v.value : String(v);
    const lower = strVal.toLowerCase();
    return (
      !lower.includes('unknown') &&
      !lower.includes('unsupported') &&
      !lower.includes('not accessible') &&
      !lower.includes('undefined') &&
      strVal !== ''
    );
  });

  if (entries.length === 0) {
    return '<span class="loading">No accessible data.</span>';
  }

  output += '<div class="terminal-table">';

  for (const [key, value] of entries) {
    // Handle nested objects or arrays by converting to string
    let displayValue = value;
    let warning = false;
    let isElement = false;
    let isInteractive = false;
    let suggestions = null;

    // Check if value is an object containing special properties
    if (typeof value === 'object' && value !== null) {
      if (value.interactive && value.suggestions) {
        // Interactive enhancement suggestions
        isInteractive = true;
        displayValue = value.value;
        suggestions = value.suggestions;
      } else if ('value' in value) {
        displayValue = value.value;
        if (value.warning) {
          warning = true;
        }
      } else if ('element' in value) {
        // Special case for DOM elements (Image/Canvas)
        displayValue = value.element;
        isElement = true;
        if (value.warning) {
          warning = true;
        }
      } else {
        displayValue = JSON.stringify(value, null, 2);
      }
    }

    // Escape values for display and attributes
    const escapedKey = escapeHtml(key);
    
    if (isInteractive) {
      // Create interactive link with data attribute for suggestions
      const suggestionsData = encodeURIComponent(JSON.stringify(suggestions));
      output += `<div class="data-row interactive-row" role="button" tabindex="0" aria-label="Click to see enhancement suggestions" data-suggestions="${suggestionsData}">`;
      output += `<span class="data-key">${escapedKey}</span>`;
      output += `<span class="data-value interactive-value">${escapeHtml(String(displayValue))} <span class="blink-arrow">▶</span></span>`;
      output += '</div>';
    } else {
      const safeValue = isElement ? '[Complex Data]' : String(displayValue).replace(/"/g, '&quot;');
      const escapedValue = isElement ? displayValue : escapeHtml(String(displayValue));

      output += `<div class="data-row${warning ? ' warning' : ''}${!isElement ? ' copyable' : ''}${isElement ? ' has-element' : ''}" ${!isElement ? `role="button" tabindex="0" aria-label="Copy ${escapedKey}: ${safeValue}" data-copy="${safeValue}"` : ''}>`;
      output += `<span class="data-key">${escapedKey}</span>`;
      output += `<span class="data-value">${escapedValue}</span>`;
      output += '</div>';
    }
  }
  output += '</div>';
  return output;
}


// Global Event Delegation for Copy and Interactive Functionality
if (typeof document !== 'undefined') {
  document.addEventListener('click', handleCopyClick);
  document.addEventListener('click', handleInteractiveClick);
  document.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.closest('.copyable')) {
      e.preventDefault();
      handleCopyClick(e);
    }
    if ((e.key === 'Enter' || e.key === ' ') && e.target.closest('.interactive-row')) {
      e.preventDefault();
      handleInteractiveClick(e);
    }
  });
}

/**
 * Handles interactive row clicks for enhancement popup
 * @param {Event} e
 */
function handleInteractiveClick(e) {
  const row = e.target.closest('.interactive-row');
  if (!row) {return;}

  const suggestionsData = row.getAttribute('data-suggestions');
  if (suggestionsData) {
    try {
      const suggestions = JSON.parse(decodeURIComponent(suggestionsData));
      showEnhancementPopup(suggestions);
    } catch (err) {
      console.error('Failed to parse suggestions:', err);
    }
  }
}

/**
 * Handles copy actions from delegation
 * @param {Event} e
 */
async function handleCopyClick(e) {
  const row = e.target.closest('.copyable');
  if (!row) {
    return;
  }

  const text = row.getAttribute('data-copy');
  if (text) {
    try {
      await navigator.clipboard.writeText(text);
      flashFeedback(row);
    } catch (err) {
      console.error('Failed to copy:', err);
      // Fallback for non-secure contexts if needed, but modern clipboard API usually requires secure context.
      // In a real terminal app, we might show a "ACCESS DENIED" error.
    }
  }
}

/**
 * Visual feedback for copy action
 * @param {HTMLElement} row
 */
function flashFeedback(row) {
  row.classList.add('copied');

  // Remove class after animation completes (matches CSS animation duration)
  setTimeout(() => {
    row.classList.remove('copied');
  }, 500);
}

/**
 * Global Observer for reveal effects
 */
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const content = el.getAttribute('data-content');
        if (content) {
          // Determine speed based on content length
          const speed = 5;
          typeWriterEffect(el, content, speed);
          revealObserver.unobserve(el);
        }
      }
    });
  },
  { threshold: 0.1 },
);

/**
 * Simulates typing effect for text content.
 * Note: For HTML tables, we'll blast the HTML but animate the lines if possible,
 * or just fade in to avoid breaking markup structure during typing.
 * @param {HTMLElement} element
 * @param {string} html
 * @param {number} speed
 */
function typeWriterEffect(element, html, speed) {
  // If it's a table or pre block, just reveal it
  // Check for our custom table or pre or if it contains an image/canvas tag which shouldn't be typed
  if (
    html.startsWith('<div class="terminal-table">') ||
    html.startsWith('<pre>') ||
    html.includes('<pre>') ||
    html.includes('<img') ||
    html.includes('<canvas')
  ) {
    element.innerHTML = html;
    element.style.opacity = '1';
    return;
  }

  // For simple text, we can type it
  element.textContent = '';
  element.style.opacity = '1';

  let i = 0;
  function type() {
    if (i < html.length) {
      element.textContent += html.charAt(i);
      i++;
      setTimeout(type, speed);
    }
  }
  type();
}

/**
 * Renders data to a DOM element with effect
 * @param {string} elementId - ID of target element
 * @param {Object} data - Data to render
 */
export function renderToElement(elementId, data) {
  const element = document.getElementById(elementId);
  if (element) {
    const htmlContent = createTable(data);

    // If element is already visible, run immediately?
    // Or strictly use observer?
    // Let's use observer for everything to be consistent.

    element.setAttribute('data-content', htmlContent);
    element.style.opacity = '0'; // Hide initially
    revealObserver.observe(element);
  }
}
