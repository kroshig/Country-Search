export interface DebouncedFunction<TArgs extends unknown[]> {
  (...args: TArgs): void;
  cancel: () => void;
}

export function debounce<TArgs extends unknown[]>(
  _fn: (...args: TArgs) => void,
  _delay: number,
): DebouncedFunction<TArgs> {
  const stub = (..._args: TArgs): void => {};
  stub.cancel = (): void => {};
  return stub;
}
