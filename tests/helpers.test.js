import { describe, it, expect } from 'vitest';
import { createElement, roundToStep, NAVIGATION_KEYS, formatDisplayValue } from '../src/scripts/helpers.js';

describe('createElement', () => {
  it('creates an element of the requested tag', () => {
    const el = createElement('span');
    expect(el.tagName).toBe('SPAN');
  });

  it('leaves className empty when no classes are given', () => {
    const el = createElement('div');
    expect(el.className).toBe('');
  });

  it('applies the given class string verbatim, including multiple classes', () => {
    const el = createElement('div', 'foo bar');
    expect(el.className).toBe('foo bar');
  });

  it('leaves innerHTML empty when no content is given', () => {
    const el = createElement('div', 'foo');
    expect(el.innerHTML).toBe('');
  });

  it('sets innerHTML when content is given', () => {
    const el = createElement('ins', '', '42%');
    expect(el.innerHTML).toBe('42%');
  });

  it('supports markup in content', () => {
    const el = createElement('div', '', '<b>bold</b>');
    expect(el.querySelector('b')).not.toBeNull();
    expect(el.querySelector('b').textContent).toBe('bold');
  });
});

describe('roundToStep', () => {
  it('rounds to a whole number for an integer step', () => {
    expect(roundToStep(5.7, 1)).toBe(6);
    expect(roundToStep(5.4, 1)).toBe(5);
  });

  it('rounds to a whole number when step has no explicit decimals', () => {
    expect(roundToStep(3.456, 5)).toBe(3);
  });

  it('preserves one decimal place for a step of 0.1', () => {
    expect(roundToStep(1.23, 0.1)).toBe(1.2);
    expect(roundToStep(1.26, 0.1)).toBe(1.3);
  });

  it('preserves two decimal places for a step of 0.01', () => {
    expect(roundToStep(1.006, 0.01)).toBeCloseTo(1.01, 2);
    expect(roundToStep(1.234, 0.01)).toBe(1.23);
  });

  it('accepts the step as a numeric or string value equivalently', () => {
    expect(roundToStep(1.26, '0.1')).toBe(roundToStep(1.26, 0.1));
  });

  it('does not round the value at all when step is "any"', () => {
    // Per the function's own docs it "supports 'any'" — an any-step input
    // allows arbitrary precision, so no rounding should be applied.
    expect(roundToStep(3.14159, 'any')).toBeCloseTo(3.14159);
    expect(roundToStep(3.14159, 'ANY')).toBeCloseTo(3.14159);
  });

  it('handles negative values', () => {
    expect(roundToStep(-5.4, 1)).toBe(-5);
    expect(roundToStep(-5.46, 0.1)).toBe(-5.5);
  });

  it('handles a value of zero', () => {
    expect(roundToStep(0, 0.5)).toBe(0);
  });

  it('returns a number, not a string', () => {
    expect(typeof roundToStep('7.89', '0.1')).toBe('number');
  });
});

describe('NAVIGATION_KEYS', () => {
  it('contains exactly the browser-native slider navigation keys', () => {
    expect(NAVIGATION_KEYS).toEqual([
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

describe('formatDisplayValue', () => {
  it('uses labelPrefix/labelSuffix when no format function is set', () => {
    const instance = { format: null, labelPrefix: '$', labelSuffix: ' USD' };
    expect(formatDisplayValue(instance, 42)).toBe('$42 USD');
  });

  it('omits prefix/suffix entirely when both are empty', () => {
    const instance = { format: null, labelPrefix: '', labelSuffix: '' };
    expect(formatDisplayValue(instance, 42)).toBe('42');
  });

  it('calls the custom format function with the value coerced to a number', () => {
    const instance = { format: (value) => `#${value}` };
    expect(formatDisplayValue(instance, '42')).toBe('#42');
  });

  it('stringifies whatever the format function returns', () => {
    const instance = { format: (value) => value * 2 };
    expect(formatDisplayValue(instance, '10')).toBe('20');
  });

  it('prefers the format function over prefix/suffix when both are present', () => {
    const instance = { format: (value) => `x${value}`, labelPrefix: 'PRE', labelSuffix: 'SUF' };
    expect(formatDisplayValue(instance, 5)).toBe('x5');
  });
});
