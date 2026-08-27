import { createScale } from './scripts/scale';
import { createLabel } from './scripts/label';
import { roundToStep } from './scripts/helpers';

const DEFAULTS = {
  classes: {
    container: 'ranger',
    fill: 'ranger-fill',
    scale: 'ranger-scale',
    scaleTick: 'ranger-scale-tick',
    scaleTickMinor: 'ranger-scale-tick ranger-scale-tick--minor',
    label: 'ranger-label',
    labelTick: 'ranger-label-item',
  },

  scaleTickPrefix: '',
  scaleTickSuffix: '',
  scaleTicksCount: 10,
  // Unlabeled ticks inserted between each pair of major ticks, evenly
  // splitting that gap — e.g. 3 turns 1 gap into 4 equal minor steps.
  scaleMinorTicksCount: 0,
  // How many ticks on EITHER side of a handle get a nonzero --ranger-scale,
  // tapering to 0 at that distance — one shared radius, applied symmetrically.
  scaleAnimatedTicksCount: 1,

  labelIsVisible: true,
  labelPrefix: '',
  labelSuffix: '',
  // Keep the label hidden except while a handle is actively being dragged
  // or nudged via keyboard.
  labelOnDragOnly: false,

  disabled: false,

  // Array of display values (labels, dates, price tiers, ...) — the slider
  // becomes an index picker over it (min/max/step are derived automatically).
  values: null,
  // (value) => string. Overrides labelPrefix/Suffix + scaleTickPrefix/Suffix
  // wherever a value is displayed. Auto-derived when `values` or `logScale`
  // is set, unless one is explicitly provided here too.
  format: null,
  // Exponential mapping between the slider's own min/max (min must be > 0)
  // — drag position stays linear, only the displayed/formatted value isn't.
  logScale: false,

  // Values that magnetically pull a handle in once it's dragged within
  // snapThreshold (a fraction of the min–max range) of them.
  snapPoints: [],
  snapThreshold: 0.02,
  // Step used for Shift+Arrow nudges; defaults to step/10 when unset.
  fineStep: null,
  // Minimum distance the two handles must keep apart (range mode only).
  minGap: 0,

  // Optional external <input> elements kept in sync with the slider(s).
  fromInput: null,
  toInput: null,
};

export default class Ranger {
  /**
   * @param {string|HTMLInputElement} target CSS selector or a `<input type="range">` element.
   * @param {object} [options]
   */
  constructor(target, options = {}) {
    this.fromSlider = typeof target === 'string' ? document.querySelector(target) : target;

    if (!(this.fromSlider instanceof HTMLInputElement)) {
      throw new Error(`Ranger: no slider element found for "${target}"`);
    }

    this.toSlider = null;

    Object.assign(this, DEFAULTS, options, {
      classes: { ...DEFAULTS.classes, ...options.classes },
    });

    // One major tick per value by default — otherwise ticks land at
    // fractional indexes, which round to the same value and duplicate.
    if (this.values && options.scaleTicksCount === undefined) {
      this.scaleTicksCount = this.values.length - 1;
    }

    this.initialize();
  }

  get isRange() {
    return this.toSlider !== null;
  }

  initialize() {
    if (this.values) {
      this.fromSlider.min = 0;
      this.fromSlider.max = this.values.length - 1;
      this.fromSlider.step = 1;
      this.format ||= (index) => this.values[Math.round(index)] ?? index;
    }

    if (this.logScale) {
      const min = Number(this.fromSlider.min);
      const max = Number(this.fromSlider.max);
      this.format ||= (position) => Math.round(min * (max / min) ** ((position - min) / (max - min)));
    }

    const wrapper = document.createElement('div');
    wrapper.classList.add(this.classes.container);

    this.fromSlider.parentNode.insertBefore(wrapper, this.fromSlider);
    wrapper.appendChild(this.fromSlider);
    this.wrapper = wrapper;

    this.fill = wrapper.appendChild(document.createElement('div'));
    this.fill.className = this.classes.fill;

    if (this.fromSlider.hasAttribute('data-max-value')) {
      this.toSlider = this.fromSlider.cloneNode(false);
      this.toSlider.removeAttribute('data-max-value');
      this.toSlider.removeAttribute('id');
      this.toSlider.classList.add('ranger-input--to');
      this.toSlider.value = Math.max(Number(this.fromSlider.value), this.parseMaxValue());

      wrapper.appendChild(this.toSlider);
      this.setToggleAccessible(this.toSlider);
    }

    if (this.disabled) {
      this.fromSlider.disabled = true;
      if (this.toSlider) {
        this.toSlider.disabled = true;
      }
      wrapper.classList.add('is-disabled');
    } else if (this.isRange) {
      this.fill.classList.add('is-draggable');
    }

    // Snapshot of what each handle started at, for dblclick-to-reset.
    this.defaultFromValue = this.fromSlider.value;
    this.defaultToValue = this.toSlider ? this.toSlider.value : null;

    this.fillSlider();
    this.addListeners();

    if (this.labelIsVisible) {
      this.label = createLabel(this);
    }
    if (this.scaleTicksCount > 0) {
      this.scale = createScale(this);
    }
  }

