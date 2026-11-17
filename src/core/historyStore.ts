const STORAGE_KEY = 'country_search_history_v1';
const MAX_HISTORY_ITEMS = 8;

export class SearchHistoryStore {
  public getHistory(): string[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed)
        ? parsed.filter((item): item is string => typeof item === 'string')
        : [];
    } catch {
      return [];
    }
  }

  public addQuery(query: string): string[] {
    const normalized = query.trim();
    if (!normalized) return this.getHistory();

    const existing = this.getHistory().filter(
      (item) => item.toLowerCase() !== normalized.toLowerCase(),
    );
    const updated = [normalized, ...existing].slice(0, MAX_HISTORY_ITEMS);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ничего не делаем, чтобы приложение работало дальше без истории
    }

    return updated;
  }
}
