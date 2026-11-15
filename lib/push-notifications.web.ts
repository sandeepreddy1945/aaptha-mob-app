export async function registerFcmToken(_uid: string) {
  return null;
}

export function subscribeToFcmTokenRefresh(_uid: string) {
  return () => undefined;
}

export function subscribeToForegroundMessages() {
  return () => undefined;
}

export async function unregisterFcmToken(_uid: string) {}