  /**
   * Resolve the upper handle's starting value from `data-max-value`, falling
   * back to the slider's own `max` when the attribute is empty or invalid.
   *
   * @returns {number}
   */
  parseMaxValue() {
    const attr = this.fromSlider.dataset.maxValue;
    const parsed = attr ? Number(attr) : NaN;

    return Number.isNaN(parsed) ? Number(this.fromSlider.max) : parsed;
  }

  addListeners() {
    this.fromSlider.oninput = () => this.controlFromSlider();
    this.fromSlider.addEventListener('keydown', (event) => this.handleKeydown(event, this.fromSlider));
    this.fromSlider.addEventListener('dblclick', () => this.resetSlider(this.fromSlider, this.defaultFromValue));

    if (this.isRange) {
      this.toSlider.oninput = () => this.controlToSlider();
      this.toSlider.addEventListener('keydown', (event) => this.handleKeydown(event, this.toSlider));
      this.toSlider.addEventListener('dblclick', () => this.resetSlider(this.toSlider, this.defaultToValue));

      if (!this.disabled) {
        this.fill.addEventListener('pointerdown', (event) => this.handleFillDragStart(event));
      }
    }

    this.wrapper.addEventListener('click', (event) => this.handleTrackClick(event));

    [['fromInput', 'fromSlider'], ['toInput', 'toSlider']].forEach(([inputKey, sliderKey]) => {
      const input = this[inputKey];

      if (input) {
        input.addEventListener('input', () => {
          this[sliderKey].value = input.value;
          this[sliderKey].dispatchEvent(new Event('input'));
        });
      }
    });
  }

  controlFromSlider() {
    if (!this.isRange) {
      this.fromSlider.value = this.resolveValue(this.fromSlider.value, this.fromSlider.step);
      this.fillSlider();

      if (this.fromInput) {
        this.fromInput.value = this.fromSlider.value;
      }
      return;
    }

    const [from, to] = this.getParsed(this.fromSlider, this.toSlider);
    const ceiling = to - this.minGap;
    const value = from > ceiling ? roundToStep(ceiling, this.fromSlider.step) : from;

    this.fromSlider.value = value;
    this.fillSlider();

    if (this.fromInput) {
      this.fromInput.value = value;
    }
  }

  controlToSlider() {
    const [from, to] = this.getParsed(this.fromSlider, this.toSlider);
    const floor = from + this.minGap;
    const value = Math.max(to, roundToStep(floor, this.fromSlider.step));

    this.toSlider.value = value;
    this.fillSlider();
    this.setToggleAccessible(this.toSlider);

    if (this.toInput) {
      this.toInput.value = value;
    }
  }

  getParsed(currentFrom, currentTo) {
    return [this.resolveValue(currentFrom.value, currentFrom.step), this.resolveValue(currentTo.value, currentFrom.step)];
  }

  // Rounds to `step`, then pulls the result onto the nearest snapPoint when
  // it's within snapThreshold (a fraction of the min–max range) of it.
  resolveValue(rawValue, step) {
    const value = roundToStep(rawValue, step);
    if (!this.snapPoints.length) {
      return value;
    }

    const nearest = this.snapPoints.reduce((closest, point) => (
      Math.abs(point - value) < Math.abs(closest - value) ? point : closest
    ));
    const threshold = (Number(this.fromSlider.max) - Number(this.fromSlider.min)) * this.snapThreshold;

    return Math.abs(nearest - value) <= threshold ? nearest : value;
  }

  positionToValue(clientX) {
    const { left, width } = this.wrapper.getBoundingClientRect();
    const min = Number(this.fromSlider.min);
    const max = Number(this.fromSlider.max);

    return min + ((clientX - left) / width) * (max - min);
  }

