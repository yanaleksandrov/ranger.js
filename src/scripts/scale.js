import { createElement, roundToStep } from './helpers';

/**
 * Create the tick scale below the slider: `scaleTicksCount` labeled major
 * ticks, with `scaleMinorTicksCount` unlabeled minor ticks evenly splitting
 * each gap between them. Every tick also carries a live `--ranger-scale`
 * custom property (0–1, how close the nearest handle is, within
 * `scaleAnimatedTicksCount` ticks) that consumer CSS can read to animate
 * it — e.g. grow its height as a handle approaches, for an equalizer-style
 * effect. Major-tick labels are re-shown/hidden to avoid overlap whenever
 * the slider's rendered width changes.
 *
 * @param {object} instance
 * @returns {HTMLElement}
 */
export const createScale = (instance) => {
  const scale = createElement('div', instance.classes.scale);
  // Purely a visual duplicate of the value already exposed via the slider's
  // own aria-valuenow/aria-valuetext — hide it from assistive tech so it
  // isn't announced twice.
  scale.setAttribute('aria-hidden', 'true');

  const minorStep = instance.scaleMinorTicksCount + 1;
  const segments = instance.scaleTicksCount * minorStep;

  instance.scaleTicks = calcTicks(instance, segments).map((value, index) => {
    const isMajor = index % minorStep === 0;
    const tick = createElement('span', isMajor ? instance.classes.scaleTick : instance.classes.scaleMinorTick);
    let label = null;

    if (isMajor) {
      const step = roundToStep(value, instance.fromSlider.step || 1);
      const text = instance.format
        ? instance.format(step)
        : `${instance.scaleTickPrefix}${step}${instance.scaleTickSuffix}`;

      label = createElement('ins', '', text);
      tick.appendChild(label);
    }

    scale.appendChild(tick);

    return { value, tick, label, isMajor };
  });

  instance.wrapper.appendChild(scale);
  updateScale(instance);
  arrangeScale(instance);

  instance.fromSlider.addEventListener('input', () => updateScale(instance));
  if (instance.isRange) {
    instance.toSlider.addEventListener('input', () => updateScale(instance));
  }
  new ResizeObserver(() => arrangeScale(instance)).observe(instance.wrapper);

  return scale;
};

// Sets each tick's --ranger-scale (0–1) from its distance, in tick-widths,
// to the nearest handle — 1 at the handle, 0 past scaleAnimatedTicksCount.
const updateScale = (instance) => {
  const { fromSlider, toSlider, scaleTicks, scaleAnimatedTicksCount } = instance;

  const min = Number(fromSlider.min);
  const max = Number(fromSlider.max);
  const tickSpacing = (max - min) / (scaleTicks.length - 1);
  const handleValues = toSlider ? [Number(fromSlider.value), Number(toSlider.value)] : [Number(fromSlider.value)];

  scaleTicks.forEach(({ value, tick }) => {
    const distance = Math.min(...handleValues.map((handleValue) => Math.abs(handleValue - value)));
    const scale = Math.max(0, 1 - distance / tickSpacing / scaleAnimatedTicksCount);

    tick.style.setProperty('--ranger-scale', scale.toFixed(2));
  });
};

// Shows every Nth major label — the min and max always stay visible, and N
// (the "skip") is chosen so it evenly divides the tick count, which is what
// actually guarantees uniform spacing: sampling by rounding instead (the
// previous approach) produces gaps like 3,4,3,3,4,3 — visibly irregular.
const arrangeScale = (instance) => {
  const majors = instance.scaleTicks.filter((tick) => tick.isMajor);
  const lastIndex = majors.length - 1;
  if (lastIndex < 1) {
    return;
  }

  // Measured directly from the first/last tick's real position, rather than
  // the wrapper's own width, which ignores .ranger-scale's own padding and
  // so overestimates the space actually available for labels. Math.abs
  // keeps this correct under RTL too, where the flex order visually mirrors
  // and the "last" (highest-value) tick ends up physically on the left.
  const trackWidth = Math.abs(majors[lastIndex].tick.getBoundingClientRect().left - majors[0].tick.getBoundingClientRect().left);
  const maxLabelWidth = Math.max(...majors.map(({ label }) => label.offsetWidth));
  const minSkip = maxLabelWidth > 0 && trackWidth > 0 ? Math.ceil((maxLabelWidth * lastIndex) / trackWidth) : 1;
  const skip = findSkip(lastIndex, Math.max(1, minSkip));

  majors.forEach(({ label }, index) => {
    label.style.visibility = index % skip === 0 ? 'visible' : 'hidden';
  });
};

// Smallest divisor of lastIndex that's >= minSkip, so 0 and lastIndex are
// always included — falls back to lastIndex itself (min/max only) if none
// of the divisors are wide enough to avoid overlap.
const findSkip = (lastIndex, minSkip) => {
  for (let skip = minSkip; skip <= lastIndex; skip++) {
    if (lastIndex % skip === 0) {
      return skip;
    }
  }
  return lastIndex;
};

/**
 * Calc `segments + 1` values evenly spread across the slider's min/max range.
 *
 * @param {object} instance
 * @param {number} segments
 * @returns {number[]}
 */
const calcTicks = (instance, segments) => {
  const min = Number(instance.fromSlider.min);
  const max = Number(instance.fromSlider.max);

  return Array.from({ length: segments + 1 }, (_, index) => min + ((max - min) / segments) * index);
};
