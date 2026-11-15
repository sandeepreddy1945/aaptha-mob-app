import '@/global.css';

import { AuthProvider, useAuth } from '@/contexts/auth-context';
import {
  flushPendingLocations,
  getActiveShiftStart,
  startBackgroundLocation,
  startLocationQueueMonitoring,
  stopBackgroundLocation,
  stopLocationQueueMonitoring,
} from '@/lib/background-location';
import { NAV_THEME } from '@/lib/theme';
import { ThemeProvider } from 'expo-router/react-navigation';
import { PortalHost } from '@rn-primitives/portal';
import { Stack, useRouter, useSegments, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppState } from 'react-native';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useUniwind } from 'uniwind';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

function AppNavigator() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const rootSegment = segments[0];
  const isAuthenticated = Boolean(user);

  useEffect(() => {
    if (loading) return;
    const isLoginRoute = rootSegment === 'login';
    if (!isAuthenticated && !isLoginRoute) router.replace('/login' as Href);
    else if (isAuthenticated && isLoginRoute) router.replace('/(tabs)/home');
  }, [isAuthenticated, loading, rootSegment, router]);

  useEffect(() => {
    if (isAuthenticated) startLocationQueueMonitoring();
    else stopLocationQueueMonitoring();

    const syncShiftTracking = async () => {
      if (!isAuthenticated) {
        await stopBackgroundLocation();
        return;
      }
      const activeShift = await getActiveShiftStart();
      if (activeShift) await startBackgroundLocation();
      else await stopBackgroundLocation();
    };

    syncShiftTracking().catch(console.warn);

    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active' || !isAuthenticated) return;
      void flushPendingLocations();
      syncShiftTracking().catch(console.warn);
    });
    return () => subscription.remove();
  }, [isAuthenticated, user?.uid]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="chat" />
      </Stack>
      <PortalHost />
    </>
  );
}

export default function RootLayout() {
  const { theme } = useUniwind();

  return (
    <SafeAreaProvider>
      <ThemeProvider value={NAV_THEME[theme ?? 'light']}>
        <AuthProvider>
          <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
          <AppNavigator />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
