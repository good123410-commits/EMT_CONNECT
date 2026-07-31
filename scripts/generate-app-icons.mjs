/**
 * Generate Android mipmap + iOS AppIcon.appiconset from Expo asset sources.
 *
 * Sources (app.config.ts):
 * - assets/icon.png — iOS + Android legacy launcher
 * - assets/android-icon-foreground.png — adaptive foreground
 * - assets/android-icon-background.png — adaptive background
 * - assets/android-icon-monochrome.png — adaptive monochrome (Android 13+)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const SOURCES = {
  icon: path.join(ROOT, 'assets/icon.png'),
  foreground: path.join(ROOT, 'assets/android-icon-foreground.png'),
  background: path.join(ROOT, 'assets/android-icon-background.png'),
  monochrome: path.join(ROOT, 'assets/android-icon-monochrome.png'),
};

const ANDROID_RES = path.join(ROOT, 'android/app/src/main/res');
const IOS_ASSETS = path.join(ROOT, 'ios/EMS_Connect/Images.xcassets');
const IOS_APPICON = path.join(IOS_ASSETS, 'AppIcon.appiconset');

const LAUNCHER_DENSITIES = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

const ADAPTIVE_DENSITIES = {
  'mipmap-mdpi': 108,
  'mipmap-hdpi': 162,
  'mipmap-xhdpi': 216,
  'mipmap-xxhdpi': 324,
  'mipmap-xxxhdpi': 432,
};

/** iOS App Icon catalog entries (required sizes). */
const IOS_ICONS = [
  { idiom: 'iphone', size: '20x20', scale: '2x', pixels: 40 },
  { idiom: 'iphone', size: '20x20', scale: '3x', pixels: 60 },
  { idiom: 'iphone', size: '29x29', scale: '2x', pixels: 58 },
  { idiom: 'iphone', size: '29x29', scale: '3x', pixels: 87 },
  { idiom: 'iphone', size: '40x40', scale: '2x', pixels: 80 },
  { idiom: 'iphone', size: '40x40', scale: '3x', pixels: 120 },
  { idiom: 'iphone', size: '60x60', scale: '2x', pixels: 120 },
  { idiom: 'iphone', size: '60x60', scale: '3x', pixels: 180 },
  { idiom: 'ipad', size: '20x20', scale: '1x', pixels: 20 },
  { idiom: 'ipad', size: '20x20', scale: '2x', pixels: 40 },
  { idiom: 'ipad', size: '29x29', scale: '1x', pixels: 29 },
  { idiom: 'ipad', size: '29x29', scale: '2x', pixels: 58 },
  { idiom: 'ipad', size: '40x40', scale: '1x', pixels: 40 },
  { idiom: 'ipad', size: '40x40', scale: '2x', pixels: 80 },
  { idiom: 'ipad', size: '76x76', scale: '1x', pixels: 76 },
  { idiom: 'ipad', size: '76x76', scale: '2x', pixels: 152 },
  { idiom: 'ipad', size: '83.5x83.5', scale: '2x', pixels: 167 },
  { idiom: 'ios-marketing', size: '1024x1024', scale: '1x', pixels: 1024 },
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function assertSources() {
  for (const [key, file] of Object.entries(SOURCES)) {
    if (!fs.existsSync(file)) {
      throw new Error(`Missing source asset: ${key} (${file})`);
    }
  }
}

async function writeSquarePng(input, output, size, fit = 'cover') {
  await sharp(input)
    .resize(size, size, { fit, position: 'centre' })
    .png({ compressionLevel: 9 })
    .toFile(output);
}

async function writeSquareWebp(input, output, size, fit = 'cover') {
  await sharp(input)
    .resize(size, size, { fit, position: 'centre' })
    .webp({ quality: 90 })
    .toFile(output);
}

async function generateAndroidIcons() {
  if (!fs.existsSync(ANDROID_RES)) {
    console.warn('[icons] android/res not found — skip Android (run expo prebuild first)');
    return;
  }

  for (const [folder, size] of Object.entries(LAUNCHER_DENSITIES)) {
    const dir = path.join(ANDROID_RES, folder);
    ensureDir(dir);
    await writeSquareWebp(SOURCES.icon, path.join(dir, 'ic_launcher.webp'), size);
    await writeSquareWebp(SOURCES.icon, path.join(dir, 'ic_launcher_round.webp'), size);
  }

  for (const [folder, size] of Object.entries(ADAPTIVE_DENSITIES)) {
    const dir = path.join(ANDROID_RES, folder);
    ensureDir(dir);
    await writeSquareWebp(SOURCES.foreground, path.join(dir, 'ic_launcher_foreground.webp'), size);
    await writeSquareWebp(SOURCES.background, path.join(dir, 'ic_launcher_background.webp'), size);
    await writeSquareWebp(SOURCES.monochrome, path.join(dir, 'ic_launcher_monochrome.webp'), size);
  }

  console.log('[icons] Android mipmap icons written to android/app/src/main/res');
}

function iosFilename(entry) {
  if (entry.idiom === 'ios-marketing') {
    return 'Icon-App-1024x1024@1x.png';
  }
  return `Icon-App-${entry.size}@${entry.scale}.png`;
}

async function generateIosIcons() {
  ensureDir(IOS_ASSETS);
  ensureDir(IOS_APPICON);

  fs.writeFileSync(
    path.join(IOS_ASSETS, 'Contents.json'),
    JSON.stringify({ info: { author: 'xcode', version: 1 } }, null, 2),
  );

  const images = [];

  for (const entry of IOS_ICONS) {
    const filename = iosFilename(entry);
    const output = path.join(IOS_APPICON, filename);
    await writeSquarePng(SOURCES.icon, output, entry.pixels);
    images.push({
      filename,
      idiom: entry.idiom,
      scale: entry.scale,
      size: entry.size,
    });
  }

  const contents = {
    images,
    info: { author: 'xcode', version: 1 },
  };

  fs.writeFileSync(path.join(IOS_APPICON, 'Contents.json'), JSON.stringify(contents, null, 2));
  console.log('[icons] iOS AppIcon.appiconset written to ios/EMS_Connect/Images.xcassets/AppIcon.appiconset');
}

async function main() {
  assertSources();
  await generateAndroidIcons();
  await generateIosIcons();
  console.log('[icons] Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
