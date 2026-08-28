/**
 * AnimatedPressable → Pressable 롤백 (터치 스케일 애니메이션 제거)
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOTS = ['src/components', 'src/screens'];
const SKIP_FILES = new Set([
  'AnimatedPressable.tsx',
  'TabBarScaleButton.tsx',
]);

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (/\.tsx?$/.test(entry.name)) files.push(full);
  }
  return files;
}

function addPressableToRnImport(source) {
  if (!source.includes('<Pressable')) return source;
  if (/import\s*\{[^}]*\bPressable\b[^}]*\}\s*from\s*'react-native'/.test(source)) {
    return source;
  }
  const match = source.match(/import\s*\{([^}]+)\}\s*from\s*'react-native';/);
  if (!match) {
    const firstImport = source.match(/^import .+;\n/m);
    if (firstImport) {
      const idx = source.indexOf(firstImport[0]) + firstImport[0].length;
      return `${source.slice(0, idx)}import { Pressable } from 'react-native';\n${source.slice(idx)}`;
    }
    return `import { Pressable } from 'react-native';\n${source}`;
  }
  return source.replace(
    /import\s*\{([^}]+)\}\s*from\s*'react-native';/,
    (full, inner) => {
      const parts = inner
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);
      if (!parts.includes('Pressable')) {
        parts.unshift('Pressable');
      }
      return `import { ${parts.join(', ')} } from 'react-native';`;
    },
  );
}

function processFile(filePath) {
  const base = path.basename(filePath);
  if (SKIP_FILES.has(base)) return false;

  let source = fs.readFileSync(filePath, 'utf8');
  if (!source.includes('AnimatedPressable') && !source.includes('PRESS_SCALE_')) {
    return false;
  }

  source = source.replace(
    /^import\s*\{[^}]*\}\s*from\s*'@\/components\/ui\/AnimatedPressable';\n/gm,
    '',
  );
  source = source.replace(/\n\s*pressedScale=\{[^}]+\}/g, '');
  source = source.replace(/\n\s*scaleEnabled=\{[^}]+\}/g, '');
  source = source.replace(/<AnimatedPressable(\s|>|\/)/g, '<Pressable$1');
  source = source.replace(/<\/AnimatedPressable>/g, '</Pressable>');
  source = addPressableToRnImport(source);

  fs.writeFileSync(filePath, source);
  return true;
}

let count = 0;
for (const root of ROOTS) {
  const abs = path.join(process.cwd(), root);
  for (const file of walk(abs)) {
    if (processFile(file)) {
      count += 1;
      console.log('reverted', path.relative(process.cwd(), file));
    }
  }
}

console.log(`Done. ${count} files reverted.`);
