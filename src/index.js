import { createScale } from './js/scale';
import { createLabel } from './js/label';
import { roundToStep } from './js/helpers';

window.SliderController = class SliderController {
  constructor(element, options) {
    this.fromSlider = element;
    this.fromInput  = null;
    this.toInput    = null;

    Object.assign(this, {
      classes: {
        container: 'ranger',
        scale: 'ranger-scale',
        scaleTick: 'ranger-scale-tick',
        label: 'ranger-label',
        labelTick: 'ranger-label-item',
      },

      scaleTickPrefix: '',
      scaleTickSuffix: '',
      scaleTicksCount: 10,

      labelIsVisible: true,
      labelPrefix: '',
      labelSuffix: '',

      ...options,
    });

    this.initialize();
  }

  initialize() {
    let $this = this;

    const wrapper = document.createElement('div');
    if (wrapper) {
      wrapper.classList.add($this.classes.container);
    }
    $this.wrapper = wrapper;

    $this.fromSlider.parentNode.insertBefore(wrapper, $this.fromSlider);
    wrapper.appendChild($this.fromSlider);

    if ($this.fromSlider.hasAttribute('data-max-value')) {
      let maxVal = Math.max(Number($this.fromSlider.value), Number($this.fromSlider.dataset.maxValue || $this.toSlider.max));

      $this.toSlider = $this.fromSlider.cloneNode(false);
      $this.toSlider.setAttribute('value', maxVal);

      wrapper.appendChild($this.toSlider);
      $this.setToggleAccessible($this.toSlider);
    }

    $this.fillSlider();

    $this.addListeners();

    if ($this.labelIsVisible) {
      $this.label = createLabel($this);
    }

    if ($this.scaleTicksCount > 0) {
      $this.scale = createScale($this);
    }
  }

  addListeners() {
    let $this = this;

    $this.fromSlider.oninput = () => $this.controlFromSlider();
    $this.toSlider.oninput = () => $this.controlToSlider();

    ['fromInput', 'toInput'].forEach(key => $this[key] && $this[key].addEventListener('input', () => {
      $this[`${key.replace('Input', 'Slider')}`].value = $this[key].value;
      $this.fillSlider();
    }));
  }

  controlFromSlider() {
    const [from, to] = this.getParsed(this.fromSlider, this.toSlider);

    this.fillSlider();

    const value = from > to ? to : from;
    this.fromSlider.value = value;
    if (this.fromInput) {
      this.fromInput.value = value;
    }
  }

  controlToSlider() {
    const [from, to] = this.getParsed(this.fromSlider, this.toSlider);
    const value = Math.max(from, to);

    this.fillSlider();
    this.setToggleAccessible(this.toSlider);

    this.toSlider.value = this.toInput.value = value;
  }

  getParsed(currentFrom, currentTo) {
    return [roundToStep(currentFrom.value, currentFrom.step), roundToStep(currentTo.value, currentFrom.step)];
  }

  fillSlider() {
    const { fromSlider, toSlider } = this;

    const rangeDistance = toSlider.max - toSlider.min;

    const [fromPercent, toPercent] = [
      Math.round(((fromSlider.value - toSlider.min) / rangeDistance) * 100 * 10) / 10,
      Math.round(((toSlider.value - toSlider.min) / rangeDistance) * 100 * 10) / 10,
    ]

    this.accentColor ||= getComputedStyle(fromSlider).accentColor;

    toSlider.style.backgroundImage = `linear-gradient(to right, transparent 0% ${fromPercent}%, ${this.accentColor} ${fromPercent}% ${toPercent}%, transparent ${toPercent}% 100%)`;
  }

  setToggleAccessible(currentTarget) {
    this.toSlider.style.zIndex = Number(currentTarget.value) <= 0 ? 2 : 0;
  }
}