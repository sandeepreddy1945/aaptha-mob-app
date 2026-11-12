import '@/global.css';

import {
  flushPendingLocations,
  getActiveShiftStart,
  startBackgroundLocation,
  startLocationQueueMonitoring,
  stopBackgroundLocation,
} from '@/lib/background-location';
import { NAV_THEME } from '@/lib/theme';
import { ThemeProvider } from 'expo-router/react-navigation';
import { PortalHost } from '@rn-primitives/portal';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppState } from 'react-native';
import { useEffect } from 'react';
import { useUniwind } from 'uniwind';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export default function RootLayout() {
  const { theme } = useUniwind();

  useEffect(() => {
    const syncShiftTracking = async () => {
      const activeShift = await getActiveShiftStart();
      if (activeShift) {
        await startBackgroundLocation();
      } else {
        await stopBackgroundLocation();
      }
    };

    startLocationQueueMonitoring();
    syncShiftTracking().catch(console.warn);

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void flushPendingLocations();
        syncShiftTracking().catch(console.warn);
      }
    });
    return () => subscription.remove();
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider value={NAV_THEME[theme ?? 'light']}>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="chat" />
        </Stack>
        <PortalHost />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
