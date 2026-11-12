import { Tabs } from 'expo-router';
import { Bell, House, UserRound } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUniwind } from 'uniwind';

export default function TabsLayout() {
  const { theme } = useUniwind();
  const insets = useSafeAreaInsets();
  const isDark = theme === 'dark';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#047857',
        tabBarInactiveTintColor: isDark ? '#98a2b3' : '#667085',
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        tabBarStyle: {
          backgroundColor: isDark ? '#101828' : '#ffffff',
          borderTopColor: isDark ? '#344054' : '#e4e7ec',
          height: 64 + insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
          paddingTop: 7,
          paddingBottom: Math.max(insets.bottom, 7),
        },
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <House color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Updates',
          tabBarIcon: ({ color, size }) => <Bell color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <UserRound color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
