import { AppButton, AppCard } from '@/components/app/ui';
import { Text } from '@/components/ui/text';
import { scheduleHelloWorldNotification } from '@/lib/local-notification-experiment';
import { BellRing } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

export function LocalNotificationExperiment() {
  const [isScheduling, setIsScheduling] = useState(false);
  const [status, setStatus] = useState('');

  const sendTestNotification = async () => {
    setIsScheduling(true);
    setStatus('');
    try {
      await scheduleHelloWorldNotification();
      setStatus('Hello world notification scheduled.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not schedule the notification.');
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <AppCard className="mt-7 gap-3 border-dashed">
      <View className="flex-row items-center gap-3">
        <View className="h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900">
          <BellRing color="#b45309" size={21} />
        </View>
        <View className="flex-1">
          <Text className="text-foreground font-bold">Local notification experiment</Text>
          <Text className="text-muted-foreground mt-1 text-xs">
            Temporary test button · no Firebase connection
          </Text>
        </View>
      </View>
      <AppButton
        disabled={isScheduling}
        label={isScheduling ? 'Scheduling…' : 'Send “Hello world” notification'}
        onPress={() => void sendTestNotification()}
        variant="secondary"
      />
      {status ? (
        <Text accessibilityLiveRegion="polite" className="text-muted-foreground text-sm">
          {status}
        </Text>
      ) : null}
    </AppCard>
  );
}
