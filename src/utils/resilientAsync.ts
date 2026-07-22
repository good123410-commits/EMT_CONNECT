export type ResilientResult<T> = {
  data: T;
  source: 'primary' | 'fallback';
  error?: string;
};

/**
 * 공공 API 등 외부 호출 실패 시 폴백 데이터를 반환합니다. 앱 크래시를 방지합니다.
 */
export async function withResilientFallback<T>(
  primary: () => Promise<T>,
  fallback: () => T | Promise<T>,
  options?: { label?: string },
): Promise<ResilientResult<T>> {
  try {
    const data = await primary();
    return { data, source: 'primary' };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (__DEV__) {
      console.warn(
        `[Resilient] ${options?.label ?? 'request'} failed, using fallback`,
        message,
      );
    }
    const data = await fallback();
    return { data, source: 'fallback', error: message };
  }
}

export async function safeAsync<T>(
  task: () => Promise<T>,
  fallbackValue: T,
  label?: string,
): Promise<T> {
  try {
    return await task();
  } catch (error) {
    if (__DEV__) {
      console.warn(`[SafeAsync] ${label ?? 'task'} failed`, error);
    }
    return fallbackValue;
  }
}
