import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function scheduleHelloWorldNotification() {
  if (Platform.OS === 'web') {
    throw new Error('Local notification experiments are available on iOS and Android only.');
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('local-experiment', {
      name: 'Local notification experiment',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  let permissions = await Notifications.getPermissionsAsync();
  if (permissions.status !== 'granted') {
    permissions = await Notifications.requestPermissionsAsync();
  }
  if (permissions.status !== 'granted') {
    throw new Error('Notification permission was not granted.');
  }

  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'Hello world',
      body: 'This is a local notification test.',
    },
    trigger: null,
  });
}
