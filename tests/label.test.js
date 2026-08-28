import { describe, it, expect, beforeEach } from 'vitest';
import Ranger from '../src/index.js';

const mockRect = (element, { left = 0, right = 0 } = {}) => {
  element.getBoundingClientRect = () => ({
    left,
    right,
    top: 0,
    bottom: 0,
    width: right - left,
    height: 0,
    x: left,
    y: 0,
  });
};

beforeEach(() => {
  document.body.innerHTML = '';
  Ranger.instances.length = 0;
});

const makeInput = (attrs = {}) => {
  const input = document.createElement('input');
  input.type = 'range';
  Object.entries(attrs).forEach(([key, value]) => input.setAttribute(key, value));
  document.body.appendChild(input);
  return input;
};

const mockWidth = (element, width) => {
  Object.defineProperty(element, 'clientWidth', { value: width, configurable: true });
};

const mockOffsetWidth = (element, width) => {
  Object.defineProperty(element, 'offsetWidth', { value: width, configurable: true });
};

describe('label position stays centered, even past the track edges', () => {
  // jsdom never performs real layout, so clientWidth/offsetWidth are stubbed to exercise the same pixel math a real browser would do.
  it('centers on the left edge at the minimum value, overhanging past it by half its width', () => {
    const input = makeInput({ min: 0, max: 100, value: 0 });
    const ranger = new Ranger(input);
    mockWidth(ranger.label, 200);
    mockOffsetWidth(ranger.labelFrom, 40);

    input.dispatchEvent(new Event('input'));

    // 0% of 200 = 0, centered: 0 - 40/2 = -20 (half the label sticks out past the track)
    expect(ranger.labelFrom.style.insetInlineStart).toBe('-20px');
  });

  it('centers on the right edge at the maximum value, overhanging past it by half its width', () => {
    const input = makeInput({ min: 0, max: 100, value: 100 });
    const ranger = new Ranger(input);
    mockWidth(ranger.label, 200);
    mockOffsetWidth(ranger.labelFrom, 40);

    input.dispatchEvent(new Event('input'));

    // 100% of 200 = 200, centered: 200 - 40/2 = 180 (right edge at 220, 20px past the track)
    expect(ranger.labelFrom.style.insetInlineStart).toBe('180px');
  });

  it('overhangs proportionally more for a wider label at the same edge', () => {
    const input = makeInput({ min: 0, max: 100000, value: 100000 });
    const ranger = new Ranger(input);
    mockWidth(ranger.label, 200);
    mockOffsetWidth(ranger.labelFrom, 80); // a wide "100000"-style label

    input.dispatchEvent(new Event('input'));

    expect(ranger.labelFrom.style.insetInlineStart).toBe('160px'); // 200 - 80/2
  });

  it('stays centered on the value in the middle of the track, same as at the edges', () => {
    const input = makeInput({ min: 0, max: 100, value: 50 });
    const ranger = new Ranger(input);
    mockWidth(ranger.label, 200);
    mockOffsetWidth(ranger.labelFrom, 20);

    input.dispatchEvent(new Event('input'));

    // 50% of 200 = 100, centered: 100 - 20/2 = 90
    expect(ranger.labelFrom.style.insetInlineStart).toBe('90px');
  });

  it('positions both handles independently in range mode, each centered on its own edge', () => {
    const ranger = new Ranger(makeInput({ min: 0, max: 100, value: 0, 'data-max-value': 100 }));
    mockWidth(ranger.label, 200);
    mockOffsetWidth(ranger.labelFrom, 40);
    mockOffsetWidth(ranger.labelTo, 60);
    mockRect(ranger.labelFrom, { left: -20, right: 20 });
    mockRect(ranger.labelTo, { left: 170, right: 230 });

    ranger.fromSlider.dispatchEvent(new Event('input'));

    expect(ranger.labelFrom.style.insetInlineStart).toBe('-20px'); // 0 - 40/2
    expect(ranger.labelTo.style.insetInlineStart).toBe('170px'); // 200 - 60/2
  });

  it('recalculates position via a ResizeObserver when the wrapper is resized without a value change', () => {
    // Positions are computed in pixels, not left to CSS percentages, so a resize with no accompanying input event needs this to stay in sync.
    const observers = [];
    const OriginalResizeObserver = global.ResizeObserver;
    global.ResizeObserver = class {
      constructor(callback) {
        this.callback = callback;
        observers.push(this);
      }

      observe(target) {
        this.target = target;
      }

      unobserve() {}

      disconnect() {}
    };

    try {
      const ranger = new Ranger(makeInput({ min: 0, max: 100, value: 50 }), { scaleTicksCount: 0 });
      mockWidth(ranger.label, 200);
      mockOffsetWidth(ranger.labelFrom, 20);

      expect(observers).toHaveLength(1);
      expect(observers[0].target).toBe(ranger.wrapper);

      observers[0].callback(); // simulate a resize notification

      expect(ranger.labelFrom.style.insetInlineStart).toBe('90px'); // 50% of 200 - 20/2
    } finally {
      global.ResizeObserver = OriginalResizeObserver;
    }
  });
});

