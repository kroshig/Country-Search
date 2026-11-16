import type { Country, RawCountryResponse } from '../types.js';

export function mapCountryResponse(_raw: RawCountryResponse): Country {
  return {
    name: '',
    officialName: '',
    capital: '',
    region: '',
    population: 0,
    area: 0,
    borders: [],
    flagUrl: '',
    flagEmoji: '',
    languages: [],
    currencies: [],
    description: '',
  };
}
