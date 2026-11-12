import { AppCard, AppPage, Divider, RowIcon, SectionHeading } from '@/components/app/ui';
import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';
import { Pressable, View } from 'react-native';
import { useMemo, useState } from 'react';
import {
  BellRing,
  CalendarClock,
  CheckCheck,
  ChevronRight,
  CircleDollarSign,
  Megaphone,
  ShieldCheck,
} from 'lucide-react-native';

type NotificationCategory = 'schedule' | 'policy' | 'payroll' | 'announcement';
type NotificationItem = {
  id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  time: string;
  unread: boolean;
};

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'shift-reminder',
    category: 'schedule',
    title: 'Your visit starts soon',
    body: 'Your sample visit with Mrs. Lakshmi is scheduled for 8:00 AM today.',
    time: 'Today · 7:30 AM',
    unread: true,
  },
  {
    id: 'schedule-change',
    category: 'schedule',
    title: 'Schedule confirmed',
    body: 'Your next shift is ready to review. Check your schedule before travelling.',
    time: 'Yesterday · 4:15 PM',
    unread: true,
  },
  {
    id: 'policy-update',
    category: 'policy',
    title: 'Care policy update',
    body: 'Please review the latest guidance from your care coordinator.',
    time: 'Nov 10 · 11:00 AM',
    unread: false,
  },
  {
    id: 'payroll',
    category: 'payroll',
    title: 'Timesheet review reminder',
    body: 'Confirm your visit notes and hours before the weekly payroll review.',
    time: 'Nov 9 · 9:20 AM',
    unread: false,
  },
];

const CATEGORY_DETAILS: Record<
  NotificationCategory,
  { label: string; icon: typeof BellRing; tone: 'green' | 'blue' | 'amber' | 'violet' }
> = {
  schedule: { label: 'Schedule', icon: CalendarClock, tone: 'blue' },
  policy: { label: 'Policy', icon: ShieldCheck, tone: 'green' },
  payroll: { label: 'Payroll', icon: CircleDollarSign, tone: 'amber' },
  announcement: { label: 'Company news', icon: Megaphone, tone: 'violet' },
};

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [preferences, setPreferences] = useState<Record<NotificationCategory, boolean>>({
    schedule: true,
    policy: true,
    payroll: true,
    announcement: true,
  });
  const [quietHours, setQuietHours] = useState(true);
  const unreadCount = useMemo(
    () => notifications.filter((notification) => notification.unread).length,
    [notifications]
  );
  const visibleNotifications = notifications.filter(
    (notification) => preferences[notification.category]
  );

  const markAllAsRead = () => {
    setNotifications((current) =>
      current.map((notification) => ({ ...notification, unread: false }))
    );
  };

  const toggleRead = (id: string) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id ? { ...notification, unread: false } : notification
      )
    );
  };

  const togglePreference = (category: NotificationCategory) => {
    setPreferences((current) => ({ ...current, [category]: !current[category] }));
  };

  return (
    <AppPage>
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="text-foreground text-3xl font-extrabold">Updates</Text>
          <Text className="text-muted-foreground mt-1 text-base">
            Important notes for your care day.
          </Text>
        </View>
        <View className="h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900">
          <BellRing color="#b45309" size={23} />
        </View>
      </View>

      <AppCard className="mt-6 border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950">
        <View className="flex-row items-center gap-3">
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-white dark:bg-black/20">
            <CheckCheck color="#047857" size={23} />
          </View>
          <View className="flex-1">
            <Text className="text-foreground text-base font-bold">
              {unreadCount === 0
                ? 'You are all caught up'
                : `${unreadCount} new ${unreadCount === 1 ? 'update' : 'updates'}`}
            </Text>
            <Text className="text-muted-foreground mt-1 text-sm">
              Your updates stay here until you read them.
            </Text>
          </View>
          {unreadCount > 0 ? (
            <Pressable accessibilityRole="button" onPress={markAllAsRead}>
              <Text className="text-sm font-bold text-emerald-800 dark:text-emerald-200">
                Mark all read
              </Text>
            </Pressable>
          ) : null}
        </View>
      </AppCard>

      <SectionHeading title="Recent updates" />
      <View className="gap-3">
        {visibleNotifications.map((notification) => {
          const category = CATEGORY_DETAILS[notification.category];
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${notification.unread ? 'Unread: ' : ''}${notification.title}`}
              key={notification.id}
              onPress={() => toggleRead(notification.id)}>
              <AppCard
                className={notification.unread ? 'border-emerald-200 dark:border-emerald-900' : ''}>
                <View className="flex-row items-start gap-3">
                  <RowIcon icon={category.icon} tone={category.tone} />
                  <View className="flex-1">
                    <View className="flex-row items-start justify-between gap-2">
                      <Text className="text-foreground flex-1 text-base font-bold">
                        {notification.title}
                      </Text>
                      {notification.unread ? (
                        <View className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-600" />
                      ) : null}
                    </View>
                    <Text className="text-muted-foreground mt-1 text-sm leading-5">
                      {notification.body}
                    </Text>
                    <View className="mt-3 flex-row items-center justify-between">
                      <Text className="text-muted-foreground text-xs font-medium">
                        {category.label} · {notification.time}
                      </Text>
                      <ChevronRight color="#98a2b3" size={18} />
                    </View>
                  </View>
                </View>
              </AppCard>
            </Pressable>
          );
        })}
        {visibleNotifications.length === 0 ? (
          <AppCard className="items-center py-8">
            <Text className="text-foreground font-bold">No updates in these categories</Text>
            <Text className="text-muted-foreground mt-2 text-center text-sm">
              Change your preferences to see more.
            </Text>
          </AppCard>
        ) : null}
      </View>

      <SectionHeading
        title="Notification preferences"
        detail="Choose what you would like to see."
      />
      <AppCard className="gap-4">
        {(['schedule', 'policy', 'payroll', 'announcement'] as NotificationCategory[]).map(
          (category, index) => (
            <View key={category}>
              {index > 0 ? <Divider /> : null}
              <View className="flex-row items-center justify-between py-2">
                <View className="flex-1 pr-4">
                  <Text className="text-foreground font-semibold">
                    {CATEGORY_DETAILS[category].label}
                  </Text>
                  <Text className="text-muted-foreground mt-1 text-xs">
                    Receive {CATEGORY_DETAILS[category].label.toLowerCase()} updates
                  </Text>
                </View>
                <Switch
                  accessibilityLabel={`${CATEGORY_DETAILS[category].label} notifications`}
                  checked={preferences[category]}
                  onCheckedChange={() => togglePreference(category)}
                />
              </View>
            </View>
          )
        )}
        <Divider />
        <View className="flex-row items-center justify-between py-2">
          <View className="flex-1 pr-4">
            <Text className="text-foreground font-semibold">Quiet hours</Text>
            <Text className="text-muted-foreground mt-1 text-xs">
              10:00 PM – 6:00 AM · on this device
            </Text>
          </View>
          <Switch
            accessibilityLabel="Quiet hours"
            checked={quietHours}
            onCheckedChange={() => setQuietHours((enabled) => !enabled)}
          />
        </View>
      </AppCard>
      <Text className="text-muted-foreground mt-4 text-center text-xs">
        Demo updates and preferences are stored only for this session. Push notifications are not
        connected.
      </Text>
    </AppPage>
  );
}
