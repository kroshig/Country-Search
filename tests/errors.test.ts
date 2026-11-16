import { describe, expect, it } from 'vitest';
import { classifySearchError, HttpError } from '../src/errors/httpError.js';

describe('HttpError and classifySearchError', () => {
  it('stores HTTP status and sets proper Error name', () => {
    const err = new HttpError(502, 'Bad Gateway');

    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(HttpError);
    expect(err.name).toBe('HttpError');
    expect(err.status).toBe(502);
    expect(err.message).toBe('Bad Gateway');
  });

  it('distinguishes AbortError as silent non-user error', () => {
    const abortErr = new DOMException('The operation was aborted.', 'AbortError');
    const result = classifySearchError(abortErr);

    expect(result.kind).toBe('abort');
    expect(result.isSilent).toBe(true);
    expect(result.userMessage).toBe('');
  });

  it('distinguishes TimeoutError from AbortError as a visible user error', () => {
    const timeoutErr = new DOMException('The operation timed out.', 'TimeoutError');
    const result = classifySearchError(timeoutErr);

    expect(result.kind).toBe('timeout');
    expect(result.isSilent).toBe(false);
    expect(result.userMessage).toContain('Превышено время ожидания');
  });

  it('classifies HttpError with status code as visible user error', () => {
    const httpErr = new HttpError(503);
    const result = classifySearchError(httpErr);

    expect(result.kind).toBe('http');
    expect(result.isSilent).toBe(false);
    expect(result.status).toBe(503);
    expect(result.userMessage).toContain('503');
  });

  it('classifies generic TypeError (network failure) as network error', () => {
    const netErr = new TypeError('Failed to fetch');
    const result = classifySearchError(netErr);

    expect(result.kind).toBe('network');
    expect(result.isSilent).toBe(false);
    expect(result.userMessage).toContain('Не удалось выполнить запрос');
  });
});
