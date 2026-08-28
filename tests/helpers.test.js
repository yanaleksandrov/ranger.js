import { describe, it, expect } from 'vitest';
import Ranger from '../src/index.js';

describe('Ranger.createElement', () => {
  it('creates an element of the requested tag', () => {
    const el = Ranger.createElement('span');
    expect(el.tagName).toBe('SPAN');
  });

  it('leaves className empty when no classes are given', () => {
    const el = Ranger.createElement('div');
    expect(el.className).toBe('');
  });

  it('applies the given class string verbatim, including multiple classes', () => {
    const el = Ranger.createElement('div', 'foo bar');
    expect(el.className).toBe('foo bar');
  });

  it('leaves innerHTML empty when no content is given', () => {
    const el = Ranger.createElement('div', 'foo');
    expect(el.innerHTML).toBe('');
  });

  it('sets innerHTML when content is given', () => {
    const el = Ranger.createElement('ins', '', '42%');
    expect(el.innerHTML).toBe('42%');
  });

  it('supports markup in content', () => {
    const el = Ranger.createElement('div', '', '<b>bold</b>');
    expect(el.querySelector('b')).not.toBeNull();
    expect(el.querySelector('b').textContent).toBe('bold');
  });
});

describe('Ranger.roundToStep', () => {
  it('rounds to a whole number for an integer step', () => {
    expect(Ranger.roundToStep(5.7, 1)).toBe(6);
    expect(Ranger.roundToStep(5.4, 1)).toBe(5);
  });

  it('rounds to a whole number when step has no explicit decimals', () => {
    expect(Ranger.roundToStep(3.456, 5)).toBe(3);
  });

  it('preserves one decimal place for a step of 0.1', () => {
    expect(Ranger.roundToStep(1.23, 0.1)).toBe(1.2);
    expect(Ranger.roundToStep(1.26, 0.1)).toBe(1.3);
  });

  it('preserves two decimal places for a step of 0.01', () => {
    expect(Ranger.roundToStep(1.006, 0.01)).toBeCloseTo(1.01, 2);
    expect(Ranger.roundToStep(1.234, 0.01)).toBe(1.23);
  });

  it('accepts the step as a numeric or string value equivalently', () => {
    expect(Ranger.roundToStep(1.26, '0.1')).toBe(Ranger.roundToStep(1.26, 0.1));
  });

  it('does not round the value at all when step is "any"', () => {
    // An any-step input allows arbitrary precision, so no rounding applies.
    expect(Ranger.roundToStep(3.14159, 'any')).toBeCloseTo(3.14159);
    expect(Ranger.roundToStep(3.14159, 'ANY')).toBeCloseTo(3.14159);
  });

  it('handles negative values', () => {
    expect(Ranger.roundToStep(-5.4, 1)).toBe(-5);
    expect(Ranger.roundToStep(-5.46, 0.1)).toBe(-5.5);
  });

  it('handles a value of zero', () => {
    expect(Ranger.roundToStep(0, 0.5)).toBe(0);
  });

  it('returns a number, not a string', () => {
    expect(typeof Ranger.roundToStep('7.89', '0.1')).toBe('number');
  });
});

describe('Ranger.calculatePercent', () => {
  it('computes where a value falls between start and end', () => {
    expect(Ranger.calculatePercent(0, 100, 25)).toBe(25);
    expect(Ranger.calculatePercent(-50, 50, 0)).toBe(50);
  });
});

describe('Ranger.calculateMarkPosition', () => {
  it('sits thumbInset px in from the edge at percent 0/100, not flush with the edge', () => {
    expect(Ranger.calculateMarkPosition(200, 10, 0)).toBe(10);
    expect(Ranger.calculateMarkPosition(200, 10, 100)).toBe(190);
  });

  it('interpolates linearly across the inset track for percents in between', () => {
    expect(Ranger.calculateMarkPosition(200, 10, 50)).toBe(100);
    expect(Ranger.calculateMarkPosition(200, 10, 25)).toBe(55);
  });

  it('falls back to a plain percent of the full width when thumbInset is 0', () => {
    expect(Ranger.calculateMarkPosition(200, 0, 25)).toBe(50);
    expect(Ranger.calculateMarkPosition(200, 0, 100)).toBe(200);
  });
});

describe('Ranger.findSkip', () => {
  it('returns minSkip itself when it already divides lastIndex evenly', () => {
    expect(Ranger.findSkip(10, 2)).toBe(2);
  });

  it('advances to the next divisor when minSkip does not divide evenly', () => {
    expect(Ranger.findSkip(10, 3)).toBe(5);
  });

  it('falls back to lastIndex when no divisor >= minSkip exists (other than itself)', () => {
    expect(Ranger.findSkip(7, 4)).toBe(7);
  });
});

describe('Ranger.NAVIGATION_KEYS', () => {
  it('contains exactly the browser-native slider navigation keys', () => {
    expect(Ranger.NAVIGATION_KEYS).toEqual([
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      'Home',
      'End',
      'PageUp',
      'PageDown',
    ]);
  });
});

describe('Ranger#formatDisplayValue', () => {
  // An instance method (reads this.format/labelPrefix/labelSuffix) — called
  // via .call() on a minimal fake instance instead of a fully mounted Ranger.
  const format = (fakeInstance, value) => Ranger.prototype.formatDisplayValue.call(fakeInstance, value);

  it('uses labelPrefix/labelSuffix when no format function is set', () => {
    expect(format({ format: null, labelPrefix: '$', labelSuffix: ' USD' }, 42)).toBe('$42 USD');
  });

  it('omits prefix/suffix entirely when both are empty', () => {
    expect(format({ format: null, labelPrefix: '', labelSuffix: '' }, 42)).toBe('42');
  });

  it('calls the custom format function with the value coerced to a number', () => {
    expect(format({ format: (value) => `#${value}` }, '42')).toBe('#42');
  });

  it('stringifies whatever the format function returns', () => {
    expect(format({ format: (value) => value * 2 }, '10')).toBe('20');
  });

  it('prefers the format function over prefix/suffix when both are present', () => {
    expect(format({ format: (value) => `x${value}`, labelPrefix: 'PRE', labelSuffix: 'SUF' }, 5)).toBe('x5');
  });
});
