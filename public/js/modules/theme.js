/**
 * Theme Manager Module
 * Handles rotating through multiple themes
 */

// Available themes in order of rotation
const THEMES = [
    { 
        name: 'crt', 
        label: 'CRT GREEN', 
        class: '' // Default, no class needed
    },
    { 
        name: 'cyberpunk', 
        label: 'CYBERPUNK', 
        class: 'theme-cyberpunk' 
    },
    { 
        name: 'security', 
        label: 'SECURITY HUD', 
        class: 'theme-security' 
    },

    { 
        name: 'mrrobot', 
        label: 'MR. ROBOT', 
        class: 'theme-mrrobot' 
    }
];

let currentThemeIndex = 0;

/**
 * Get current theme name from localStorage or default
 */
function loadSavedTheme() {
    const saved = localStorage.getItem('wyr-theme');
    if (saved) {
        const index = THEMES.findIndex(t => t.name === saved);
        if (index !== -1) {
            currentThemeIndex = index;
        }
    }
}

/**
 * Apply the current theme to the document
 */
function applyTheme() {
    const theme = THEMES[currentThemeIndex];
    
    // Remove all theme classes
    THEMES.forEach(t => {
        if (t.class) {
            document.body.classList.remove(t.class);
        }
    });

    
    // Apply new theme class
    if (theme.class) {
        document.body.classList.add(theme.class);
    }
    
    // Save to localStorage
    localStorage.setItem('wyr-theme', theme.name);
    
    // Update button text
    updateButtonText();
}

/**
 * Update the theme button text to show next theme
 */
function updateButtonText() {
    const btn = document.getElementById('theme-toggle');
    if (btn) {
        const nextIndex = (currentThemeIndex + 1) % THEMES.length;
        const nextTheme = THEMES[nextIndex];
        btn.textContent = `[ THEME: ${THEMES[currentThemeIndex].label} ]`;
        btn.setAttribute('title', `Click to switch to ${nextTheme.label}`);
    }
}

/**
 * Cycle to the next theme
 */
export function cycleTheme() {
    currentThemeIndex = (currentThemeIndex + 1) % THEMES.length;
    applyTheme();
    
    // Add a quick flash effect on theme change
    document.body.style.opacity = '0.8';
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
}

/**
 * Initialize the theme system
 */
export function initTheme() {
    loadSavedTheme();
    applyTheme();
}

/**
 * Get current theme info
 */
export function getCurrentTheme() {
    return THEMES[currentThemeIndex];
}

/**
 * Get all available themes
 */
export function getThemes() {
    return [...THEMES];
}
