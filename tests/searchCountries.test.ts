import { afterEach, describe, expect, it, vi } from 'vitest';
import { searchCountries } from '../src/api/searchCountries.js';
import { HttpError } from '../src/errors/httpError.js';

describe('searchCountries', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns mapped countries on 200 OK', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => [
          { name: 'Spain', capital: 'Madrid', region: 'Europe', population: 47000000 },
        ],
      }),
    );

    const result = await searchCountries('spain');
    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe('Spain');
  });

  it('treats 404 status as empty array without throwing HttpError', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Not Found' }),
      }),
    );

    const result = await searchCountries('nonexistentcountry');
    expect(result).toEqual([]);
  });

  it('throws HttpError with response status on non-404 HTTP errors (e.g. 500)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      }),
    );

    await expect(searchCountries('spain')).rejects.toThrowError(HttpError);
    await expect(searchCountries('spain')).rejects.toMatchObject({ status: 500 });
  });
});
