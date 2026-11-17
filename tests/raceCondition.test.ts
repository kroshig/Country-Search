import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { searchCountries } from '../src/api/searchCountries.js';
import { SearchController, type SearchViewState } from '../src/core/searchController';

describe('Race condition and real AbortController cancellation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('aborts the earlier slower request via AbortSignal and keeps only latest result', async () => {
    const capturedSignals: Record<string, AbortSignal | undefined> = {};

    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      const signal = init?.signal ?? undefined;
      const isSlowQuery = url.endsWith('/sp');
      const queryKey = isSlowQuery ? 'sp' : 'spain';
      capturedSignals[queryKey] = signal;

      return new Promise<Response>((resolve, reject) => {
        if (signal?.aborted) {
          reject(new DOMException('The operation was aborted.', 'AbortError'));
          return;
        }

        const onAbort = (): void => {
          clearTimeout(timer);
          reject(new DOMException('The operation was aborted.', 'AbortError'));
        };

        signal?.addEventListener('abort', onAbort, { once: true });

        const responseDelay = isSlowQuery ? 500 : 100;
        const timer = setTimeout(() => {
          signal?.removeEventListener('abort', onAbort);
          resolve({
            ok: true,
            status: 200,
            json: async () =>
              isSlowQuery
                ? [{ name: 'Stale Country (sp)', capital: 'Old', region: 'Europe', population: 1 }]
                : [{ name: 'Spain', capital: 'Madrid', region: 'Europe', population: 47351567 }],
          } as Response);
        }, responseDelay);
      });
    });

    vi.stubGlobal('fetch', fetchMock);

    const states: SearchViewState[] = [];
    const controller = new SearchController({
      fetcher: (q, signal) => searchCountries(q, signal),
      debounceMs: 300,
      onStateChange: (state) => states.push(state),
    });

    // 1. Вводим "sp", ждем debounce (300 мс) — первый запрос уходит в сеть
    controller.handleInput('sp');
    vi.advanceTimersByTime(300);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(capturedSignals['sp']?.aborted).toBe(false);

    // 2. Через 50 мс допечатываем "spain"
    vi.advanceTimersByTime(50);
    controller.handleInput('spain');

    // Проверяем, что первый запрос отменён СРАЗУ при новом вводе
    expect(capturedSignals['sp']?.aborted).toBe(true);

    // 3. Ждем завершения второго запроса
    await vi.advanceTimersByTimeAsync(300 + 100 + 500);

    const finalState = states[states.length - 1];
    expect(finalState).toEqual({
      status: 'success',
      query: 'spain',
      countries: [
        expect.objectContaining({
          name: 'Spain',
          capital: 'Madrid',
        }),
      ],
    });

    const errorStates = states.filter((s) => s.status === 'error');
    expect(errorStates).toHaveLength(0);
  });
});