describe('createLabel (single handle)', () => {
  it('creates one label item holding the formatted value', () => {
    const input = makeInput({ min: 0, max: 100, value: 25 });
    const ranger = new Ranger(input);

    expect(ranger.label).toBeTruthy();
    expect(ranger.label.getAttribute('aria-hidden')).toBe('true');
    expect(ranger.labelFrom.innerHTML).toBe('25');
    expect(ranger.labelTo).toBeUndefined();
  });

  it('re-renders the label text as the slider value changes', () => {
    const input = makeInput({ min: 0, max: 100, value: 25 });
    const ranger = new Ranger(input);

    input.value = 80;
    input.dispatchEvent(new Event('input'));

    expect(ranger.labelFrom.innerHTML).toBe('80');
  });

  it('applies labelPrefix and labelSuffix', () => {
    const input = makeInput({ min: 0, max: 100, value: 25 });
    const ranger = new Ranger(input, { labelPrefix: '$', labelSuffix: '.00' });

    expect(ranger.labelFrom.innerHTML).toBe('$25.00');
  });

  it('respects a custom format function', () => {
    const input = makeInput({ min: 0, max: 100, value: 25 });
    const ranger = new Ranger(input, { format: (v) => `${v}%` });

    expect(ranger.labelFrom.innerHTML).toBe('25%');
  });

  it('is not created when labelIsVisible is false', () => {
    const input = makeInput({ min: 0, max: 100, value: 25 });
    const ranger = new Ranger(input, { labelIsVisible: false });

    expect(ranger.label).toBeUndefined();
  });
});

describe('createLabel (range)', () => {
  it('creates two label items for a range slider', () => {
    const input = makeInput({ min: 0, max: 100, value: 20, 'data-max-value': 80 });
    const ranger = new Ranger(input);

    expect(ranger.labelFrom).toBeTruthy();
    expect(ranger.labelTo).toBeTruthy();

    // jsdom performs no layout, so the labels' rects default to all-zero and would otherwise merge as "overlapping" — mock them apart to check the un-merged shape.
    mockRect(ranger.labelFrom, { left: 0, right: 20 });
    mockRect(ranger.labelTo, { left: 200, right: 220 });
    ranger.fromSlider.dispatchEvent(new Event('input'));

    expect(ranger.labelFrom.innerHTML).toBe('20');
    expect(ranger.labelTo.innerHTML).toBe('80');
  });

  it('merges into a single "from – to" label when the two labels overlap/are close', () => {
    const input = makeInput({ min: 0, max: 100, value: 20, 'data-max-value': 80 });
    const ranger = new Ranger(input);

    // jsdom performs no layout (both rects default to all-zero), so mock the rects to make the "within the 10px gate" intent explicit.
    mockRect(ranger.labelFrom, { left: 40, right: 60 });
    mockRect(ranger.labelTo, { left: 61, right: 80 });

    ranger.toSlider.value = 80;
    ranger.toSlider.dispatchEvent(new Event('input'));

    expect(ranger.labelFrom.innerHTML).toBe('20 – 80');
    expect(ranger.labelTo.style.visibility).toBe('hidden');
  });

  it('collapses to a single value (no dash) when both handles share the same value', () => {
    const input = makeInput({ min: 0, max: 100, value: 50, 'data-max-value': 50 });
    const ranger = new Ranger(input);

    mockRect(ranger.labelFrom, { left: 40, right: 60 });
    mockRect(ranger.labelTo, { left: 45, right: 65 });

    ranger.fromSlider.dispatchEvent(new Event('input'));

    expect(ranger.labelFrom.innerHTML).toBe('50');
  });

  it('shows both labels separately when they are far apart', () => {
    const input = makeInput({ min: 0, max: 100, value: 10, 'data-max-value': 90 });
    const ranger = new Ranger(input);

    mockRect(ranger.labelFrom, { left: 0, right: 20 });
    mockRect(ranger.labelTo, { left: 200, right: 220 });

    ranger.fromSlider.dispatchEvent(new Event('input'));

    expect(ranger.labelTo.style.visibility).toBe('visible');
    expect(ranger.labelFrom.innerHTML).toBe('10');
    expect(ranger.labelTo.innerHTML).toBe('90');
  });

  it('formats both labels through a custom format function', () => {
    const input = makeInput({ min: 0, max: 10, value: 2, 'data-max-value': 8 });
    const ranger = new Ranger(input, { format: (v) => `L${v}` });

    mockRect(ranger.labelFrom, { left: 0, right: 20 });
    mockRect(ranger.labelTo, { left: 200, right: 220 });
    ranger.fromSlider.dispatchEvent(new Event('input'));

    expect(ranger.labelFrom.innerHTML).toBe('L2');
    expect(ranger.labelTo.innerHTML).toBe('L8');
  });
});

