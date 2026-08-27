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
  const decimals = stepString.includes('.') ? stepString.split('.')[1].length : 0;

  return parseFloat(Number(value).toFixed(decimals));
};
