/**
 * Create a new DOM element.
 *
 * @param {string} tag
 * @param {string} [classes]
 * @param {string} [content]
 * @returns {HTMLElement}
 */
export const createElement = (tag, classes, content = '') => {
  const element = document.createElement(tag);

  if (classes) {
    element.className = classes;
  }

  if (content) {
    element.innerHTML = content;
  }
  return element;
};

/**
 * Round a value to the precision of the given step (supports "any").
 *
 * @param {number|string} value
 * @param {number|string} step
 * @returns {number}
 */
export const roundToStep = (value, step) => {
  const stepString = String(step);

  if (stepString.toLowerCase() === 'any') {
    return Number(value);
  }

  const decimals = stepString.includes('.') ? stepString.split('.')[1].length : 0;

  return parseFloat(Number(value).toFixed(decimals));
};

// Keys treated as an interactive nudge — used to detect keyboard-driven
// "dragging" (label visibility, onStart/onEnd callbacks) the same way a
// pointerdown/pointerup pair does for mouse/touch.
export const NAVIGATION_KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'];

/**
 * Format a raw slider value the same way everywhere it's shown to a human —
 * the floating label, aria-valuetext, and anywhere else that needs it.
 *
 * @param {object} instance
 * @param {number|string} value
 * @returns {string}
 */
export const formatDisplayValue = (instance, value) => (
  instance.format ? String(instance.format(Number(value))) : `${instance.labelPrefix}${value}${instance.labelSuffix}`
);