describe('labelOnDragOnly', () => {
  it('starts idle (faded) when labelOnDragOnly is enabled', () => {
    const input = makeInput({ min: 0, max: 100, value: 25 });
    const ranger = new Ranger(input, { labelOnDragOnly: true });

    expect(ranger.label.classList.contains('is-idle')).toBe(true);
  });

  it('is not idle by default', () => {
    const input = makeInput({ min: 0, max: 100, value: 25 });
    const ranger = new Ranger(input);

    expect(ranger.label.classList.contains('is-idle')).toBe(false);
  });

  it('becomes visible on pointerdown and idle again after keyup nudge ends', () => {
    const input = makeInput({ min: 0, max: 100, value: 25 });
    const ranger = new Ranger(input, { labelOnDragOnly: true });

    input.dispatchEvent(new PointerEvent('pointerdown'));
    expect(ranger.label.classList.contains('is-idle')).toBe(false);

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(ranger.label.classList.contains('is-idle')).toBe(false);

    input.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowRight' }));
    expect(ranger.label.classList.contains('is-idle')).toBe(true);
  });

  it('goes idle again on a document-wide pointerup', () => {
    const input = makeInput({ min: 0, max: 100, value: 25 });
    const ranger = new Ranger(input, { labelOnDragOnly: true });

    input.dispatchEvent(new PointerEvent('pointerdown'));
    expect(ranger.label.classList.contains('is-idle')).toBe(false);

    document.dispatchEvent(new PointerEvent('pointerup'));
    expect(ranger.label.classList.contains('is-idle')).toBe(true);
  });
});

describe('rich (HTML) label content', () => {
  it('renders markup returned by a custom format function as real elements, not escaped text', () => {
    const input = makeInput({ min: 0, max: 100, value: 25 });
    const ranger = new Ranger(input, { format: (v) => `<strong>${v}</strong> <small>km</small>` });

    expect(ranger.labelFrom.querySelector('strong').textContent).toBe('25');
    expect(ranger.labelFrom.querySelector('small').textContent).toBe('km');
  });

  it('renders markup in labelPrefix/labelSuffix as real elements too', () => {
    const input = makeInput({ min: 0, max: 100, value: 25 });
    const ranger = new Ranger(input, { labelPrefix: '<em>', labelSuffix: '</em>' });

    expect(ranger.labelFrom.querySelector('em').textContent).toBe('25');
  });

  it('re-renders rich content on every value change', () => {
    const input = makeInput({ min: 0, max: 100, value: 25 });
    const ranger = new Ranger(input, { format: (v) => `<b>${v}</b>` });

    input.value = 60;
    input.dispatchEvent(new Event('input'));

    expect(ranger.labelFrom.querySelector('b').textContent).toBe('60');
  });

  it('carries rich content through the close-handle merge too', () => {
    const ranger = new Ranger(makeInput({ min: 0, max: 100, value: 48, 'data-max-value': 52 }), {
      format: (v) => `<i>${v}</i>`,
    });
    mockRect(ranger.labelFrom, { left: 40, right: 60 });
    mockRect(ranger.labelTo, { left: 45, right: 65 });
    ranger.fromSlider.dispatchEvent(new Event('input'));

    const italics = ranger.labelFrom.querySelectorAll('i');
    expect(italics).toHaveLength(2);
    expect([...italics].map((el) => el.textContent)).toEqual(['48', '52']);
  });
});
