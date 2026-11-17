export interface RawLanguage {
  name?: string;
  iso639_1?: string;
  iso639_2?: string;
}

export interface RawCurrency {
  code?: string;
  name?: string;
  symbol?: string;
}

export interface RawCountryResponse {
  name?: string | { common?: string; official?: string };
  official_name?: string;
  capital?: string | string[];
  region?: string;
  subregion?: string;
  population?: number;
  area?: number;
  borders?: string[];
  flag?: string;
  flags?: { svg?: string; png?: string; alt?: string };
  languages?: RawLanguage[];
  currencies?: RawCurrency[];
  description?: string;
}

export interface Country {
  name: string;
  officialName: string;
  capital: string;
  region: string;
  population: number;
  area: number;
  borders: string[];
  flagUrl: string;
  flagEmoji: string;
  languages: string[];
  currencies: string[];
  description: string;
}

export type ErrorKind = 'abort' | 'timeout' | 'http' | 'network';

export interface ClassifiedError {
  kind: ErrorKind;
  isSilent: boolean;
  userMessage: string;
  status?: number;
}
