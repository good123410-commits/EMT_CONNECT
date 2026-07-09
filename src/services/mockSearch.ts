const MOCK_DELAY_MS = 180;

export function mockSearch<T>(fetcher: () => T): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(fetcher()), MOCK_DELAY_MS);
  });
}

export function mockSearchWithQuery<T>(fetcher: (query: string) => T, query: string): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(fetcher(query)), MOCK_DELAY_MS);
  });
}
