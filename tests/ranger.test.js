import { describe, it, expect, beforeEach, vi } from 'vitest';
import Ranger from '../src/index.js';

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

const mockRect = (element, rect) => {
  element.getBoundingClientRect = () => ({
    top: 0,
    bottom: 0,
    height: 0,
    x: rect.left,
    y: 0,
    ...rect,
  });
};

// ---------------------------------------------------------------------------
// Construction & options
// ---------------------------------------------------------------------------

describe('construction', () => {
  it('throws when the target selector matches nothing', () => {
    expect(() => new Ranger('#does-not-exist')).toThrow(/no slider element found/);
  });

  it('throws when the target element is not an <input>', () => {
    const div = document.createElement('div');
    document.body.appendChild(div);
    expect(() => new Ranger(div)).toThrow(/no slider element found/);
  });

  it('accepts a CSS selector string', () => {
    const input = makeInput({ min: 0, max: 100, value: 10, id: 'my-slider' });
    const ranger = new Ranger('#my-slider');
    expect(ranger.fromSlider).toBe(input);
  });

  it('accepts an element directly', () => {
    const input = makeInput({ min: 0, max: 100, value: 10 });
    const ranger = new Ranger(input);
    expect(ranger.fromSlider).toBe(input);
  });

  it('wraps the input in a container carrying the default "ranger" class', () => {
    const input = makeInput({ min: 0, max: 100, value: 10 });
    const ranger = new Ranger(input);
    expect(ranger.wrapper.className).toBe('ranger');
    expect(ranger.wrapper.contains(input)).toBe(true);
    expect(input.parentElement).toBe(ranger.wrapper);
  });

  it('merges custom classes with the defaults instead of replacing them wholesale', () => {
    const input = makeInput({ min: 0, max: 100, value: 10 });
    const ranger = new Ranger(input, { classes: { container: 'my-container' } });
    expect(ranger.wrapper.className).toBe('my-container');
    expect(ranger.classes.fill).toBe('ranger-fill');
  });

  it('registers every instance, in creation order, on the static instances list', () => {
    const a = new Ranger(makeInput({ min: 0, max: 10, value: 0 }));
    const b = new Ranger(makeInput({ min: 0, max: 10, value: 0 }));
    expect(Ranger.instances).toEqual([a, b]);
  });

  it('does not let one instance leak its options onto another', () => {
    const rangerA = new Ranger(makeInput({ min: 0, max: 100, value: 20 }), { labelPrefix: 'A-' });
    const rangerB = new Ranger(makeInput({ min: 0, max: 100, value: 20 }));

    expect(rangerA.labelFrom.innerText).toBe('A-20');
    expect(rangerB.labelFrom.innerText).toBe('20');
  });
});

describe('range mode via data-max-value', () => {
  it('creates a second handle when data-max-value is present', () => {
    const input = makeInput({ min: 0, max: 100, value: 20, 'data-max-value': 80 });
    const ranger = new Ranger(input);
    expect(ranger.isRange).toBe(true);
    expect(ranger.toSlider).not.toBeNull();
    expect(ranger.toSlider.value).toBe('80');
  });

  it('is not range mode when data-max-value is absent', () => {
    const input = makeInput({ min: 0, max: 100, value: 20 });
    const ranger = new Ranger(input);
    expect(ranger.isRange).toBe(false);
    expect(ranger.toSlider).toBeNull();
  });

  it('removes data-max-value and id from the cloned upper handle', () => {
    const input = makeInput({ min: 0, max: 100, value: 20, 'data-max-value': 80, id: 'the-id' });
    const ranger = new Ranger(input);
    expect(ranger.toSlider.hasAttribute('data-max-value')).toBe(false);
    expect(ranger.toSlider.hasAttribute('id')).toBe(false);
  });

  it('adds the inputTo class to the cloned upper handle, alongside any existing classes', () => {
    const input = makeInput({ min: 0, max: 100, value: 20, 'data-max-value': 80, class: 'existing' });
    const ranger = new Ranger(input);
    expect(ranger.toSlider.classList.contains('existing')).toBe(true);
    expect(ranger.toSlider.classList.contains('ranger-input--to')).toBe(true);
  });

  it('falls back to the slider max when data-max-value is empty', () => {
    const input = makeInput({ min: 0, max: 100, value: 20, 'data-max-value': '' });
    const ranger = new Ranger(input);
    expect(ranger.toSlider.value).toBe('100');
  });

  it('falls back to the slider max when data-max-value is not a number', () => {
    const input = makeInput({ min: 0, max: 50, value: 10, 'data-max-value': 'abc' });
    const ranger = new Ranger(input);
    expect(ranger.toSlider.value).toBe('50');
  });

  it('seeds the upper handle to whichever is larger: the from value or the parsed max value', () => {
    const input = makeInput({ min: 0, max: 100, value: 90, 'data-max-value': 40 });
    const ranger = new Ranger(input);
    expect(ranger.toSlider.value).toBe('90');
  });
});

