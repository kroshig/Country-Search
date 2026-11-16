import type { ClassifiedError } from '../types.js';

export class HttpError extends Error {
  public readonly status: number;

  constructor(status: number, message?: string) {
    super(message);
    this.status = status;
  }
}

export function classifySearchError(_error: unknown): ClassifiedError {
  return {
    kind: 'network',
    isSilent: false,
    userMessage: '',
  };
}
