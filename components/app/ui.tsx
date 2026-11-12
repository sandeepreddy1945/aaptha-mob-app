import { Text } from '@/components/ui/text';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pressable, ScrollView, View, type PressableProps, type ViewProps } from 'react-native';

type IconComponent = React.ComponentType<{
  color?: string;
  size?: number;
  strokeWidth?: number;
}>;

export function AppPage({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView className="bg-background flex-1" edges={[]} style={{ flex: 1 }}>
      <ScrollView
        className="flex-1"
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingLeft: 20 + insets.left,
          paddingRight: 20 + insets.right,
          paddingTop: 16 + insets.top,
          paddingBottom: 32 + insets.bottom,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function AppCard({ className = '', ...props }: ViewProps & { className?: string }) {
  return (
    <View
      className={`border-border bg-card rounded-3xl border p-5 shadow-sm shadow-black/5 ${className}`}
      {...props}
    />
  );
}

export function SectionHeading({ title, detail }: { title: string; detail?: string }) {
  return (
    <View className="mt-7 mb-3 gap-1">
      <Text className="text-foreground text-lg font-bold">{title}</Text>
      {detail ? <Text className="text-muted-foreground text-sm">{detail}</Text> : null}
    </View>
  );
}

export function AppButton({
  label,
  onPress,
  icon: Icon,
  variant = 'primary',
  disabled,
  ...props
}: Omit<PressableProps, 'children'> & {
  label: string;
  icon?: IconComponent;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
}) {
  const buttonClass = {
    primary: 'bg-emerald-700',
    secondary: 'bg-emerald-50 dark:bg-emerald-950',
    danger: 'bg-rose-600',
    outline: 'border border-border bg-card',
  }[variant];
  const labelClass = {
    primary: 'text-white',
    secondary: 'text-emerald-800 dark:text-emerald-200',
    danger: 'text-white',
    outline: 'text-foreground',
  }[variant];
  const iconColor =
    variant === 'secondary' ? '#047857' : variant === 'outline' ? '#344054' : '#ffffff';

  return (
    <Pressable
      accessibilityRole="button"
      className={`min-h-14 flex-row items-center justify-center gap-2 rounded-2xl px-5 active:opacity-80 ${buttonClass} ${disabled ? 'opacity-50' : ''}`}
      disabled={disabled}
      onPress={onPress}
      {...props}>
      {Icon ? <Icon color={iconColor} size={20} strokeWidth={2.5} /> : null}
      <Text className={`text-base font-bold ${labelClass}`}>{label}</Text>
    </Pressable>
  );
}

export function RowIcon({
  icon: Icon,
  tone = 'green',
}: {
  icon: IconComponent;
  tone?: 'green' | 'blue' | 'amber' | 'rose' | 'violet';
}) {
  const toneClass = {
    green: 'bg-emerald-100 dark:bg-emerald-900',
    blue: 'bg-sky-100 dark:bg-sky-900',
    amber: 'bg-amber-100 dark:bg-amber-900',
    rose: 'bg-rose-100 dark:bg-rose-900',
    violet: 'bg-violet-100 dark:bg-violet-900',
  }[tone];
  const iconColor = {
    green: '#047857',
    blue: '#0369a1',
    amber: '#b45309',
    rose: '#be123c',
    violet: '#6d28d9',
  }[tone];

  return (
    <View className={`h-11 w-11 items-center justify-center rounded-2xl ${toneClass}`}>
      <Icon color={iconColor} size={21} strokeWidth={2.2} />
    </View>
  );
}

export function Divider() {
  return <View className="bg-border h-px" />;
}
