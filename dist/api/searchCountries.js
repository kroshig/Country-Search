import { HttpError } from '../errors/httpError.js';
import { mapCountryResponse } from '../mappers/mapCountry.js';
const API_BASE_URL = 'https://countries.dev/name';
const DEFAULT_TIMEOUT_MS = 8000;
function composeAbortSignal(userSignal, timeoutMs = DEFAULT_TIMEOUT_MS) {
    const timeoutSignal = AbortSignal.timeout(timeoutMs);
    if (!userSignal) {
        return timeoutSignal;
    }
    if (typeof AbortSignal.any === 'function') {
        return AbortSignal.any([userSignal, timeoutSignal]);
    }
    const controller = new AbortController();
    const forwardAbort = (source) => {
        if (!controller.signal.aborted) {
            controller.abort(source.reason);
        }
    };
    if (userSignal.aborted) {
        forwardAbort(userSignal);
    }
    else if (timeoutSignal.aborted) {
        forwardAbort(timeoutSignal);
    }
    else {
        userSignal.addEventListener('abort', () => forwardAbort(userSignal), { once: true });
        timeoutSignal.addEventListener('abort', () => forwardAbort(timeoutSignal), { once: true });
    }
    return controller.signal;
}
export async function searchCountries(query, signal, timeoutMs = DEFAULT_TIMEOUT_MS) {
    const trimmed = query.trim();
    if (!trimmed) {
        return [];
    }
    const combinedSignal = composeAbortSignal(signal, timeoutMs);
    const url = `${API_BASE_URL}/${encodeURIComponent(trimmed)}`;
    const response = await fetch(url, { signal: combinedSignal });
    if (response.status === 404) {
        return [];
    }
    if (!response.ok) {
        throw new HttpError(response.status, `Failed to fetch countries: ${response.status}`);
    }
    const data = await response.json();
    if (!Array.isArray(data)) {
        return [];
    }
    return data.map(mapCountryResponse);
}
