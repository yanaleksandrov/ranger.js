import { createElement, NAVIGATION_KEYS, formatDisplayValue } from './helpers.js';

/**
 * Create the floating value label(s) above the slider handle(s).
 *
 * @param {object} instance
 * @returns {HTMLElement}
 */
export const createLabel = (instance) => {
  const label = createElement('div', instance.classes.label);
  // Purely a visual duplicate of the value already exposed via the slider's
  // own aria-valuenow/aria-valuetext — hide it from assistive tech so it
  // isn't announced twice.
  label.setAttribute('aria-hidden', 'true');

  instance.labelFrom = label.appendChild(createElement('div', instance.classes.labelItem));
  instance.fromSlider.addEventListener('input', () => calcPositions(instance));

  if (instance.isRange) {
    instance.labelTo = label.appendChild(createElement('div', instance.classes.labelItem));
    instance.toSlider.addEventListener('input', () => calcPositions(instance));
  }

  instance.wrapper.appendChild(label);
  calcPositions(instance);

  if (instance.labelOnDragOnly) {
    bindDragVisibility(instance, label);
  }

  return label;
};

// Fades the label out except while a handle is actively being dragged or
// nudged via keyboard (see .ranger-label.is-idle in core.scss for the
// opacity transition — it's what makes this animate instead of snapping).
const bindDragVisibility = (instance, label) => {
  label.classList.add('is-idle');

  const show = () => {
    label.classList.remove('is-idle');
    calcPositions(instance);
  };
  const hide = () => {
    label.classList.add('is-idle');
  };

  [instance.fromSlider, instance.toSlider].filter(Boolean).forEach((slider) => {
    slider.addEventListener('pointerdown', show);
    slider.addEventListener('keydown', (event) => NAVIGATION_KEYS.includes(event.key) && show());
    slider.addEventListener('keyup', (event) => NAVIGATION_KEYS.includes(event.key) && hide());
  });

  document.addEventListener('pointerup', hide);
};

const calcPositions = (instance) => {
  const { fromSlider, toSlider, labelFrom, labelTo } = instance;
  const formatValue = (value) => formatDisplayValue(instance, value);

  const setLabelStyle = (label, value, percent) => {
    label.innerText = formatValue(value);
    label.style.insetInlineStart = `calc(${percent}% - ${label.offsetWidth / 2}px)`;
  };

  const percentFrom = calculatePercent(+fromSlider.min, +fromSlider.max, +fromSlider.value);
  setLabelStyle(labelFrom, fromSlider.value, percentFrom);

  if (!instance.isRange) {
    return;
  }

  const percentTo = calculatePercent(+toSlider.min, +toSlider.max, +toSlider.value);
  setLabelStyle(labelTo, toSlider.value, percentTo);

  // Gap between whichever edges face each other — direction-agnostic, so it
  // still measures the real gap when RTL puts labelTo physically to the left.
  const fromRect = labelFrom.getBoundingClientRect();
  const toRect = labelTo.getBoundingClientRect();
  const distanceX = Math.max(fromRect.left, toRect.left) - Math.min(fromRect.right, toRect.right);

  if (distanceX < 10) {
    labelFrom.innerText = fromSlider.value === toSlider.value
      ? formatValue(fromSlider.value)
      : `${formatValue(fromSlider.value)} – ${formatValue(toSlider.value)}`;

    labelFrom.style.insetInlineStart = `calc(${percentFrom}% + ${(percentTo - percentFrom) / 2}% - ${labelFrom.offsetWidth / 2}px)`;
    labelTo.style.visibility = 'hidden';
  } else {
    labelTo.style.visibility = 'visible';
  }
};

const calculatePercent = (start, end, value) => ((value - start) / (end - start)) * 100;
