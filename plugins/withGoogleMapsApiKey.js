const { withAndroidManifest, AndroidConfig } = require('@expo/config-plugins');

/**
 * Ensures Google Maps API key meta-data is present for react-native-maps on Android.
 * Set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in .env or EAS Secrets before prebuild.
 */
function withGoogleMapsApiKey(config) {
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

  return withAndroidManifest(config, (modConfig) => {
    const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(modConfig.modResults);
    AndroidConfig.Manifest.addMetaDataItemToMainApplication(
      mainApplication,
      'com.google.android.geo.API_KEY',
      apiKey,
      'value',
    );
    return modConfig;
  });
}

module.exports = withGoogleMapsApiKey;