describe('disabled option', () => {
  it('disables both handles and adds is-disabled when true', () => {
    const input = makeInput({ min: 0, max: 100, value: 20, 'data-max-value': 80 });
    const ranger = new Ranger(input, { disabled: true });
    expect(ranger.fromSlider.disabled).toBe(true);
    expect(ranger.toSlider.disabled).toBe(true);
    expect(ranger.wrapper.classList.contains('is-disabled')).toBe(true);
  });

  it('does not disable handles by default', () => {
    const input = makeInput({ min: 0, max: 100, value: 20 });
    const ranger = new Ranger(input);
    expect(ranger.fromSlider.disabled).toBe(false);
    expect(ranger.wrapper.classList.contains('is-disabled')).toBe(false);
  });

  it('marks the fill draggable in range mode when not disabled', () => {
    const input = makeInput({ min: 0, max: 100, value: 20, 'data-max-value': 80 });
    const ranger = new Ranger(input);
    expect(ranger.fill.classList.contains('is-draggable')).toBe(true);
  });

  it('does not mark the fill draggable when disabled', () => {
    const input = makeInput({ min: 0, max: 100, value: 20, 'data-max-value': 80 });
    const ranger = new Ranger(input, { disabled: true });
    expect(ranger.fill.classList.contains('is-draggable')).toBe(false);
  });

  it('does not mark the fill draggable in single-handle mode', () => {
    const input = makeInput({ min: 0, max: 100, value: 20 });
    const ranger = new Ranger(input);
    expect(ranger.fill.classList.contains('is-draggable')).toBe(false);
  });

  it('does not start a fill-drag when disabled', () => {
    const input = makeInput({ min: 0, max: 100, value: 20, 'data-max-value': 40 });
    const onStart = vi.fn();
    const ranger = new Ranger(input, { disabled: true, onStart });
    mockRect(ranger.wrapper, { left: 0, width: 100, right: 100 });

    ranger.fill.dispatchEvent(new PointerEvent('pointerdown', { clientX: 0, pointerId: 1, bubbles: true }));
    expect(onStart).not.toHaveBeenCalled();
  });
});

describe('values option (index picker)', () => {
  it('derives min/max/step from the values array', () => {
    const ranger = new Ranger(makeInput({ value: 0 }), { values: ['S', 'M', 'L', 'XL'] });
    expect(ranger.fromSlider.min).toBe('0');
    expect(ranger.fromSlider.max).toBe('3');
    // The native `step` attribute is always neutralized to "any" (see
    // initialize() in index.js) — `this.step` is where the real value lives.
    expect(ranger.step).toBe('1');
  });

  it('auto-derives scaleTicksCount from values.length - 1 when not explicit', () => {
    const ranger = new Ranger(makeInput({ value: 0 }), { values: ['S', 'M', 'L', 'XL'] });
    expect(ranger.scaleTicksCount).toBe(3);
  });

  it('respects an explicit scaleTicksCount even with values set', () => {
    const ranger = new Ranger(makeInput({ value: 0 }), { values: ['S', 'M', 'L', 'XL'], scaleTicksCount: 1 });
    expect(ranger.scaleTicksCount).toBe(1);
  });

  it('formats the display value as the values-array entry at that index', () => {
    const ranger = new Ranger(makeInput({ value: 2 }), { values: ['S', 'M', 'L', 'XL'] });
    expect(ranger.labelFrom.innerText).toBe('L');
  });

  it('keeps a user-supplied format function instead of the auto-generated indexer', () => {
    const ranger = new Ranger(makeInput({ value: 2 }), { values: ['S', 'M', 'L', 'XL'], format: (i) => `idx${i}` });
    expect(ranger.labelFrom.innerText).toBe('idx2');
  });
});

describe('logScale option', () => {
  it('maps position to an exponential value between min and max', () => {
    const ranger = new Ranger(makeInput({ min: 1, max: 100, value: 1 }), { logScale: true });
    expect(ranger.format(1)).toBe(1);
    expect(ranger.format(100)).toBe(100);
    const mid = ranger.format(50.5);
    expect(mid).toBeGreaterThan(1);
    expect(mid).toBeLessThan(100);
  });

  it('keeps a user-supplied format function instead of the auto log formatter', () => {
    const ranger = new Ranger(makeInput({ min: 1, max: 100, value: 1 }), {
      logScale: true,
      format: (v) => `custom-${v}`,
    });
    expect(ranger.format(1)).toBe('custom-1');
  });
});

// ---------------------------------------------------------------------------
// fillSlider
// ---------------------------------------------------------------------------

