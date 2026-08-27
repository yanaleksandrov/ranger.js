import { describe, it, expect, beforeEach } from 'vitest';
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

describe('createScale', () => {
  it('creates scaleTicksCount + 1 ticks when there are no minor ticks', () => {
    const input = makeInput({ min: 0, max: 100, value: 0 });
    const ranger = new Ranger(input, { scaleTicksCount: 10, scaleMinorTicksCount: 0 });

    expect(ranger.scaleTicks).toHaveLength(11);
    expect(ranger.scaleTicks.every((tick) => tick.isMajor)).toBe(true);
  });

  it('evenly spaces tick values across min/max', () => {
    const input = makeInput({ min: 0, max: 100, value: 0 });
    const ranger = new Ranger(input, { scaleTicksCount: 4, scaleMinorTicksCount: 0 });

    expect(ranger.scaleTicks.map((t) => t.value)).toEqual([0, 25, 50, 75, 100]);
  });

  it('inserts the requested number of minor ticks evenly between major ticks', () => {
    const input = makeInput({ min: 0, max: 100, value: 0 });
    const ranger = new Ranger(input, { scaleTicksCount: 2, scaleMinorTicksCount: 3 });

    // 2 major segments * (3 minor + 1) = 8 segments => 9 ticks total
    expect(ranger.scaleTicks).toHaveLength(9);

    const majorIndexes = ranger.scaleTicks.reduce((acc, t, i) => (t.isMajor ? [...acc, i] : acc), []);
    expect(majorIndexes).toEqual([0, 4, 8]);

    const minorCount = ranger.scaleTicks.filter((t) => !t.isMajor).length;
    expect(minorCount).toBe(6);
  });

  it('only renders a text label on major ticks', () => {
    const input = makeInput({ min: 0, max: 100, value: 0 });
    const ranger = new Ranger(input, { scaleTicksCount: 2, scaleMinorTicksCount: 1 });

    ranger.scaleTicks.forEach(({ isMajor, label }) => {
      if (isMajor) {
        expect(label).not.toBeNull();
      } else {
        expect(label).toBeNull();
      }
    });
  });

  it('applies scaleTickPrefix/scaleTickSuffix to major tick labels', () => {
    const input = makeInput({ min: 0, max: 10, value: 0 });
    const ranger = new Ranger(input, { scaleTicksCount: 2, scaleTickPrefix: '$', scaleTickSuffix: 'k' });

    const texts = ranger.scaleTicks.filter((t) => t.isMajor).map((t) => t.label.innerHTML);
    expect(texts).toEqual(['$0k', '$5k', '$10k']);
  });

  it('formats major tick labels through a custom format function', () => {
    const input = makeInput({ min: 0, max: 10, value: 0 });
    const ranger = new Ranger(input, { scaleTicksCount: 2, format: (v) => `F${v}` });

    const texts = ranger.scaleTicks.filter((t) => t.isMajor).map((t) => t.label.innerHTML);
    expect(texts).toEqual(['F0', 'F5', 'F10']);
  });

  it('rounds major tick values to the slider step before formatting', () => {
    const input = makeInput({ min: 0, max: 1, value: 0, step: 0.1 });
    const ranger = new Ranger(input, { scaleTicksCount: 3 });

    const texts = ranger.scaleTicks.filter((t) => t.isMajor).map((t) => t.label.innerHTML);
    // 0, 1/3, 2/3, 1 rounded to one decimal place (the slider's step)
    expect(texts).toEqual(['0', '0.3', '0.7', '1']);
  });

  it('is not created when scaleTicksCount is 0', () => {
    const input = makeInput({ min: 0, max: 100, value: 0 });
    const ranger = new Ranger(input, { scaleTicksCount: 0 });

    expect(ranger.scale).toBeUndefined();
  });
});

