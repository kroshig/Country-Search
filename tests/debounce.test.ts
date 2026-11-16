import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { debounce } from '../src/utils/debounce.js';

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('delays function execution until delay ms have passed', () => {
    const spy = vi.fn();
    const debounced = debounce(spy, 300);

    debounced('spain');
    expect(spy).not.toHaveBeenCalled();

    vi.advanceTimersByTime(299);
    expect(spy).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('spain');
  });

  it('resets timer when called again before delay expires', () => {
    const spy = vi.fn();
    const debounced = debounce(spy, 300);

    debounced('s');
    vi.advanceTimersByTime(200);
    debounced('sp');
    vi.advanceTimersByTime(200);
    debounced('spa');
    vi.advanceTimersByTime(299);

    expect(spy).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('spa');
  });

  it('cancels pending execution when cancel() is called', () => {
    const spy = vi.fn();
    const debounced = debounce(spy, 300);

    debounced('spain');
    vi.advanceTimersByTime(150);
    debounced.cancel();
    vi.advanceTimersByTime(300);

    expect(spy).not.toHaveBeenCalled();
  });
});