describe('fillSlider (single handle)', () => {
  it('always fills from 0% up to the value’s percentage of the range', () => {
    const ranger = new Ranger(makeInput({ min: 0, max: 200, value: 50 }));
    expect(ranger.fill.style.insetInlineStart).toBe('0%');
    expect(ranger.fill.style.width).toBe('25%');
  });

  it('recomputes the fill on every input event', () => {
    const input = makeInput({ min: 0, max: 200, value: 50 });
    const ranger = new Ranger(input);
    input.value = 150;
    input.dispatchEvent(new Event('input'));
    expect(ranger.fill.style.width).toBe('75%');
  });
});

describe('fillSlider (range)', () => {
  it('fills between the two handle percentages', () => {
    const ranger = new Ranger(makeInput({ min: 0, max: 200, value: 50, 'data-max-value': 150 }));
    expect(ranger.fill.style.insetInlineStart).toBe('25%');
    expect(ranger.fill.style.width).toBe('50%');
  });

  it('adds is-overlapping when both handles share the same value', () => {
    const ranger = new Ranger(makeInput({ min: 0, max: 200, value: 100, 'data-max-value': 100 }));
    expect(ranger.wrapper.classList.contains('is-overlapping')).toBe(true);
  });

  it('does not add is-overlapping when the handles differ', () => {
    const ranger = new Ranger(makeInput({ min: 0, max: 200, value: 50, 'data-max-value': 150 }));
    expect(ranger.wrapper.classList.contains('is-overlapping')).toBe(false);
  });
});

describe('aria-valuetext', () => {
  it('mirrors the formatted display value', () => {
    const input = makeInput({ min: 0, max: 100, value: 40 });
    new Ranger(input, { labelSuffix: '%' });
    expect(input.getAttribute('aria-valuetext')).toBe('40%');
  });

  it('updates both handles’ aria-valuetext in range mode', () => {
    const input = makeInput({ min: 0, max: 100, value: 20, 'data-max-value': 80 });
    const ranger = new Ranger(input, { labelSuffix: '%' });
    expect(ranger.fromSlider.getAttribute('aria-valuetext')).toBe('20%');
    expect(ranger.toSlider.getAttribute('aria-valuetext')).toBe('80%');
  });
});

describe('fillGradient', () => {
  it('exposes fillGradient via the --ranger-fill-gradient custom property', () => {
    const gradient = 'linear-gradient(90deg, red, green)';
    const ranger = new Ranger(makeInput({ min: 0, max: 100, value: 40 }), { fillGradient: gradient });
    expect(ranger.fill.style.getPropertyValue('--ranger-fill-gradient')).toBe(gradient);
  });

  it('defaults --ranger-fill-gradient to none without fillGradient', () => {
    const ranger = new Ranger(makeInput({ min: 0, max: 100, value: 40 }));
    expect(ranger.fill.style.getPropertyValue('--ranger-fill-gradient')).toBe('none');
  });
});

// ---------------------------------------------------------------------------
// controlFromSlider / controlToSlider
// ---------------------------------------------------------------------------

describe('controlFromSlider (single mode)', () => {
  it('rounds the value to the slider step on input', () => {
    const input = makeInput({ min: 0, max: 10, value: 0, step: 1 });
    new Ranger(input);
    input.value = 4.6;
    input.dispatchEvent(new Event('input'));
    expect(input.value).toBe('5');
  });

  it('syncs an external fromInput element', () => {
    const input = makeInput({ min: 0, max: 10, value: 0 });
    const external = document.createElement('input');
    document.body.appendChild(external);
    new Ranger(input, { fromInput: external });
    input.value = 7;
    input.dispatchEvent(new Event('input'));
    expect(external.value).toBe('7');
  });

  it('fires onChange with the numeric value and the slider element', () => {
    const input = makeInput({ min: 0, max: 10, value: 0 });
    const onChange = vi.fn();
    new Ranger(input, { onChange });
    input.value = 6;
    input.dispatchEvent(new Event('input'));
    expect(onChange).toHaveBeenCalledWith(6, input);
  });
});

