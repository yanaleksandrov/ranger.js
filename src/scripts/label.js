import { createElement } from './helpers.js';

/**
 * Create the floating value label(s) above the slider handle(s).
 *
 * @param {object} instance
 * @returns {HTMLElement}
 */
export const createLabel = (instance) => {
  const label = createElement('div', instance.classes.label);

  instance.labelFrom = label.appendChild(createElement('div', instance.classes.labelTick));
  instance.fromSlider.addEventListener('input', () => calcPositions(instance));

  if (instance.isRange) {
    instance.labelTo = label.appendChild(createElement('div', instance.classes.labelTick));
    instance.toSlider.addEventListener('input', () => calcPositions(instance));
  }

  instance.wrapper.appendChild(label);
  calcPositions(instance);

  if (instance.labelOnDragOnly) {
    bindDragVisibility(instance, label);
  }

  return label;
};

const NAVIGATION_KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'];

// Keeps the label hidden except while a handle is actively being dragged or
// nudged via keyboard. Uses `display`, not `visibility` — the collision-merge
// logic above sets labelTo's own `visibility` directly, and a descendant's
// explicit `visibility: visible` overrides an ancestor's `hidden`, which
// `display: none` doesn't allow.
const bindDragVisibility = (instance, label) => {
  label.style.display = 'none';

  const show = () => {
    label.style.display = '';
    calcPositions(instance);
  };
  const hide = () => {
    label.style.display = 'none';
  };

  [instance.fromSlider, instance.toSlider].filter(Boolean).forEach((slider) => {
    slider.addEventListener('pointerdown', show);
    slider.addEventListener('keydown', (event) => NAVIGATION_KEYS.includes(event.key) && show());
    slider.addEventListener('keyup', (event) => NAVIGATION_KEYS.includes(event.key) && hide());
  });

  document.addEventListener('pointerup', hide);
};

const calcPositions = (instance) => {
  const { fromSlider, toSlider, labelFrom, labelTo, labelPrefix, labelSuffix, format } = instance;
  const formatValue = (value) => format ? format(Number(value)) : `${labelPrefix}${value}${labelSuffix}`;

  const setLabelStyle = (label, value, percent) => {
    label.innerText = formatValue(value);
    label.style.left = `calc(${percent}% - ${label.offsetWidth / 2}px)`;
  };

  const percentFrom = calculatePercent(+fromSlider.min, +fromSlider.max, +fromSlider.value);
  setLabelStyle(labelFrom, fromSlider.value, percentFrom);

  if (!instance.isRange) {
    return;
  }

  const percentTo = calculatePercent(+toSlider.min, +toSlider.max, +toSlider.value);
  setLabelStyle(labelTo, toSlider.value, percentTo);

  const distanceX = labelTo.getBoundingClientRect().left - labelFrom.getBoundingClientRect().right;

  if (distanceX < 10) {
    labelFrom.innerText = fromSlider.value === toSlider.value
      ? formatValue(fromSlider.value)
      : `${formatValue(fromSlider.value)} – ${formatValue(toSlider.value)}`;

    labelFrom.style.left = `calc(${percentFrom}% + ${(percentTo - percentFrom) / 2}% - ${labelFrom.offsetWidth / 2}px)`;
    labelTo.style.visibility = 'hidden';
  } else {
    labelTo.style.visibility = 'visible';
  }
};

const calculatePercent = (start, end, value) => ((value - start) / (end - start)) * 100;
