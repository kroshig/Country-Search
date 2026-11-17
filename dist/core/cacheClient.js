export class CachedCountryClient {
    cache = new Map();
    inFlight = new Map();
    fetcher;
    constructor(fetcher) {
        this.fetcher = fetcher;
    }
    hasCached(query) {
        return this.cache.has(this.normalizeKey(query));
    }
    async search(query, callerSignal) {
        const key = this.normalizeKey(query);
        if (!key)
            return [];
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
                .catch((err) => {
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
        return new Promise((resolve, reject) => {
            let settled = false;
            const onCallerAbort = () => {
                if (settled)
                    return;
                settled = true;
                currentEntry.activeSubscribers -= 1;
                if (currentEntry.activeSubscribers <= 0) {
                    this.inFlight.delete(key);
                    currentEntry.sharedController.abort(callerSignal?.reason ?? new DOMException('Aborted', 'AbortError'));
                }
                reject(callerSignal?.reason ?? new DOMException('Aborted', 'AbortError'));
            };
            if (callerSignal) {
                callerSignal.addEventListener('abort', onCallerAbort, { once: true });
            }
            currentEntry.promise
                .then((countries) => {
                if (settled)
                    return;
                settled = true;
                callerSignal?.removeEventListener('abort', onCallerAbort);
                currentEntry.activeSubscribers -= 1;
                resolve(countries);
            })
                .catch((err) => {
                if (settled)
                    return;
                settled = true;
                callerSignal?.removeEventListener('abort', onCallerAbort);
                currentEntry.activeSubscribers -= 1;
                reject(err);
            });
        });
    }
    normalizeKey(query) {
        return query.trim().toLowerCase();
    }
}