describe('controlFromSlider / controlToSlider (range mode, minGap)', () => {
  it('keeps the from handle at least minGap below the to handle', () => {
    const ranger = new Ranger(makeInput({ min: 0, max: 100, value: 20, 'data-max-value': 40 }), { minGap: 10 });

    ranger.fromSlider.value = 35;
    ranger.fromSlider.dispatchEvent(new Event('input'));

    expect(Number(ranger.fromSlider.value)).toBe(30);
  });

  it('keeps the to handle at least minGap above the from handle', () => {
    const ranger = new Ranger(makeInput({ min: 0, max: 100, value: 20, 'data-max-value': 40 }), { minGap: 10 });

    ranger.toSlider.value = 25;
    ranger.toSlider.dispatchEvent(new Event('input'));

    expect(Number(ranger.toSlider.value)).toBe(30);
  });

  it('leaves values untouched when the gap already satisfies minGap', () => {
    const ranger = new Ranger(makeInput({ min: 0, max: 100, value: 20, 'data-max-value': 60 }), { minGap: 10 });

    ranger.fromSlider.value = 30;
    ranger.fromSlider.dispatchEvent(new Event('input'));

    expect(Number(ranger.fromSlider.value)).toBe(30);
  });

  it('has no gap enforcement by default (minGap 0)', () => {
    const ranger = new Ranger(makeInput({ min: 0, max: 100, value: 20, 'data-max-value': 40 }));

    ranger.fromSlider.value = 40;
    ranger.fromSlider.dispatchEvent(new Event('input'));

    expect(Number(ranger.fromSlider.value)).toBe(40);
  });

  it('fires onChange with [from, to] in range mode', () => {
    const onChange = vi.fn();
    const ranger = new Ranger(makeInput({ min: 0, max: 100, value: 20, 'data-max-value': 60 }), { onChange });

    ranger.toSlider.value = 70;
    ranger.toSlider.dispatchEvent(new Event('input'));

    expect(onChange).toHaveBeenLastCalledWith([20, 70], ranger.toSlider);
  });

  it('keeps the upper handle stacked above at/below the midpoint, and below past it', () => {
    const ranger = new Ranger(makeInput({ min: 0, max: 100, value: 10, 'data-max-value': 20 }));

    expect(ranger.toSlider.style.zIndex).toBe('4');

    ranger.toSlider.value = 80;
    ranger.toSlider.dispatchEvent(new Event('input'));
    expect(ranger.toSlider.style.zIndex).toBe('2');
  });
});

// ---------------------------------------------------------------------------
// resolveValue / snapPoints
// ---------------------------------------------------------------------------

describe('resolveValue / snapPoints', () => {
  it('rounds to the decimal precision of the step (not to step multiples) when there are no snap points', () => {
    const ranger = new Ranger(makeInput({ min: 0, max: 10, value: 0, step: 0.5 }));
    // roundToStep (see helpers.js) matches decimal *precision*, not step
    // multiples — a step of "0.5" has one decimal place, so 3.27 rounds to
    // 3.3, not to the nearest multiple of 0.5 (3.5).
    expect(ranger.resolveValue(3.27, '0.5')).toBe(3.3);
  });

  it('snaps to a nearby snap point within the threshold', () => {
    const ranger = new Ranger(makeInput({ min: 0, max: 100, value: 0 }), { snapPoints: [50], snapThreshold: 0.05 });
    expect(ranger.resolveValue(48, '1')).toBe(50);
  });

  it('does not snap when outside the threshold', () => {
    const ranger = new Ranger(makeInput({ min: 0, max: 100, value: 0 }), { snapPoints: [50], snapThreshold: 0.05 });
    expect(ranger.resolveValue(40, '1')).toBe(40);
  });

  it('snaps to whichever of several snap points is nearest', () => {
    const ranger = new Ranger(makeInput({ min: 0, max: 100, value: 0 }), {
      snapPoints: [10, 50, 90],
      snapThreshold: 0.1,
    });
    expect(ranger.resolveValue(55, '1')).toBe(50);
    expect(ranger.resolveValue(85, '1')).toBe(90);
  });

  it('keeps snapPoints isolated between instances (no shared-default mutation)', () => {
    const rangerA = new Ranger(makeInput({ min: 0, max: 100, value: 0 }));
    const rangerB = new Ranger(makeInput({ min: 0, max: 100, value: 0 }));

    rangerA.snapPoints.push(42);

    expect(rangerA.snapPoints).toEqual([42]);
    expect(rangerB.snapPoints).toEqual([]);
  });

  it('preserves full precision on a step="any" slider', () => {
    const ranger = new Ranger(makeInput({ min: 0, max: 1, value: 0, step: 'any' }));
    expect(ranger.resolveValue(0.123456, 'any')).toBeCloseTo(0.123456);
  });
});

// ---------------------------------------------------------------------------
// positionToValue
// ---------------------------------------------------------------------------

