const SUPABASE_FETCH_TIMEOUT_MS = 25_000;

/** React Native / Expo Go — 느린 네트워크·무한 대기 방지 */
export async function supabaseMobileFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SUPABASE_FETCH_TIMEOUT_MS);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}