describe('updateScale (--ranger-scale arc: 1 (tallest) at the handle, eases non-linearly down to 0 across the radius)', () => {
  it('is 1 (its tallest) exactly at the handle', () => {
    const input = makeInput({ min: 0, max: 100, value: 50 });
    const ranger = new Ranger(input, { scaleTicksCount: 10, scaleAnimatedTicksCount: 1 });

    const atHandle = ranger.scaleTicks.find((t) => t.value === 50);
    expect(atHandle.tick.style.getPropertyValue('--ranger-scale')).toBe('1.00');
  });

  it('is 0.25 at the midpoint of the scaleAnimatedTicksCount radius (a sharpened, not a plain, raised cosine)', () => {
    // tickSpacing = 10, scaleAnimatedTicksCount = 1 => maxDistance = 10;
    // a handle at 55 puts the tick at 50 exactly at distance 5 (half of 10).
    // A plain raised cosine (or a linear ramp) would read 0.5 there — the
    // sharpened arc pulls the shoulders in toward the handle, so the
    // midpoint reads lower (0.5 squared) and the peak looks taller/narrower
    // against its surroundings.
    const input = makeInput({ min: 0, max: 100, value: 55 });
    const ranger = new Ranger(input, { scaleTicksCount: 10, scaleAnimatedTicksCount: 1 });

    const halfway = ranger.scaleTicks.find((t) => t.value === 50);
    expect(halfway.tick.style.getPropertyValue('--ranger-scale')).toBe('0.25');
  });

  it('eases down to 0 at the far edge of the radius, and stays 0 beyond it', () => {
    const input = makeInput({ min: 0, max: 100, value: 50 });
    const ranger = new Ranger(input, { scaleTicksCount: 10, scaleAnimatedTicksCount: 1 });

    const atFarEdge = ranger.scaleTicks.find((t) => t.value === 40); // distance 10 == maxDistance
    const wayBeyond = ranger.scaleTicks.find((t) => t.value === 0); // distance 50
    expect(atFarEdge.tick.style.getPropertyValue('--ranger-scale')).toBe('0.00');
    expect(wayBeyond.tick.style.getPropertyValue('--ranger-scale')).toBe('0.00');
  });

  it('is a single hump peaking at the handle — not a dip at the handle flanked by two peaks', () => {
    // Regression guard for a shape that briefly shipped: 0 right at the
    // handle with a peak on either side of it (two humps, a dip in the
    // middle) instead of one hump peaking at the handle itself.
    const input = makeInput({ min: 0, max: 100, value: 50 });
    const ranger = new Ranger(input, { scaleTicksCount: 10, scaleMinorTicksCount: 9, scaleAnimatedTicksCount: 5 });

    const scaleAt = (val) => Number(ranger.scaleTicks.find((t) => t.value === val).tick.style.getPropertyValue('--ranger-scale'));
    const left = [46, 47, 48, 49, 50].map(scaleAt);
    const right = [50, 51, 52, 53, 54].map(scaleAt);

    for (let i = 1; i < left.length; i += 1) {
      expect(left[i]).toBeGreaterThan(left[i - 1]); // strictly rises approaching the handle from the left
    }
    for (let i = 1; i < right.length; i += 1) {
      expect(right[i]).toBeLessThan(right[i - 1]); // strictly falls moving away on the right
    }
    expect(scaleAt(50)).toBe(1);
  });

  it('recomputes the arc on every input event', () => {
    const input = makeInput({ min: 0, max: 100, value: 50 });
    const ranger = new Ranger(input, { scaleTicksCount: 10, scaleAnimatedTicksCount: 1 });
    const tick50 = ranger.scaleTicks.find((t) => t.value === 50);
    expect(tick50.tick.style.getPropertyValue('--ranger-scale')).toBe('1.00');

    input.value = 0;
    input.dispatchEvent(new Event('input'));

    expect(tick50.tick.style.getPropertyValue('--ranger-scale')).toBe('0.00');
  });

  it('uses the distance to whichever handle is nearer in range mode', () => {
    const input = makeInput({ min: 0, max: 100, value: 20, 'data-max-value': 80 });
    const ranger = new Ranger(input, { scaleTicksCount: 10, scaleAnimatedTicksCount: 1 });

    const nearFrom = ranger.scaleTicks.find((t) => t.value === 20);
    const nearTo = ranger.scaleTicks.find((t) => t.value === 80);
    expect(nearFrom.tick.style.getPropertyValue('--ranger-scale')).toBe('1.00');
    expect(nearTo.tick.style.getPropertyValue('--ranger-scale')).toBe('1.00');
  });

  it('does not throw or produce NaN when scaleAnimatedTicksCount is 0', () => {
    const input = makeInput({ min: 0, max: 100, value: 50 });
    const ranger = new Ranger(input, { scaleTicksCount: 10, scaleAnimatedTicksCount: 0 });

    ranger.scaleTicks.forEach(({ tick }) => {
      expect(tick.style.getPropertyValue('--ranger-scale')).toBe('0.00');
    });
  });
});
