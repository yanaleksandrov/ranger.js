import { vi } from 'vitest';

// jsdom implements neither ResizeObserver nor PointerEvent nor pointer
// capture — Ranger relies on all three, so stub them for the whole suite.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = ResizeObserverStub;
}

if (!globalThis.PointerEvent) {
  class PointerEventStub extends MouseEvent {
    constructor(type, params = {}) {
      super(type, params);
      this.pointerId = params.pointerId ?? 1;
    }
  }
  globalThis.PointerEvent = PointerEventStub;
}

if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = vi.fn();
}
if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = vi.fn();
}
