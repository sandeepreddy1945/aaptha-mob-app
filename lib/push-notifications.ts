import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import Constants, { AppOwnership } from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { Platform } from 'react-native';
import { db } from './firebase';

const isExpoGo = Constants.appOwnership === AppOwnership.Expo;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const TOKEN_STORAGE_PREFIX = 'fcm-token:';

async function saveFcmToken(uid: string, token: string) {
  const tokenId = encodeURIComponent(token);
  await setDoc(
    doc(db, 'users', uid, 'fcmTokens', tokenId),
    {
      token,
      platform: Platform.OS,
      provider: 'fcm',
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
  await AsyncStorage.setItem(`${TOKEN_STORAGE_PREFIX}${uid}`, token);
}

export async function registerFcmToken(uid: string) {
  if (!Device.isDevice || isExpoGo) return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default notifications',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  let permission = await Notifications.getPermissionsAsync();
  if (permission.status !== 'granted') {
    permission = await Notifications.requestPermissionsAsync();
  }
  if (permission.status !== 'granted') return null;

  const messagingModule = await import('@react-native-firebase/messaging');
  const token = await messagingModule.getToken(messagingModule.getMessaging());
  await saveFcmToken(uid, token);
  return token;
}

export async function subscribeToFcmTokenRefresh(uid: string) {
  if (isExpoGo) return () => undefined;
  try {
    const messagingModule = await import('@react-native-firebase/messaging');
    return messagingModule.onTokenRefresh(messagingModule.getMessaging(), (token) => {
      void saveFcmToken(uid, token).catch((error) => {
        console.warn('Unable to refresh the registered FCM token:', error);
      });
    });
  } catch (error) {
    console.warn('Unable to listen for FCM token changes. Use a native development build:', error);
    return () => undefined;
  }
}

export async function subscribeToForegroundMessages() {
  if (isExpoGo) return () => undefined;
  try {
    const messagingModule = await import('@react-native-firebase/messaging');
    return messagingModule.onMessage(messagingModule.getMessaging(), async (message) => {
      const title = message.notification?.title;
      const body = message.notification?.body;
      if (!title && !body) return;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: title ?? 'New update',
          body: body ?? '',
          data: message.data,
        },
        trigger: null,
      });
    });
  } catch (error) {
    console.warn(
      'Unable to subscribe to foreground FCM messages. Use a native development build:',
      error
    );
    return () => undefined;
  }
}

export async function unregisterFcmToken(uid: string) {
  const token = await AsyncStorage.getItem(`${TOKEN_STORAGE_PREFIX}${uid}`);
  if (!token) return;

  await deleteDoc(doc(db, 'users', uid, 'fcmTokens', encodeURIComponent(token)));
  await AsyncStorage.removeItem(`${TOKEN_STORAGE_PREFIX}${uid}`);
}
