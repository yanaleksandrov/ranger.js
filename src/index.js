import {
  calcScale,
  createEvents,
  checkInitial,
  createElement,
  prepareArrayValues,
} from './scripts/helpers';

(function() {
  'use strict';

  let RS = function(target, settings) {
    let $this = this;

    Object.assign($this, {
      input: null,
      slider: null,
      sliderWidth: 0,
      sliderLeft: 0,
      pointerActive: null,
      pointerL: null,
      pointerR: null,
      pointerWidth: 0,
      progressbar: null,
      selectedbar: null,
      scale: null,
      step: 1,
      tip: null,
      tipL: null,
      tipR: null,
      timeout: null,
      ticks: [],
      values: { start: null, end: null },
      classes: {
        slider: 'rs-slider',
        progressbar: 'rs-progressbar',
        selectedbar: 'rs-selectedbar',
        pointer: 'rs-pointer',
        scale: 'rs-scale',
        point: 'rs-point',
        noscale: 'rs-noscale',
        tip: 'rs-tooltip'
      },
      on: settings.on || {}
    });

    $this.settings = Object.assign({
      values: null,
      set: null,
      range: false,
      scale: true,
      ticksCount: 10,
      tickPrefix: '',
      tickSuffix: '',
      labels: true,
      labelPrefix: '',
      labelSuffix: '',
      tooltip: true,
      tooltipSeparator: ' – ',
      step: 1,
      disabled:	false,
    }, settings);

    $this.init(target);
  };

  RS.prototype.init = function(target) {
    let $this   = this;
    $this.input = typeof target === 'object' ? target : document.querySelector(target);

    if (!$this.input) {
      console.log('Cannot find target element...');
      return;
    }

    $this.input.style.display = 'none';

    if (!$this.settings.values.hasOwnProperty('min') || !$this.settings.values.hasOwnProperty('max')) {
      console.log('Missing min or max value...');
      return;
    }

    $this.createSlider();
    $this.setInitialValues();
    $this.createScale();
    $this.addEvents();
  };

  RS.prototype.setInitialValues = function() {
    let $this = this;
    let {settings} = this;

    $this.setDisabled(settings.disabled);

    $this.settings.values = prepareArrayValues(settings);
    $this.values.start    = 0;
    $this.values.end      = settings.range ? settings.values.length - 1 : 0;

    if (settings.set && settings.set.length && checkInitial(settings)) {
      let values = settings.set;

      if (settings.range) {
        $this.values.start = settings.values.indexOf(values[0]);
        $this.values.end   = settings.set[1] ? settings.values.indexOf(values[1]) : null;
      } else {
        $this.values.end = settings.values.indexOf(values[0]);
      }
    }

    $this.ticks = calcScale(settings.ticksCount, settings.values);

    if (typeof $this.on.init === 'function') {
      $this.on.init($this);
    }
  };

  RS.prototype.createSlider = function() {
    let $this = this;
    let {settings} = this;

    $this.slider      = createElement('div', $this.classes.slider + (!settings.scale ? ' ' + $this.classes.noscale : ''));
    $this.scale       = createElement('div', $this.classes.scale);
    $this.progressbar = createElement('div', $this.classes.progressbar);
    $this.selectedbar = createElement('div', $this.classes.selectedbar);
    $this.pointerL    = createElement('div', $this.classes.pointer, ['dir', 'left']);

    if (settings.tooltip) {
      $this.tipL = createElement('div', $this.classes.tip);
      $this.tipR = createElement('div', $this.classes.tip);
      $this.pointerL.appendChild($this.tipL);
    }
    $this.slider.appendChild($this.scale);
    $this.slider.appendChild($this.progressbar);
    $this.slider.appendChild($this.selectedbar);
    $this.slider.appendChild($this.pointerL);

    if (settings.range) {
      $this.pointerR = createElement('div', $this.classes.pointer, ['dir', 'right']);
      if (settings.tooltip) {
        $this.pointerR.appendChild($this.tipR);
      }
      $this.slider.appendChild($this.pointerR);

      // single tooltip
      $this.tip = createElement('div', `${$this.classes.tip} hidden`);
      $this.selectedbar.appendChild($this.tip);
    }

    $this.input.parentNode.insertBefore($this.slider, $this.input.nextSibling);

    $this.sliderLeft   = $this.slider.getBoundingClientRect().left;
    $this.sliderWidth  = $this.slider.clientWidth;
    $this.pointerWidth = $this.pointerL.clientWidth;
  };

  RS.prototype.createScale = function() {
    let $this = this;
    let {settings} = this;

    $this.step = $this.sliderWidth / (settings.values.length - 1);
    for (let i = 0, iLen = $this.ticks.length; i < iLen; i++) {
      let span = createElement('span', $this.classes.point),
          ins  = createElement('ins');

      span.appendChild(ins);

      $this.scale.appendChild(span);
      ins.innerHTML = `${settings.tickPrefix}${$this.ticks[i]}${settings.tickSuffix}`;
    }
  };

  RS.prototype.addEvents = function() {
    let $this = this;

    createEvents(document, 'mousemove touchmove', $this.move.bind(this));
    createEvents(document, 'mouseup touchend touchcancel', $this.drop.bind(this));

    let pointers = $this.slider.querySelectorAll('.' + $this.classes.pointer);
    for (let i = 0, iLen = pointers.length; i < iLen; i++) {
      createEvents(pointers[i], 'mousedown touchstart', $this.drag.bind(this));
    }

    createEvents($this.progressbar, 'click', $this.onClickBar.bind(this));
    createEvents($this.selectedbar, 'click', $this.onClickBar.bind(this));

    window.addEventListener('resize', $this.onResize.bind(this));

    $this.setValues();
  };

  RS.prototype.drag = function(e) {
    let $this = this;
    e.preventDefault();

    if ($this.settings.disabled) return;

    let dir = e.target.getAttribute('data-dir');
    if (dir === 'left') {
      $this.pointerActive = $this.pointerL
    }
    if (dir === 'right') {
      $this.pointerActive = $this.pointerR
    }
  };

  RS.prototype.move = function(e) {
    let $this = this;
    if ($this.pointerActive && !$this.settings.disabled) {
      let coordX = e.type === 'touchmove' ? e.touches[0].clientX : e.pageX,
          index  = coordX - $this.sliderLeft - ($this.pointerWidth / 2);

      index = Math.round(index / $this.step);

      if (index <= 0) {
        index = 0;
      }

      if (index > $this.settings.values.length - 1) {
        index = $this.settings.values.length - 1;
      }

      if ($this.settings.range) {
        if ($this.pointerActive === $this.pointerL) $this.values.start = index;
        if ($this.pointerActive === $this.pointerR) $this.values.end   = index;
      } else {
        $this.values.end = index;
      }

      $this.setValues();
    }
  };

  RS.prototype.drop = function() {
    this.pointerActive = null;
  };

  RS.prototype.setValues = function(start, end) {
    let $this = this;
    let {settings} = this;
    let pointerActive = settings.range ? 'start' : 'end';

    if (start && settings.values.indexOf(start) > -1) {
      $this.values[pointerActive] = settings.values.indexOf(start);
    }

    if (end && settings.values.indexOf(end) > -1) {
      $this.values.end = settings.values.indexOf(end);
    }

    // prohibit setting the left pointer larger than the right one and vice versa
    if (settings.range && $this.values.start > $this.values.end) {
      if ($this.pointerActive === $this.pointerR) {
        $this.values.end = $this.values.start;
      } else {
        $this.values.start = $this.values.end;
      }
    }

    let leftPointer = ($this.values[pointerActive] * $this.step - ($this.pointerWidth / 2));

    $this.pointerL.style.left = leftPointer + 'px';

    let valueR = settings.values[$this.values.end];
    if (settings.range) {
      let tipL   = `${settings.labelPrefix}${settings.values[$this.values.start]}${settings.labelSuffix}`,
          tipR   = `${settings.labelPrefix}${settings.values[$this.values.end]}${settings.labelSuffix}`,
          valueL = settings.values[$this.values.start];

      if (settings.tooltip) {
        $this.tipL.innerHTML = tipL;
        $this.tipR.innerHTML = tipR;
      }
      $this.input.value = `${valueL},${valueR}`;

      let rightPointer = ($this.values.end * $this.step - ($this.pointerWidth / 2)),
          pointersDiff = Math.abs(rightPointer - leftPointer);

      let diff = pointersDiff - ($this.tipL.clientWidth + $this.tipR.clientWidth);
      $this.tipL.classList.toggle('hidden', diff <= 0);
      $this.tipR.classList.toggle('hidden', diff <= 0);

      if ($this.tip) {
        $this.tip.classList.toggle('hidden', diff > 0);
        $this.tip.innerHTML = valueL !== valueR ? `${tipL}${settings.tooltipSeparator}${tipR}` : tipR;
      }

      $this.pointerR.style.left = rightPointer + 'px';
    } else {
      if (settings.tooltip) {
        $this.tipL.innerHTML = `${settings.labelPrefix}${valueR}${settings.labelSuffix}`;
      }
      $this.input.value = valueR;
    }

    if ($this.values.end > settings.values.length - 1) {
      $this.values.end = settings.values.length - 1;
    }
    if ($this.values.start < 0) {
      $this.values.start = 0;
    }

    $this.selectedbar.style.width = ($this.values.end - $this.values.start) * $this.step + 'px';
    $this.selectedbar.style.left  = $this.values.start * $this.step + 'px';

    $this.onChange();
  };

  RS.prototype.onClickBar = function(e) {
    let $this = this;

    if ($this.settings.disabled) return;

    let idx = Math.round((e.clientX - $this.sliderLeft) / $this.step);

    if (idx > $this.settings.values.length - 1) {
      idx = $this.settings.values.length - 1
    }

    if (idx < 0) {
      idx = 0
    }

    if ($this.settings.range) {
      if (idx - $this.values.start <= $this.values.end - idx) {
        $this.values.start = idx;
      } else {
        $this.values.end = idx;
      }
    } else {
      $this.values.end = idx;
    }

    $this.setValues();
  };

  RS.prototype.onChange = function() {
    let $this = this;
    let {input, timeout} = this;

    input.dispatchEvent(new Event('change'));

    if (timeout) {
      clearTimeout(timeout);
    }

    $this.timeout = setTimeout(() => typeof $this.on.change === 'function' && $this.on.change($this), 250);
  };

  RS.prototype.onResize = function() {
    let $this = this;
    $this.sliderLeft  = $this.slider.getBoundingClientRect().left;
    $this.sliderWidth = $this.slider.clientWidth;

    $this.updateScale();
  };

  RS.prototype.updateScale = function() {
    this.step = this.sliderWidth / (this.settings.values.length - 1);

    this.setValues();
  };

  RS.prototype.setDisabled = function(disabled) {
    this.settings.disabled = disabled;
    this.slider.classList[disabled ? 'add' : 'remove']('disabled');
  };

  RS.prototype.getValue = function() {
    return this.input.value;
  };

  RS.prototype.destroy = function() {
    this.input.style.display = '';
    this.slider.remove();
  };

  window.Ranger = RS;

})();
