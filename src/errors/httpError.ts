import type { ClassifiedError } from '../types.js';

export class HttpError extends Error {
  public readonly status: number;

  constructor(status: number, message?: string) {
    super(message ?? `HTTP Error: status ${status}`);
    this.name = 'HttpError';
    this.status = status;
    Object.setPrototypeOf(this, HttpError.prototype);
  }
}

export function classifySearchError(error: unknown): ClassifiedError {
  if (error instanceof HttpError) {
    return {
      kind: 'http',
      isSilent: false,
      status: error.status,
      userMessage: `Ошибка сервера (код ${error.status}). Попробуйте повторить запрос.`,
    };
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    typeof (error as { name: unknown }).name === 'string'
  ) {
    const errorName = (error as { name: string }).name;

    if (errorName === 'AbortError') {
      return {
        kind: 'abort',
        isSilent: true,
        userMessage: '',
      };
    }

    if (errorName === 'TimeoutError') {
      return {
        kind: 'timeout',
        isSilent: false,
        userMessage:
          'Превышено время ожидания ответа от сервера. Проверьте соединение и повторите.',
      };
    }
  }

  return {
    kind: 'network',
    isSilent: false,
    userMessage: 'Не удалось выполнить запрос. Проверьте подключение к сети.',
  };
}
