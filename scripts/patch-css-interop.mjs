import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const renderTarget = join(
  process.cwd(),
  'node_modules',
  'react-native-css-interop',
  'dist',
  'runtime',
  'native',
  'render-component.js',
);

const metroTargets = [
  join(process.cwd(), 'node_modules', 'react-native-css-interop', 'dist', 'metro', 'index.js'),
  join(process.cwd(), 'node_modules', 'react-native-css-interop', 'src', 'metro', 'index.ts'),
];

const RENDER_OLD = `function stringify(object) {
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

const RENDER_NEXT = `function stringify(object) {
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

const METRO_GRAPH_OLD = [
  `virtualModulesPossible = bundler
                            .getDependencyGraph()
                            .then(async (graph) => {
                            haste = graph._haste;
                            fileSystem = graph._fileSystem;
                            ensureFileSystemPatched(fileSystem);
                            ensureBundlerPatched(bundler);
                        });`,
  `virtualModulesPossible = bundler
                  .getDependencyGraph()
                  .then(async (graph: any) => {
                    haste = graph._haste;
                    fileSystem = graph._fileSystem;
                    ensureFileSystemPatched(fileSystem!);
                    ensureBundlerPatched(bundler);
                  });`,
];

const METRO_GRAPH_NEXT = [
  `virtualModulesPossible = bundler
                            .getDependencyGraph()
                            .then(async (graph) => {
                            if (typeof graph.ready === "function") {
                                await graph.ready();
                            }
                            haste = graph._haste;
                            fileSystem = graph._fileSystem;
                            if (fileSystem?.getSha1) {
                                ensureFileSystemPatched(fileSystem);
                                ensureBundlerPatched(bundler);
                            }
                        });`,
  `virtualModulesPossible = bundler
                  .getDependencyGraph()
                  .then(async (graph: any) => {
                    if (typeof graph.ready === "function") {
                      await graph.ready();
                    }
                    haste = graph._haste;
                    fileSystem = graph._fileSystem;
                    if (fileSystem?.getSha1) {
                      ensureFileSystemPatched(fileSystem!);
                      ensureBundlerPatched(bundler);
                    }
                  });`,
];

const METRO_FS_OLD = [
  `function ensureFileSystemPatched(fs) {
    if (!fs.getSha1.__css_interop_patched) {`,
  `) {
  if (!fs.getSha1.__css_interop_patched) {`,
];

const METRO_FS_NEXT = [
  `function ensureFileSystemPatched(fs) {
    if (!fs?.getSha1) {
        return fs;
    }
    if (!fs.getSha1.__css_interop_patched) {`,
  `) {
  if (!fs?.getSha1) {
    return fs;
  }
  if (!fs.getSha1.__css_interop_patched) {`,
];

function patchFile(target, apply, label) {
  let source = readFileSync(target, 'utf8');
  const next = apply(source);
  if (next === source) {
    console.log(`[patch-css-interop] ${label}: already patched or pattern missing`);
    return;
  }
  writeFileSync(target, next, 'utf8');
  console.log(`[patch-css-interop] ${label}: patched`);
}

function patchMetroSource(source) {
  if (source.includes('if (typeof graph.ready === "function")')) {
    return source;
  }

  for (const oldText of METRO_GRAPH_OLD) {
    const index = METRO_GRAPH_OLD.indexOf(oldText);
    if (source.includes(oldText)) {
      return source.replace(oldText, METRO_GRAPH_NEXT[index]);
    }
  }

  return source;
}

function patchMetroFs(source) {
  if (source.includes('if (!fs?.getSha1)')) {
    return source;
  }

  for (const oldText of METRO_FS_OLD) {
    const index = METRO_FS_OLD.indexOf(oldText);
    if (source.includes(oldText)) {
      return source.replace(oldText, METRO_FS_NEXT[index]);
    }
  }

  return source;
}

try {
  patchFile(
    renderTarget,
    (source) => {
      if (source.includes('entries = Object.entries(value)')) return source;
      if (!source.includes(RENDER_OLD)) return source;
      return source.replace(RENDER_OLD, RENDER_NEXT);
    },
    'render-component',
  );

  for (const target of metroTargets) {
    patchFile(
      target,
      (source) => patchMetroFs(patchMetroSource(source)),
      target.includes('src') ? 'metro-src' : 'metro-dist',
    );
  }
} catch (error) {
  console.warn('[patch-css-interop] skipped:', error instanceof Error ? error.message : error);
}
