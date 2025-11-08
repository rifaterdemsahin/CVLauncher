/**
 * CVLauncher - Application JavaScript
 * Handles copy-to-clipboard functionality and user interactions
 */

/**
 * Copy CV content to clipboard
 * @param {string} elementId - ID of the element containing CV content
 * @param {HTMLElement} button - The button element that was clicked
 */
function copyToClipboard(elementId, button) {
    const element = document.getElementById(elementId);
    
    if (!element) {
        console.error('Element not found:', elementId);
        return;
    }
    
    // Get the text content
    const text = element.innerText;
    
    // Modern clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text)
            .then(() => {
                showNotification();
                highlightButton(button);
            })
            .catch(err => {
                console.error('Failed to copy:', err);
                fallbackCopy(text, button);
            });
    } else {
        // Fallback for older browsers
        fallbackCopy(text, button);
    }
}

/**
 * Fallback copy method for browsers that don't support clipboard API
 * @param {string} text - Text to copy
 * @param {HTMLElement} button - The button element that was clicked
 */
function fallbackCopy(text, button) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showNotification();
            highlightButton(button);
        } else {
            console.error('Fallback copy failed');
        }
    } catch (err) {
        console.error('Fallback copy error:', err);
    }
    
    document.body.removeChild(textArea);
}

/**
 * Show success notification
 */
function showNotification() {
    const notification = document.getElementById('notification');
    notification.classList.remove('hidden');
    
    // Hide after 2 seconds
    setTimeout(() => {
        notification.classList.add('hidden');
    }, 2000);
}

/**
 * Highlight button to show copy success
 * @param {HTMLElement} button - The button element to highlight
 */
function highlightButton(button) {
    const originalText = button.textContent;
    button.classList.add('copied');
    button.textContent = '✓ Copied!';
    
    // Reset after 2 seconds
    setTimeout(() => {
        button.classList.remove('copied');
        button.textContent = originalText;
    }, 2000);
}

// Add keyboard support (optional enhancement)
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K to focus on first copy button (optional shortcut)
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const firstButton = document.querySelector('.copy-btn');
        if (firstButton) {
            firstButton.focus();
        }
    }
});

// Log initialization
console.log('CVLauncher initialized successfully');
