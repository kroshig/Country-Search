import type { Country, RawCountryResponse } from '../types.js';

export function mapCountryResponse(raw: RawCountryResponse): Country {
  const resolvedName =
    typeof raw.name === 'string' ? raw.name : (raw.name?.common ?? 'Unknown Country');

  const officialName =
    raw.official_name ??
    (typeof raw.name === 'object' && raw.name !== null
      ? (raw.name.official ?? resolvedName)
      : resolvedName);

  const capital = Array.isArray(raw.capital)
    ? (raw.capital[0] ?? 'Нет столицы')
    : raw.capital || 'Нет столицы';

  const region = raw.region || 'Не указан';
  const population = typeof raw.population === 'number' ? raw.population : 0;
  const area = typeof raw.area === 'number' ? raw.area : 0;
  const borders = Array.isArray(raw.borders) ? [...raw.borders] : [];

  const flagUrl =
    raw.flags?.svg ??
    raw.flags?.png ??
    (typeof raw.flag === 'string' && raw.flag.startsWith('http') ? raw.flag : '');

  const flagEmoji = typeof raw.flag === 'string' && !raw.flag.startsWith('http') ? raw.flag : '🏳️';

  const languages = Array.isArray(raw.languages)
    ? raw.languages
        .map((lang) => lang.name?.trim() ?? '')
        .filter((name): name is string => Boolean(name))
    : [];

  const currencies = Array.isArray(raw.currencies)
    ? raw.currencies
        .map((curr) => {
          const name = curr.name?.trim();
          const symbol = curr.symbol?.trim();
          if (name && symbol) return `${name} (${symbol})`;
          return name ?? curr.code ?? '';
        })
        .filter((item): item is string => Boolean(item))
    : [];

  const description =
    raw.description ?? `${officialName} — государство в регионе ${region} со столицей ${capital}.`;

  return {
    name: resolvedName,
    officialName,
    capital,
    region,
    population,
    area,
    borders,
    flagUrl,
    flagEmoji,
    languages,
    currencies,
    description,
  };
}
