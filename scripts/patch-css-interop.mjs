import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const target = join(
  process.cwd(),
  'node_modules',
  'react-native-css-interop',
  'dist',
  'runtime',
  'native',
  'render-component.js',
);

const OLD = `function stringify(object) {
    const seen = new WeakSet();
    return JSON.stringify(object, function replace(_, value) {
        if (!(value !== null && typeof value === "object")) {
            return value;
        }
        if (seen.has(value)) {
            return "[Circular]";
        }
        seen.add(value);
        const newValue = Array.isArray(value) ? [] : {};
        for (const entry of Object.entries(value)) {
            newValue[entry[0]] = replace(entry[0], entry[1]);
        }
        seen.delete(value);
        return newValue;
    }, 2);
}`;

const NEXT = `function stringify(object) {
  const seen = new WeakSet();
  return JSON.stringify(object, function replace(_, value) {
    if (!(value !== null && typeof value === "object")) {
      return value;
    }
    if (seen.has(value)) {
      return "[Circular]";
    }
    seen.add(value);
    const newValue = Array.isArray(value) ? [] : {};
    let entries;
    try {
      entries = Object.entries(value);
    } catch {
      seen.delete(value);
      return "[Unserializable]";
    }
    for (const entry of entries) {
      try {
        newValue[entry[0]] = replace(entry[0], entry[1]);
      } catch {
        newValue[entry[0]] = "[Throws on access]";
      }
    }
    seen.delete(value);
    return newValue;
  }, 2);
}`;

try {
  const source = readFileSync(target, 'utf8');
  if (source.includes('entries = Object.entries(value)')) {
    console.log('[patch-css-interop] already patched');
    process.exit(0);
  }
  if (!source.includes(OLD)) {
    console.warn('[patch-css-interop] target changed; skip auto patch');
    process.exit(0);
  }
  writeFileSync(target, source.replace(OLD, NEXT), 'utf8');
  console.log('[patch-css-interop] applied safe stringify patch');
} catch (error) {
  console.warn('[patch-css-interop] skipped:', error instanceof Error ? error.message : error);
}
