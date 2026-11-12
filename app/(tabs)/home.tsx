import { AppButton, AppCard, AppPage, RowIcon, SectionHeading } from '@/components/app/ui';
import { Text } from '@/components/ui/text';
import {
  getActiveShiftStart,
  LOCATION_INTERVAL_MS,
  setActiveShiftStart,
  startBackgroundLocation,
  stopBackgroundLocation,
  type LocationTrackingMode,
} from '@/lib/background-location';
import { Link, useRouter, type Href } from 'expo-router';
import { Alert, Linking, Pressable, View } from 'react-native';
import { useEffect, useState } from 'react';
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  HeartHandshake,
  MapPin,
  MessageCircle,
  ShieldAlert,
  UserRound,
} from 'lucide-react-native';

const LOCATION_INTERVAL_LABEL =
  LOCATION_INTERVAL_MS % 60_000 === 0
    ? `${LOCATION_INTERVAL_MS / 60_000} minutes`
    : `${LOCATION_INTERVAL_MS / 1000} seconds`;
const TODAY_LABEL = new Intl.DateTimeFormat('en-IN', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
})
  .format(new Date())
  .toUpperCase();

function formatElapsed(startedAt: string | null, now: number) {
  if (!startedAt) return '0h 00m';
  const minutes = Math.max(0, Math.floor((now - Date.parse(startedAt)) / 60_000));
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`;
}

export default function HomeScreen() {
  const router = useRouter();
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [trackingMode, setTrackingMode] = useState<LocationTrackingMode | null>(null);
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);
  const [isShiftLoading, setIsShiftLoading] = useState(true);

  useEffect(() => {
    getActiveShiftStart()
      .then(async (activeShift) => {
        setStartedAt(activeShift);
        if (activeShift) setTrackingMode(await startBackgroundLocation());
      })
      .catch(console.warn)
      .finally(() => setIsShiftLoading(false));
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const clockIn = () => {
    Alert.alert(
      'Start your shift?',
      `Location is shared every ${LOCATION_INTERVAL_LABEL} while you are clocked in. It is saved on this device when offline and stops when you clock out.`,
      [
        { text: 'Not now', style: 'cancel' },
        {
          text: 'Clock in',
          onPress: () => void beginShift(),
        },
      ]
    );
  };

  const beginShift = async () => {
    setBusy(true);
    const shiftStart = new Date().toISOString();
    try {
      await setActiveShiftStart(shiftStart);
      setStartedAt(shiftStart);
      const mode = await startBackgroundLocation();
      setTrackingMode(mode);
      if (mode === 'foreground') {
        Alert.alert(
          'Shift started · foreground tracking only',
          'Location is shared only while the app is open. Enable background location in a development build to keep sharing while the app is closed.'
        );
      } else if (mode === 'unavailable') {
        Alert.alert(
          'Location sharing unavailable',
          'Your shift is active, but location could not be enabled. Check location permissions before continuing.'
        );
      }
    } catch (error) {
      await setActiveShiftStart(null).catch(console.warn);
      setStartedAt(null);
      Alert.alert(
        'Could not start shift',
        error instanceof Error ? error.message : 'Please try again or contact your coordinator.'
      );
    } finally {
      setBusy(false);
    }
  };

  const clockOut = () => {
    Alert.alert('End your shift?', 'Location sharing will stop when you clock out.', [
      { text: 'Keep working', style: 'cancel' },
      {
        text: 'Clock out',
        style: 'destructive',
        onPress: () => void endShift(),
      },
    ]);
  };

  const endShift = async () => {
    setBusy(true);
    try {
      await stopBackgroundLocation();
      await setActiveShiftStart(null);
      setStartedAt(null);
      setTrackingMode(null);
    } catch (error) {
      Alert.alert(
        'Could not end shift',
        error instanceof Error ? error.message : 'Please try again.'
      );
    } finally {
      setBusy(false);
    }
  };

  const callEmergencyServices = () => {
    Alert.alert(
      'Emergency help',
      'This app is not connected to an emergency dispatch service. Call your local emergency number if you need immediate help.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call 112',
          onPress: () => void Linking.openURL('tel:112').catch(() => undefined),
        },
      ]
    );
  };

  return (
    <AppPage>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-emerald-700">
            <HeartHandshake color="#ffffff" size={26} strokeWidth={2.3} />
          </View>
          <View>
            <Text className="text-foreground text-lg font-extrabold">Aaptha Care</Text>
            <Text className="text-muted-foreground text-xs">Care that stays connected</Text>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open profile"
          className="h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900"
          onPress={() => router.push('/(tabs)/profile' as Href)}>
          <Text className="text-base font-bold text-emerald-900 dark:text-emerald-100">AS</Text>
        </Pressable>
      </View>

      <View className="mt-7">
        <Text className="text-muted-foreground text-sm font-semibold">{TODAY_LABEL}</Text>
        <Text className="text-foreground mt-1 text-3xl font-extrabold">Good morning, Asha</Text>
        <Text className="text-muted-foreground mt-1 text-base">Your care day, at a glance.</Text>
      </View>

      <AppCard className="mt-6 border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text className="text-sm font-bold text-emerald-900 dark:text-emerald-100">
              TODAY&apos;S VISIT · SAMPLE SCHEDULE
            </Text>
            <Text className="text-foreground mt-2 text-xl font-extrabold">Mrs. Lakshmi R.</Text>
            <View className="mt-3 flex-row items-center gap-2">
              <Clock3 color="#047857" size={17} />
              <Text className="text-foreground text-sm font-semibold">8:00 AM – 4:00 PM</Text>
            </View>
            <View className="mt-2 flex-row items-center gap-2">
              <MapPin color="#047857" size={17} />
              <Text className="text-muted-foreground flex-1 text-sm">
                Visit address shared after assignment sync
              </Text>
            </View>
          </View>
          <View className="rounded-2xl bg-white/80 p-3 dark:bg-black/20">
            <CalendarDays color="#047857" size={24} />
          </View>
        </View>

        <View className="mt-5 rounded-2xl border border-emerald-200 bg-white/75 p-4 dark:border-emerald-900 dark:bg-black/20">
          <View className="flex-row items-center gap-2">
            {startedAt ? (
              <CheckCircle2 color="#047857" size={20} />
            ) : (
              <Clock3 color="#667085" size={20} />
            )}
            <Text className="text-foreground flex-1 text-base font-bold">
              {startedAt ? 'Shift in progress' : 'You are not clocked in'}
            </Text>
            {startedAt ? (
              <View
                className={`rounded-full px-3 py-1 ${trackingMode === 'unavailable' ? 'bg-rose-100 dark:bg-rose-900' : trackingMode === 'foreground' ? 'bg-amber-100 dark:bg-amber-900' : 'bg-emerald-100 dark:bg-emerald-900'}`}>
                <Text
                  className={`text-xs font-bold ${trackingMode === 'unavailable' ? 'text-rose-900 dark:text-rose-100' : trackingMode === 'foreground' ? 'text-amber-900 dark:text-amber-100' : 'text-emerald-900 dark:text-emerald-100'}`}>
                  {trackingMode === 'background'
                    ? 'TRACKING ON'
                    : trackingMode === 'foreground'
                      ? 'APP OPEN ONLY'
                      : trackingMode === 'unavailable'
                        ? 'LOCATION OFF'
                        : 'STARTING'}
                </Text>
              </View>
            ) : null}
          </View>
          {startedAt ? (
            <Text className="text-muted-foreground mt-2 text-sm">
              {trackingMode === 'background'
                ? `Location is shared every ${LOCATION_INTERVAL_LABEL} and queued securely when offline.`
                : trackingMode === 'foreground'
                  ? 'Location is shared only while the app is open.'
                  : trackingMode === 'unavailable'
                    ? 'Location is not currently being shared. Check location permissions.'
                    : 'Checking location access…'}
            </Text>
          ) : (
            <Text className="text-muted-foreground mt-2 text-sm">
              Location sharing starts only after you clock in and stops at clock-out.
            </Text>
          )}
          <View className="mt-4">
            <AppButton
              disabled={busy || isShiftLoading}
              icon={startedAt ? Clock3 : CheckCircle2}
              label={
                isShiftLoading
                  ? 'Checking shift…'
                  : busy
                    ? 'Please wait…'
                    : startedAt
                      ? 'Clock out'
                      : 'Clock in'
              }
              onPress={startedAt ? clockOut : clockIn}
              variant={startedAt ? 'outline' : 'primary'}
            />
          </View>
        </View>
      </AppCard>

      <SectionHeading title="Your day" detail="A quick look at what is coming up." />
      <View className="flex-row gap-3">
        <AppCard className="min-h-28 flex-1 justify-between p-4">
          <RowIcon icon={Clock3} tone="blue" />
          <View>
            <Text className="text-foreground text-xl font-extrabold">
              {startedAt ? formatElapsed(startedAt, now) : '—'}
            </Text>
            <Text className="text-muted-foreground mt-1 text-xs">Time on shift</Text>
          </View>
        </AppCard>
        <AppCard className="min-h-28 flex-1 justify-between p-4">
          <RowIcon icon={CalendarDays} tone="violet" />
          <View>
            <Text className="text-foreground text-xl font-extrabold">2</Text>
            <Text className="text-muted-foreground mt-1 text-xs">Upcoming visits</Text>
          </View>
        </AppCard>
        <AppCard className="min-h-28 flex-1 justify-between p-4">
          <RowIcon icon={CheckCircle2} tone="amber" />
          <View>
            <Text className="text-foreground text-xl font-extrabold">1</Text>
            <Text className="text-muted-foreground mt-1 text-xs">Visit note due</Text>
          </View>
        </AppCard>
      </View>

      <SectionHeading title="Quick access" />
      <View className="gap-3">
        <Link href={'/(tabs)/profile' as Href} asChild>
          <Pressable className="border-border bg-card flex-row items-center gap-3 rounded-2xl border p-4">
            <RowIcon icon={UserRound} />
            <View className="flex-1">
              <Text className="text-foreground font-bold">My profile</Text>
              <Text className="text-muted-foreground mt-1 text-sm">
                Personal details and emergency contacts
              </Text>
            </View>
            <ChevronRight color="#667085" size={20} />
          </Pressable>
        </Link>
        <Link href={'/(tabs)/notifications' as Href} asChild>
          <Pressable className="border-border bg-card flex-row items-center gap-3 rounded-2xl border p-4">
            <RowIcon icon={Bell} tone="amber" />
            <View className="flex-1">
              <Text className="text-foreground font-bold">Updates</Text>
              <Text className="text-muted-foreground mt-1 text-sm">
                Shifts, reminders, and care updates
              </Text>
            </View>
            <ChevronRight color="#667085" size={20} />
          </Pressable>
        </Link>
        <Pressable
          accessibilityRole="button"
          className="border-border bg-card flex-row items-center gap-3 rounded-2xl border p-4"
          onPress={() => router.push('/chat' as Href)}>
          <RowIcon icon={MessageCircle} tone="violet" />
          <View className="flex-1">
            <Text className="text-foreground font-bold">Ask Aaptha AI</Text>
            <Text className="text-muted-foreground mt-1 text-sm">Get help with work questions</Text>
          </View>
          <ChevronRight color="#667085" size={20} />
        </Pressable>
      </View>

      <View className="mt-6">
        <AppButton
          icon={ShieldAlert}
          label="Emergency help"
          onPress={callEmergencyServices}
          variant="danger"
        />
        <Text className="text-muted-foreground mt-2 text-center text-xs">
          No emergency alerts are sent by this demo app.
        </Text>
      </View>
    </AppPage>
  );
}
