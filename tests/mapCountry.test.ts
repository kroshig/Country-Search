import { describe, expect, it } from 'vitest';
import { mapCountryResponse } from '../src/mappers/mapCountry.js';
import type { RawCountryResponse } from '../src/types.js';

describe('mapCountryResponse', () => {
  it('maps countries.dev raw response object into Country model', () => {
    const raw: RawCountryResponse = {
      name: 'Spain',
      official_name: 'Kingdom of Spain',
      capital: 'Madrid',
      region: 'Europe',
      population: 47351567,
      area: 505992,
      borders: ['AND', 'FRA', 'GIB', 'PRT', 'MAR'],
      flag: '🇪🇸',
      flags: { svg: 'https://flagcdn.com/es.svg' },
      languages: [{ name: 'Spanish' }],
      currencies: [{ code: 'EUR', name: 'Euro', symbol: '€' }],
    };

    const mapped = mapCountryResponse(raw);

    expect(mapped).toEqual({
      name: 'Spain',
      officialName: 'Kingdom of Spain',
      capital: 'Madrid',
      region: 'Europe',
      population: 47351567,
      area: 505992,
      borders: ['AND', 'FRA', 'GIB', 'PRT', 'MAR'],
      flagUrl: 'https://flagcdn.com/es.svg',
      flagEmoji: '🇪🇸',
      languages: ['Spanish'],
      currencies: ['Euro (€)'],
      description: 'Kingdom of Spain — государство в регионе Europe со столицей Madrid.',
    });
  });

  it('provides safe fallbacks when optional fields are missing', () => {
    const mapped = mapCountryResponse({ name: 'Antarctica' });

    expect(mapped.name).toBe('Antarctica');
    expect(mapped.capital).toBe('Нет столицы');
    expect(mapped.region).toBe('Не указан');
    expect(mapped.languages).toEqual([]);
    expect(mapped.currencies).toEqual([]);
    expect(mapped.borders).toEqual([]);
  });
});
