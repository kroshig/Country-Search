import { searchCountries } from './api/searchCountries.js';
import { CachedCountryClient } from './core/cacheClient.js';
import { SearchHistoryStore } from './core/historyStore.js';
import { SearchController } from './core/searchController.js';
import { CountrySearchView } from './ui/domView.js';
const historyStore = new SearchHistoryStore();
const cachedClient = new CachedCountryClient((query, signal) => searchCountries(query, signal));
const view = new CountrySearchView(document.body, {
    onInputChange: (val) => controller.handleInput(val),
    onRetry: () => void controller.retryLastSearch(),
    onSelectHistory: (query) => void controller.triggerImmediateSearch(query),
});
const controller = new SearchController({
    fetcher: (query, signal) => cachedClient.search(query, signal),
    debounceMs: 300,
    onStateChange: (state) => {
        view.renderState(state);
    },
    onQuerySaved: (query) => {
        const updatedHistory = historyStore.addQuery(query);
        view.renderHistory(updatedHistory);
    },
});
view.renderHistory(historyStore.getHistory());
