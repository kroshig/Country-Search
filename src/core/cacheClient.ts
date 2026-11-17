import type { Country } from '../types.js';

interface InFlightEntry {
  promise: Promise<Country[]>;
  sharedController: AbortController;
  activeSubscribers: number;
}

export type FetcherFn = (query: string, signal?: AbortSignal) => Promise<Country[]>;

export class CachedCountryClient {
  private readonly cache = new Map<string, Country[]>();
  private readonly inFlight = new Map<string, InFlightEntry>();
  private readonly fetcher: FetcherFn;

  constructor(fetcher: FetcherFn) {
    this.fetcher = fetcher;
  }

  public hasCached(query: string): boolean {
    return this.cache.has(this.normalizeKey(query));
  }

  public async search(query: string, callerSignal?: AbortSignal): Promise<Country[]> {
    const key = this.normalizeKey(query);
    if (!key) return [];

    if (callerSignal?.aborted) {
      throw callerSignal.reason ?? new DOMException('Aborted', 'AbortError');
    }

    const cached = this.cache.get(key);
    if (cached !== undefined) {
      return cached;
    }

    let entry = this.inFlight.get(key);
    if (!entry) {
      const sharedController = new AbortController();
      const promise = this.fetcher(key, sharedController.signal)
        .then((result) => {
          this.cache.set(key, result);
          this.inFlight.delete(key);
          return result;
        })
        .catch((err: unknown) => {
          this.inFlight.delete(key);
          throw err;
        });

      entry = {
        promise,
        sharedController,
        activeSubscribers: 0,
      };
      this.inFlight.set(key, entry);
    }

    const currentEntry = entry;
    currentEntry.activeSubscribers += 1;

    return new Promise<Country[]>((resolve, reject) => {
      let settled = false;

      const onCallerAbort = (): void => {
        if (settled) return;
        settled = true;
        currentEntry.activeSubscribers -= 1;

        if (currentEntry.activeSubscribers <= 0) {
          this.inFlight.delete(key);
          currentEntry.sharedController.abort(
            callerSignal?.reason ?? new DOMException('Aborted', 'AbortError'),
          );
        }

        reject(callerSignal?.reason ?? new DOMException('Aborted', 'AbortError'));
      };

      if (callerSignal) {
        callerSignal.addEventListener('abort', onCallerAbort, { once: true });
      }

      currentEntry.promise
        .then((countries) => {
          if (settled) return;
          settled = true;
          callerSignal?.removeEventListener('abort', onCallerAbort);
          currentEntry.activeSubscribers -= 1;
          resolve(countries);
        })
        .catch((err: unknown) => {
          if (settled) return;
          settled = true;
          callerSignal?.removeEventListener('abort', onCallerAbort);
          currentEntry.activeSubscribers -= 1;
          reject(err);
        });
    });
  }

  private normalizeKey(query: string): string {
    return query.trim().toLowerCase();
  }
}
