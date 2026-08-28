import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const target = join(
  process.cwd(),
  'node_modules',
  '@expo',
  'cli',
  'build',
  'src',
  'api',
  'rest',
  'cache',
  'wrapFetchWithCache.js',
);

const MARKER = 'const responseForCache = response.clone();';

const OLD = `            if (!response.ok || !response.body) {
                return response;
            }
            // Cache the response
            cachedResponse = await cache.set(cacheKey, {
                body: response.body,
                info: (0, _ResponseCache.getResponseInfo)(response)
            });`;

const NEXT = `            if (!response.ok || !response.body) {
                return response;
            }
            const responseForCache = response.clone();
            // Cache the response
            cachedResponse = await cache.set(cacheKey, {
                body: responseForCache.body,
                info: (0, _ResponseCache.getResponseInfo)(response)
            });`;

try {
  const source = readFileSync(target, 'utf8');

  if (source.includes(MARKER)) {
    console.log('[patch-expo-cli-cache] already patched');
  } else if (!source.includes(OLD)) {
    console.log('[patch-expo-cli-cache] pattern missing; skipped');
  } else {
    writeFileSync(target, source.replace(OLD, NEXT), 'utf8');
    console.log('[patch-expo-cli-cache] patched wrapFetchWithCache.js');
  }
} catch (error) {
  console.warn(
    '[patch-expo-cli-cache] skipped:',
    error instanceof Error ? error.message : error,
  );
}
