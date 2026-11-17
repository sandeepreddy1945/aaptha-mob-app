const fs = require('node:fs');
const path = require('node:path');

module.exports = ({ config }) => {
  const nextConfig = {
    ...config,
    android: { ...config.android },
    ios: { ...config.ios },
  };
  const extra = nextConfig.extra ?? {};
  const androidGoogleServicesFile = path.join(__dirname, 'google-services.json');
  let webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || extra.googleOAuth?.webClientId;
  let androidClientId =
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || extra.googleOAuth?.androidClientId;
  const iosClientId =
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || extra.googleOAuth?.iosClientId;

  if (fs.existsSync(androidGoogleServicesFile)) {
    const services = JSON.parse(fs.readFileSync(androidGoogleServicesFile, 'utf8'));
    const clients = services.client ?? [];
    const matchingAndroidClient = clients.find(
      (client) =>
        client.client_info?.android_client_info?.package_name === nextConfig.android.package
    );
    const oauthClients = matchingAndroidClient?.oauth_client ?? [];
    webClientId ||=
      oauthClients.find((client) => client.client_type === 3)?.client_id ??
      clients
        .flatMap((client) => client.oauth_client ?? [])
        .find((client) => client.client_type === 3)?.client_id;
    androidClientId ||= oauthClients.find((client) => client.client_type === 1)?.client_id;

    if (androidClientId && androidClientId === webClientId) {
      console.warn(
        'Ignoring Google Android client ID: Android OAuth requires a separate client ID from the Web client.'
      );
      androidClientId = undefined;
    }

    if (matchingAndroidClient) {
      nextConfig.android.googleServicesFile = './google-services.json';
      nextConfig.plugins = [...(nextConfig.plugins ?? [])];
      for (const plugin of ['@react-native-firebase/app', '@react-native-firebase/messaging']) {
        if (!nextConfig.plugins.includes(plugin)) nextConfig.plugins.push(plugin);
      }
    } else {
      console.warn(
        `Skipping Firebase Android config: google-services.json has no client for ${nextConfig.android.package}.`
      );
    }
  }

  const iosGoogleServicesFile = path.join(__dirname, 'GoogleService-Info.plist');
  if (fs.existsSync(iosGoogleServicesFile)) {
    nextConfig.ios.googleServicesFile = './GoogleService-Info.plist';
  }

  nextConfig.extra = {
    ...extra,
    googleOAuth: {
      ...(webClientId ? { webClientId } : {}),
      ...(androidClientId ? { androidClientId } : {}),
      ...(iosClientId ? { iosClientId } : {}),
    },
  };

  return nextConfig;
};