describe('positionToValue', () => {
  it('maps clientX linearly onto min..max under LTR', () => {
    const ranger = new Ranger(makeInput({ min: 0, max: 200, value: 0 }));
    mockRect(ranger.wrapper, { left: 100, width: 200, right: 300 });

    expect(ranger.positionToValue(100)).toBe(0);
    expect(ranger.positionToValue(300)).toBe(200);
    expect(ranger.positionToValue(200)).toBe(100);
  });

  it('reverses the mapping under RTL', () => {
    const ranger = new Ranger(makeInput({ min: 0, max: 200, value: 0 }));
    ranger.wrapper.style.direction = 'rtl';
    mockRect(ranger.wrapper, { left: 100, width: 200, right: 300 });

    expect(ranger.positionToValue(100)).toBe(200);
    expect(ranger.positionToValue(300)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// resetSlider (dblclick)
// ---------------------------------------------------------------------------

describe('resetSlider (dblclick)', () => {
  it('resets the from handle to its initial value', () => {
    const input = makeInput({ min: 0, max: 100, value: 30 });
    new Ranger(input);

    input.value = 90;
    input.dispatchEvent(new Event('input'));
    expect(input.value).toBe('90');

    input.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    expect(input.value).toBe('30');
  });

  it('resets the to handle to its initial value', () => {
    const ranger = new Ranger(makeInput({ min: 0, max: 100, value: 20, 'data-max-value': 60 }));

    ranger.toSlider.value = 90;
    ranger.toSlider.dispatchEvent(new Event('input'));
    expect(ranger.toSlider.value).toBe('90');

    ranger.toSlider.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    expect(ranger.toSlider.value).toBe('60');
  });
});

// ---------------------------------------------------------------------------
// handleKeydown — Shift+Arrow fine nudge
// ---------------------------------------------------------------------------

describe('handleKeydown (Shift+Arrow fine nudge)', () => {
  it('nudges up by step/10 by default on Shift+ArrowRight', () => {
    const input = makeInput({ min: 0, max: 10, value: 5, step: 1 });
    new Ranger(input);
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', shiftKey: true, cancelable: true }));
    expect(Number(input.value)).toBeCloseTo(5.1);
  });

  it('nudges down on Shift+ArrowLeft', () => {
    const input = makeInput({ min: 0, max: 10, value: 5, step: 1 });
    new Ranger(input);
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', shiftKey: true, cancelable: true }));
    expect(Number(input.value)).toBeCloseTo(4.9);
  });

  it('treats Shift+ArrowUp like ArrowRight and Shift+ArrowDown like ArrowLeft', () => {
    const upInput = makeInput({ min: 0, max: 10, value: 5, step: 1 });
    new Ranger(upInput);
    upInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', shiftKey: true, cancelable: true }));
    expect(Number(upInput.value)).toBeCloseTo(5.1);

    const downInput = makeInput({ min: 0, max: 10, value: 5, step: 1 });
    new Ranger(downInput);
    downInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', shiftKey: true, cancelable: true }));
    expect(Number(downInput.value)).toBeCloseTo(4.9);
  });

  it('uses a custom fineStep instead of step/10', () => {
    const input = makeInput({ min: 0, max: 10, value: 5, step: 1 });
    new Ranger(input, { fineStep: 2 });
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', shiftKey: true, cancelable: true }));
    expect(Number(input.value)).toBe(7);
  });

  it('accumulates correctly across repeated nudges', () => {
    const input = makeInput({ min: 0, max: 10, value: 5, step: 1 });
    new Ranger(input);
    for (let i = 0; i < 3; i += 1) {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', shiftKey: true, cancelable: true }));
    }
    expect(Number(input.value)).toBeCloseTo(5.3);
  });

  it('nudges by the slider\'s own (coarse) step without Shift', () => {
    // Regression guard: the native <input>'s own `step` attribute is kept
    // at "any" (see initialize() in index.js), since a real browser would
    // otherwise silently re-snap any fine value handleKeydown assigns back
    // onto the native step grid — so a plain arrow press can no longer be
    // left to the browser's own default action; it has to be handled here.
    const input = makeInput({ min: 0, max: 10, value: 5, step: 1 });
    new Ranger(input);
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true }));
    expect(input.value).toBe('6');
  });

  it('nudges down by the coarse step on a plain ArrowLeft', () => {
    const input = makeInput({ min: 0, max: 10, value: 5, step: 1 });
    new Ranger(input);
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', cancelable: true }));
    expect(input.value).toBe('4');
  });

  it('reverses plain ArrowLeft/ArrowRight under RTL, matching native browser behavior', () => {
    const input = makeInput({ min: 0, max: 10, value: 5, step: 1 });
    const ranger = new Ranger(input);
    ranger.wrapper.style.direction = 'rtl';

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true }));
    expect(input.value).toBe('4'); // ArrowRight decreases under RTL

    input.value = 5;
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', cancelable: true }));
    expect(input.value).toBe('6'); // ArrowLeft increases under RTL
  });

  it('does not flip ArrowUp/ArrowDown under RTL', () => {
    const input = makeInput({ min: 0, max: 10, value: 5, step: 1 });
    const ranger = new Ranger(input);
    ranger.wrapper.style.direction = 'rtl';

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', cancelable: true }));
    expect(input.value).toBe('6');
  });

  it('leaves Home/End/PageUp/PageDown to the browser\'s own default action', () => {
    const input = makeInput({ min: 0, max: 10, value: 5, step: 1 });
    new Ranger(input);

    ['Home', 'End', 'PageUp', 'PageDown'].forEach((key) => {
      const event = new KeyboardEvent('keydown', { key, cancelable: true });
      input.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(false);
    });
    expect(input.value).toBe('5');
  });

  it('ignores non-navigation keys even with Shift held', () => {
    const input = makeInput({ min: 0, max: 10, value: 5, step: 1 });
    new Ranger(input);
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', shiftKey: true, cancelable: true }));
    expect(input.value).toBe('5');
  });

  it('still applies snapPoints magnetism to a fine nudge', () => {
    const input = makeInput({ min: 0, max: 10, value: 4.7, step: 1 });
    new Ranger(input, { snapPoints: [5], snapThreshold: 1 }); // huge threshold: 0..10 * 1 = 10
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', shiftKey: true, cancelable: true }));
    // raw nudge would land on 4.8, but the (very generous) snap threshold pulls it onto 5
    expect(Number(input.value)).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// handleTrackClick
// ---------------------------------------------------------------------------

describe('handleTrackClick', () => {
  it('jumps the single handle to the clicked position', () => {
    const input = makeInput({ min: 0, max: 100, value: 0 });
    const ranger = new Ranger(input);
    mockRect(ranger.wrapper, { left: 0, width: 100, right: 100 });

    ranger.wrapper.dispatchEvent(new MouseEvent('click', { clientX: 70, bubbles: true }));

    expect(Number(input.value)).toBe(70);
  });

  it('does nothing when the click lands on a handle rather than the empty track', () => {
    const input = makeInput({ min: 0, max: 100, value: 30 });
    const ranger = new Ranger(input);
    mockRect(ranger.wrapper, { left: 0, width: 100, right: 100 });

    input.dispatchEvent(new MouseEvent('click', { clientX: 70, bubbles: true }));

    expect(input.value).toBe('30');
  });

  it('in range mode, moves whichever handle is closer to the click (upper handle)', () => {
    const ranger = new Ranger(makeInput({ min: 0, max: 100, value: 10, 'data-max-value': 90 }));
    mockRect(ranger.wrapper, { left: 0, width: 100, right: 100 });

    ranger.wrapper.dispatchEvent(new MouseEvent('click', { clientX: 85, bubbles: true }));

    expect(Number(ranger.toSlider.value)).toBe(85);
    expect(Number(ranger.fromSlider.value)).toBe(10);
  });

  it('in range mode, moves the from handle when the click is closer to it', () => {
    const ranger = new Ranger(makeInput({ min: 0, max: 100, value: 10, 'data-max-value': 90 }));
    mockRect(ranger.wrapper, { left: 0, width: 100, right: 100 });

    ranger.wrapper.dispatchEvent(new MouseEvent('click', { clientX: 15, bubbles: true }));

    expect(Number(ranger.fromSlider.value)).toBe(15);
    expect(Number(ranger.toSlider.value)).toBe(90);
  });
});

// ---------------------------------------------------------------------------
// handleFillDragStart — whole-range drag
// ---------------------------------------------------------------------------

describe('handleFillDragStart (drag the whole range via the fill)', () => {
  it('drags both handles together by the same delta, clamped to bounds', () => {
    const onStart = vi.fn();
    const onEnd = vi.fn();
    const ranger = new Ranger(makeInput({ min: 0, max: 100, value: 20, 'data-max-value': 40 }), { onStart, onEnd });
    mockRect(ranger.wrapper, { left: 0, width: 100, right: 100 });

    ranger.fill.dispatchEvent(new PointerEvent('pointerdown', { clientX: 0, pointerId: 1, bubbles: true }));
    expect(onStart).toHaveBeenCalledWith([20, 40], ranger.fill);

    ranger.fill.dispatchEvent(new PointerEvent('pointermove', { clientX: 30, pointerId: 1 }));
    expect(Number(ranger.fromSlider.value)).toBe(50);
    expect(Number(ranger.toSlider.value)).toBe(70);

    // Dragging further would push the to-handle past max(100); the pair's
    // spacing is preserved and the whole drag clamps together.
    ranger.fill.dispatchEvent(new PointerEvent('pointermove', { clientX: 90, pointerId: 1 }));
    expect(Number(ranger.toSlider.value)).toBe(100);
    expect(Number(ranger.fromSlider.value)).toBe(80);

    ranger.fill.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1 }));
    expect(onEnd).toHaveBeenCalledWith([80, 100], ranger.fill);
  });

  it('reverses drag direction under RTL', () => {
    const ranger = new Ranger(makeInput({ min: 0, max: 100, value: 20, 'data-max-value': 40 }));
    ranger.wrapper.style.direction = 'rtl';
    mockRect(ranger.wrapper, { left: 0, width: 100, right: 100 });

    ranger.fill.dispatchEvent(new PointerEvent('pointerdown', { clientX: 0, pointerId: 1, bubbles: true }));
    ranger.fill.dispatchEvent(new PointerEvent('pointermove', { clientX: 30, pointerId: 1 }));

    expect(Number(ranger.fromSlider.value)).toBe(0);
    expect(Number(ranger.toSlider.value)).toBe(20);
  });
});