  resetSlider(slider, defaultValue) {
    slider.value = defaultValue;
    slider.dispatchEvent(new Event('input'));
  }

  // Shift+Arrow nudges by fineStep (default step/10) instead of the native
  // step; a plain arrow press is left to the browser's own handling.
  handleKeydown(event, slider) {
    if (!event.shiftKey || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
      return;
    }
    event.preventDefault();

    const direction = event.key === 'ArrowLeft' || event.key === 'ArrowDown' ? -1 : 1;
    const step = this.fineStep ?? Number(slider.step || 1) / 10;

    slider.value = this.resolveValue(Number(slider.value) + direction * step, step);
    slider.dispatchEvent(new Event('input'));
  }

  // Clicking the track (including the fill) jumps the nearest handle there.
  // Clicks that land on a handle itself reach it directly, never the
  // wrapper, so they're naturally excluded here.
  handleTrackClick(event) {
    if (event.target !== this.wrapper) {
      return;
    }

    const value = this.positionToValue(event.clientX);
    const target = this.isRange && Math.abs(value - this.toSlider.value) < Math.abs(value - this.fromSlider.value)
      ? this.toSlider
      : this.fromSlider;

    target.value = this.resolveValue(value, target.step);
    target.dispatchEvent(new Event('input'));
  }

  // Grabbing the fill drags both handles together, keeping their distance
  // fixed — e.g. sliding a whole date range instead of resizing it. Clicks
  // that land here never reach handleTrackClick (its target is the fill,
  // not the wrapper), so the two don't fight over the same gesture.
  handleFillDragStart(event) {
    event.preventDefault();

    const startX = event.clientX;
    const startFrom = Number(this.fromSlider.value);
    const startTo = Number(this.toSlider.value);
    const min = Number(this.fromSlider.min);
    const max = Number(this.fromSlider.max);
    const trackWidth = this.wrapper.getBoundingClientRect().width;

    this.fill.setPointerCapture(event.pointerId);

    const onMove = (moveEvent) => {
      const delta = ((moveEvent.clientX - startX) / trackWidth) * (max - min);
      const clampedDelta = Math.max(min - startFrom, Math.min(max - startTo, delta));

      this.fromSlider.value = roundToStep(startFrom + clampedDelta, this.fromSlider.step);
      this.toSlider.value = roundToStep(startTo + clampedDelta, this.toSlider.step);
      this.fromSlider.dispatchEvent(new Event('input'));
      this.toSlider.dispatchEvent(new Event('input'));
    };

    const onUp = () => {
      this.fill.removeEventListener('pointermove', onMove);
      this.fill.removeEventListener('pointerup', onUp);
    };

    this.fill.addEventListener('pointermove', onMove);
    this.fill.addEventListener('pointerup', onUp);
  }

  // The fill sits in its own layer (see core.scss), so it's positioned by
  // percentage alone — it can never end up drawn on top of a handle.
  fillSlider() {
    const { fromSlider, toSlider, fill } = this;

    const min = Number(fromSlider.min);
    const max = Number(fromSlider.max);
    const percent = (value) => Math.round(((value - min) / (max - min)) * 1000) / 10;

    const fromPercent = toSlider ? percent(fromSlider.value) : 0;
    const toPercent = percent(toSlider ? toSlider.value : fromSlider.value);

    this.accentColor ||= getComputedStyle(fromSlider).accentColor;
    fill.style.backgroundColor = this.accentColor;
    fill.style.left = `${fromPercent}%`;
    fill.style.width = `${toPercent - fromPercent}%`;

    // Handles exactly overlapping would otherwise fully hide one behind the
    // other; see .is-overlapping in core.scss, which splits their hit-areas.
    if (toSlider) {
      this.wrapper.classList.toggle('is-overlapping', Number(fromSlider.value) === Number(toSlider.value));
    }
  }

  // Keeps whichever handle is more likely to need grabbing above the other;
  // both stay above the fill layer regardless (see core.scss z-indexes).
  setToggleAccessible(target) {
    if (!this.toSlider) {
      return;
    }

    const midpoint = (Number(this.fromSlider.min) + Number(this.fromSlider.max)) / 2;
    this.toSlider.style.zIndex = Number(target.value) <= midpoint ? 4 : 2;
  }
}

window.Ranger = Ranger;
