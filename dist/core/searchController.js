import { classifySearchError } from '../errors/httpError.js';
import { debounce } from '../utils/debounce.js';
export class SearchController {
    currentAbortController = null;
    lastQuery = '';
    fetcher;
    onStateChange;
    onQuerySaved;
    scheduleSearch;
    constructor(options) {
        this.fetcher = options.fetcher;
        this.onStateChange = options.onStateChange;
        this.onQuerySaved = options.onQuerySaved;
        this.scheduleSearch = debounce((query) => {
            void this.executeSearch(query);
        }, options.debounceMs ?? 300);
    }
    handleInput(rawInput) {
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
    async triggerImmediateSearch(query) {
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
    async retryLastSearch() {
        if (!this.lastQuery)
            return;
        await this.triggerImmediateSearch(this.lastQuery);
    }
    abortActiveRequest() {
        if (this.currentAbortController) {
            this.currentAbortController.abort(new DOMException('Aborted by new input', 'AbortError'));
            this.currentAbortController = null;
        }
    }
    async executeSearch(query) {
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
            }
            else {
                this.onStateChange({ status: 'success', query, countries });
            }
        }
        catch (error) {
            const classified = classifySearchError(error);
            if (classified.isSilent) {
                return;
            }
            this.onStateChange({
                status: 'error',
                query,
                message: classified.userMessage,
            });
        }
        finally {
            if (this.currentAbortController === controller) {
                this.currentAbortController = null;
            }
        }
    }
}
