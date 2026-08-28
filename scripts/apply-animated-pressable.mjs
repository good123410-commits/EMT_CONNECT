/**
 * Pressable → AnimatedPressable 일괄 치환 (src/components, src/screens)
 * PlatformPressable·타입 전용 PressableProps 참조는 유지
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

function hasJsxPressable(source) {
  return /<Pressable[\s/>]/.test(source) || source.includes('</Pressable>');
}

function addAnimatedImport(source) {
  if (source.includes("from '@/components/ui/AnimatedPressable'")) {
    return source;
  }
  const importLine = "import { AnimatedPressable } from '@/components/ui/AnimatedPressable';\n";
  const match = source.match(/^import .+;\n/m);
  if (match) {
    const idx = source.indexOf(match[0]) + match[0].length;
    return `${source.slice(0, idx)}${importLine}${source.slice(idx)}`;
  }
  return `${importLine}${source}`;
}

function stripPressableFromRnImport(source) {
  return source.replace(
    /import\s*\{([^}]+)\}\s*from\s*'react-native';/g,
    (full, inner) => {
      const parts = inner
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean)
        .filter((p) => p !== 'Pressable');
      if (parts.length === 0) {
        return '';
      }
      return `import { ${parts.join(', ')} } from 'react-native';`;
    },
  );
}

function processFile(filePath) {
  const base = path.basename(filePath);
  if (SKIP_FILES.has(base)) return false;

  let source = fs.readFileSync(filePath, 'utf8');
  if (!hasJsxPressable(source)) return false;

  source = source.replace(/<Pressable(\s|>|\/)/g, '<AnimatedPressable$1');
  source = source.replace(/<\/Pressable>/g, '</AnimatedPressable>');
  source = stripPressableFromRnImport(source);
  source = addAnimatedImport(source);

  fs.writeFileSync(filePath, source);
  return true;
}

let count = 0;
for (const root of ROOTS) {
  const abs = path.join(process.cwd(), root);
  for (const file of walk(abs)) {
    if (processFile(file)) {
      count += 1;
      console.log('updated', path.relative(process.cwd(), file));
    }
  }
}

console.log(`Done. ${count} files updated.`);
