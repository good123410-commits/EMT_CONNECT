const fs = require('fs');
const path = require('path');
const {
  withAndroidManifest,
  withDangerousMod,
  AndroidConfig,
} = require('@expo/config-plugins');

const HELPER_IMPORT = 'import expo.modules.emergencyoverlay.LockScreenLaunchHelper';
const ON_CREATE_SNIPPET = 'LockScreenLaunchHelper.applyFromIntent(this, intent)';
const ON_NEW_INTENT_SNIPPET = `override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
    LockScreenLaunchHelper.applyFromIntent(this, intent)
  }`;

function findMainActivityFile(androidProjectRoot) {
  const javaRoot = path.join(androidProjectRoot, 'app', 'src', 'main', 'java');
  if (!fs.existsSync(javaRoot)) return null;

  const stack = [javaRoot];
  while (stack.length > 0) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }
      if (entry.name === 'MainActivity.kt' || entry.name === 'MainActivity.java') {
        return fullPath;
      }
    }
  }

  return null;
}

function ensureImport(contents) {
  if (contents.includes(HELPER_IMPORT)) return contents;

  const packageMatch = contents.match(/^package\s+[^\n]+/m);
  if (!packageMatch) return contents;

  const insertAt = packageMatch.index + packageMatch[0].length;
  const intentImport = contents.includes('import android.content.Intent')
    ? ''
    : '\nimport android.content.Intent';

  return (
    contents.slice(0, insertAt) +
    `${intentImport}\n${HELPER_IMPORT}` +
    contents.slice(insertAt)
  );
}

function injectOnCreate(contents) {
  if (contents.includes(ON_CREATE_SNIPPET)) return contents;

  const patterns = [/super\.onCreate\(null\)/, /super\.onCreate\(savedInstanceState\)/];

  for (const pattern of patterns) {
    const match = contents.match(pattern);
    if (match && typeof match.index === 'number') {
      const insertAt = match.index + match[0].length;
      return (
        contents.slice(0, insertAt) +
        `\n    ${ON_CREATE_SNIPPET}` +
        contents.slice(insertAt)
      );
    }
  }

  return contents;
}

function injectOnNewIntent(contents) {
  if (contents.includes('fun onNewIntent(intent: Intent)')) return contents;

  const classClose = contents.lastIndexOf('}');
  if (classClose === -1) return contents;

  return (
    contents.slice(0, classClose) +
    `\n\n  ${ON_NEW_INTENT_SNIPPET}\n` +
    contents.slice(classClose)
  );
}

function withLockScreenEmergencyManifest(config) {
  return withAndroidManifest(config, (modConfig) => {
    const mainActivity = AndroidConfig.Manifest.getMainActivityOrThrow(modConfig.modResults);
    mainActivity.$['android:showWhenLocked'] = 'true';
    mainActivity.$['android:turnScreenOn'] = 'true';
    return modConfig;
  });
}

function withLockScreenEmergencyMainActivity(config) {
  return withDangerousMod(config, [
    'android',
    async (modConfig) => {
      const projectRoot = modConfig.modRequest.projectRoot;
      const androidRoot = path.join(projectRoot, 'android');
      const mainActivityPath = findMainActivityFile(androidRoot);

      if (!mainActivityPath) {
        return modConfig;
      }

      let contents = await fs.promises.readFile(mainActivityPath, 'utf8');
      contents = ensureImport(contents);
      contents = injectOnCreate(contents);
      contents = injectOnNewIntent(contents);
      await fs.promises.writeFile(mainActivityPath, contents);

      return modConfig;
    },
  ]);
}

function withLockScreenEmergencyActivity(config) {
  config = withLockScreenEmergencyManifest(config);
  config = withLockScreenEmergencyMainActivity(config);
  return config;
}

module.exports = withLockScreenEmergencyActivity;