// ---------------------------------------------------------------------------
// Drag/focus callbacks
// ---------------------------------------------------------------------------

describe('drag/focus callbacks', () => {
  it('fires onStart/onEnd around a pointerdown/pointerup drag on a handle', () => {
    const onStart = vi.fn();
    const onEnd = vi.fn();
    const input = makeInput({ min: 0, max: 100, value: 20 });
    new Ranger(input, { onStart, onEnd });

    input.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 1 }));
    expect(onStart).toHaveBeenCalledWith(20, input);

    document.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1 }));
    expect(onEnd).toHaveBeenCalledWith(20, input);
  });

  it('fires onStart with the pre-nudge value and onEnd with the post-nudge value around a keyboard navigation-key press', () => {
    const onStart = vi.fn();
    const onEnd = vi.fn();
    const input = makeInput({ min: 0, max: 100, value: 20 });
    new Ranger(input, { onStart, onEnd });

    // The keydown moves the slider (handleKeydown) — onStart must still
    // report the value from *before* that move, which only holds if its
    // own keydown listener runs before handleKeydown's (see addListeners).
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(onStart).toHaveBeenCalledWith(20, input);

    input.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowRight', bubbles: true }));
    expect(onEnd).toHaveBeenCalledWith(21, input);
  });

  it('does not fire onStart for non-navigation keys', () => {
    const onStart = vi.fn();
    const input = makeInput({ min: 0, max: 100, value: 20 });
    new Ranger(input, { onStart });

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
    expect(onStart).not.toHaveBeenCalled();
  });

  it('fires onFocus/onBlur on focus/blur', () => {
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    const input = makeInput({ min: 0, max: 100, value: 20 });
    new Ranger(input, { onFocus, onBlur });

    input.dispatchEvent(new FocusEvent('focus'));
    expect(onFocus).toHaveBeenCalledWith(20, input);

    input.dispatchEvent(new FocusEvent('blur'));
    expect(onBlur).toHaveBeenCalledWith(20, input);
  });

  it('reports [from, to] onStart for a whole-range fill drag', () => {
    const onStart = vi.fn();
    const ranger = new Ranger(makeInput({ min: 0, max: 100, value: 20, 'data-max-value': 40 }), { onStart });
    mockRect(ranger.wrapper, { left: 0, width: 100, right: 100 });

    ranger.fill.dispatchEvent(new PointerEvent('pointerdown', { clientX: 0, pointerId: 1, bubbles: true }));
    expect(onStart).toHaveBeenCalledWith([20, 40], ranger.fill);
  });

  it('does not throw when no callbacks are provided at all', () => {
    const input = makeInput({ min: 0, max: 100, value: 20 });
    expect(() => new Ranger(input)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// External fromInput/toInput two-way sync
// ---------------------------------------------------------------------------

describe('external fromInput/toInput two-way sync', () => {
  it('updates the slider (and re-fires its own input pipeline) when the external input changes', () => {
    const input = makeInput({ min: 0, max: 100, value: 20 });
    const external = document.createElement('input');
    document.body.appendChild(external);
    const onChange = vi.fn();
    new Ranger(input, { fromInput: external, onChange });

    external.value = '77';
    external.dispatchEvent(new Event('input'));

    expect(input.value).toBe('77');
    expect(onChange).toHaveBeenCalledWith(77, input);
  });

  it('keeps the external toInput synced with the upper handle', () => {
    const ranger = new Ranger(makeInput({ min: 0, max: 100, value: 20, 'data-max-value': 60 }), {
      toInput: (() => {
        const el = document.createElement('input');
        document.body.appendChild(el);
        return el;
      })(),
    });

    ranger.toSlider.value = 90;
    ranger.toSlider.dispatchEvent(new Event('input'));

    expect(ranger.toInput.value).toBe('90');
  });
});

// ---------------------------------------------------------------------------
// fixedRange — an appointment-style slot that slides but never resizes
// ---------------------------------------------------------------------------

describe('fixedRange', () => {
  it('locks in the initial gap (data-max-value minus value) when set to true', () => {
    const ranger = new Ranger(makeInput({ min: 0, max: 100, value: 20, 'data-max-value': 50 }), {
      fixedRange: true,
    });
    expect(ranger.rangeSize).toBe(30);
  });

  it('dragging the from handle slides the to handle by the same amount', () => {
    const ranger = new Ranger(makeInput({ min: 0, max: 100, value: 20, 'data-max-value': 50 }), {
      fixedRange: true,
    });

    ranger.fromSlider.value = 40;
    ranger.fromSlider.dispatchEvent(new Event('input'));

    expect(Number(ranger.fromSlider.value)).toBe(40);
    expect(Number(ranger.toSlider.value)).toBe(70); // 40 + 30
  });

  it('dragging the to handle slides the from handle by the same amount', () => {
    const ranger = new Ranger(makeInput({ min: 0, max: 100, value: 20, 'data-max-value': 50 }), {
      fixedRange: true,
    });

    ranger.toSlider.value = 90;
    ranger.toSlider.dispatchEvent(new Event('input'));

    expect(Number(ranger.toSlider.value)).toBe(90);
    expect(Number(ranger.fromSlider.value)).toBe(60); // 90 - 30
  });

  it('clamps the whole pair at the minimum instead of letting it shrink', () => {
    const ranger = new Ranger(makeInput({ min: 0, max: 100, value: 20, 'data-max-value': 50 }), {
      fixedRange: true,
    });

    ranger.fromSlider.value = 0;
    ranger.fromSlider.dispatchEvent(new Event('input'));

    expect(Number(ranger.fromSlider.value)).toBe(0);
    expect(Number(ranger.toSlider.value)).toBe(30); // gap preserved, not clipped to 0
  });

  it('clamps the whole pair at the maximum instead of letting it shrink', () => {
    const ranger = new Ranger(makeInput({ min: 0, max: 100, value: 20, 'data-max-value': 50 }), {
      fixedRange: true,
    });

    ranger.toSlider.value = 100;
    ranger.toSlider.dispatchEvent(new Event('input'));

    expect(Number(ranger.toSlider.value)).toBe(100);
    expect(Number(ranger.fromSlider.value)).toBe(70); // gap preserved, not clipped to 80
  });

  it('accepts an explicit numeric gap, overriding whatever data-max-value set up', () => {
    const ranger = new Ranger(makeInput({ min: 0, max: 100, value: 20, 'data-max-value': 50 }), {
      fixedRange: 10,
    });

    expect(ranger.rangeSize).toBe(10);
    expect(Number(ranger.fromSlider.value)).toBe(20);
    expect(Number(ranger.toSlider.value)).toBe(30); // re-synced at mount, not left at 50
  });

  it('fires onChange with [from, to] and the handle that was actually dragged', () => {
    const onChange = vi.fn();
    const ranger = new Ranger(makeInput({ min: 0, max: 100, value: 20, 'data-max-value': 50 }), {
      fixedRange: true,
      onChange,
    });

    ranger.fromSlider.value = 40;
    ranger.fromSlider.dispatchEvent(new Event('input'));

    expect(onChange).toHaveBeenCalledWith([40, 70], ranger.fromSlider);
  });

  it('keeps the gap fixed through a Shift+Arrow fine nudge', () => {
    const ranger = new Ranger(
      makeInput({ min: 0, max: 100, value: 20, step: 1, 'data-max-value': 50 }),
      { fixedRange: true },
    );

    ranger.fromSlider.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', shiftKey: true, cancelable: true }));

    expect(Number(ranger.fromSlider.value)).toBeCloseTo(20.1);
    expect(Number(ranger.toSlider.value)).toBeCloseTo(50.1);
  });

  it('is still fully compatible with dragging the whole range via the fill', () => {
    const ranger = new Ranger(makeInput({ min: 0, max: 100, value: 20, 'data-max-value': 50 }), {
      fixedRange: true,
    });
    mockRect(ranger.wrapper, { left: 0, width: 100, right: 100 });

    ranger.fill.dispatchEvent(new PointerEvent('pointerdown', { clientX: 0, pointerId: 1, bubbles: true }));
    ranger.fill.dispatchEvent(new PointerEvent('pointermove', { clientX: 20, pointerId: 1 }));

    expect(Number(ranger.fromSlider.value)).toBe(40);
    expect(Number(ranger.toSlider.value)).toBe(70);
  });

  it('ignores minGap while fixedRange is active', () => {
    const ranger = new Ranger(makeInput({ min: 0, max: 100, value: 20, 'data-max-value': 50 }), {
      fixedRange: true,
      minGap: 90, // would normally force a huge separation
    });

    ranger.fromSlider.value = 40;
    ranger.fromSlider.dispatchEvent(new Event('input'));

    expect(Number(ranger.toSlider.value)).toBe(70); // the fixed 30-wide gap, not minGap's 90
  });
});
