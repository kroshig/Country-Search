import { classifySearchError } from '../errors/httpError.js';
import type { Country } from '../types.js';
import { debounce } from '../utils/debounce.js';
import type { FetcherFn } from './cacheClient.js';

export type SearchViewState =
  | { status: 'idle' }
  | { status: 'loading'; query: string }
  | { status: 'empty'; query: string }
  | { status: 'success'; query: string; countries: Country[] }
  | { status: 'error'; query: string; message: string };

export interface SearchControllerOptions {
  fetcher: FetcherFn;
  debounceMs?: number;
  onStateChange: (state: SearchViewState) => void;
  onQuerySaved?: (query: string) => void;
}

export class SearchController {
  private currentAbortController: AbortController | null = null;
  private lastQuery = '';
  private readonly fetcher: FetcherFn;
  private readonly onStateChange: (state: SearchViewState) => void;
  private readonly onQuerySaved?: (query: string) => void;
  private readonly scheduleSearch: ReturnType<typeof debounce<[string]>>;

  constructor(options: SearchControllerOptions) {
    this.fetcher = options.fetcher;
    this.onStateChange = options.onStateChange;
    this.onQuerySaved = options.onQuerySaved;
    this.scheduleSearch = debounce((query: string) => {
      void this.executeSearch(query);
    }, options.debounceMs ?? 300);
  }

  public handleInput(rawInput: string): void {
    this.abortActiveRequest();

    const trimmed = rawInput.trim();
    this.lastQuery = trimmed;

    if (!trimmed) {
      this.scheduleSearch.cancel();
      this.onStateChange({ status: 'idle' });
      return;
    }

    this.scheduleSearch(trimmed);
  }

  public async triggerImmediateSearch(query: string): Promise<void> {
    this.abortActiveRequest();
    this.scheduleSearch.cancel();
    const trimmed = query.trim();
    this.lastQuery = trimmed;

    if (!trimmed) {
      this.onStateChange({ status: 'idle' });
      return;
    }

    await this.executeSearch(trimmed);
  }

  public async retryLastSearch(): Promise<void> {
    if (!this.lastQuery) return;
    await this.triggerImmediateSearch(this.lastQuery);
  }

  private abortActiveRequest(): void {
    if (this.currentAbortController) {
      this.currentAbortController.abort(new DOMException('Aborted by new input', 'AbortError'));
      this.currentAbortController = null;
    }
  }

  private async executeSearch(query: string): Promise<void> {
    const controller = new AbortController();
    this.currentAbortController = controller;

    this.onStateChange({ status: 'loading', query });

    try {
      const countries = await this.fetcher(query, controller.signal);

      if (controller.signal.aborted) {
        return;
      }

      this.onQuerySaved?.(query);

      if (countries.length === 0) {
        this.onStateChange({ status: 'empty', query });
      } else {
        this.onStateChange({ status: 'success', query, countries });
      }
    } catch (error: unknown) {
      const classified = classifySearchError(error);
      if (classified.isSilent) {
        return;
      }

      this.onStateChange({
        status: 'error',
        query,
        message: classified.userMessage,
      });
    } finally {
      if (this.currentAbortController === controller) {
        this.currentAbortController = null;
      }
    }
  }
}
