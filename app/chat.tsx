import { AppCard, RowIcon } from '@/components/app/ui';
import { Text } from '@/components/ui/text';
import { getActiveShiftStart } from '@/lib/background-location';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Bot, Send, ShieldCheck } from 'lucide-react-native';

type ChatMessage = { id: string; from: 'employee' | 'assistant'; message: string };

const QUICK_QUESTIONS = [
  'How do I check my next shift?',
  'How do I report a missed visit?',
  'Who can help with a policy question?',
];

const INITIAL_MESSAGE: ChatMessage = {
  id: 'welcome',
  from: 'assistant',
  message: 'Hello, Asha. I can help you find the right place for shift, HR, or care questions.',
};

export default function ChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [draft, setDraft] = useState('');
  const [shiftContext, setShiftContext] = useState('Checking shift status…');

  useEffect(() => {
    getActiveShiftStart()
      .then((startedAt) => {
        setShiftContext(
          startedAt
            ? `Clocked in since ${new Date(startedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
            : 'Not currently clocked in'
        );
      })
      .catch(() => setShiftContext('Shift details unavailable'));
  }, []);

  const sendMessage = (message = draft) => {
    const trimmed = message.trim();
    if (!trimmed) return;
    setMessages((current) => [
      ...current,
      { id: `employee-${Date.now()}`, from: 'employee', message: trimmed },
      {
        id: `assistant-${Date.now()}`,
        from: 'assistant',
        message:
          'The organization’s AI service is not connected in this preview, so I cannot confirm schedules or policy details. Please check Updates or contact your care coordinator.',
      },
    ]);
    setDraft('');
  };

  return (
    <SafeAreaView
      className="bg-background flex-1"
      edges={['top', 'bottom', 'left', 'right']}
      style={{ flex: 1 }}>
      <KeyboardAvoidingView
        className="bg-background flex-1"
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top}>
        <View className="border-border flex-row items-center gap-3 border-b px-5 pt-4 pb-4">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            className="bg-secondary h-11 w-11 items-center justify-center rounded-full"
            onPress={() => router.back()}>
            <ArrowLeft color="#344054" size={21} />
          </Pressable>
          <View className="h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 dark:bg-violet-950">
            <Bot color="#6d28d9" size={23} />
          </View>
          <View className="flex-1">
            <Text className="text-foreground text-lg font-extrabold">Ask Aaptha AI</Text>
            <Text className="text-muted-foreground text-xs">Demo employee · {shiftContext}</Text>
          </View>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 20, gap: 16 }}
          keyboardShouldPersistTaps="handled">
          <AppCard className="border-violet-200 bg-violet-50 dark:border-violet-900 dark:bg-violet-950">
            <View className="flex-row items-start gap-3">
              <RowIcon icon={ShieldCheck} tone="violet" />
              <View className="flex-1">
                <Text className="text-foreground font-bold">A helpful starting point</Text>
                <Text className="text-muted-foreground mt-1 text-sm leading-5">
                  This is an AI assistant preview, not a person. For urgent safety concerns or a
                  decision that needs a human, contact your coordinator.
                </Text>
              </View>
            </View>
          </AppCard>

          <View className="flex-row justify-start">
            <View className="bg-secondary max-w-[88%] rounded-3xl rounded-bl-md px-4 py-3">
              <Text className="text-foreground text-sm leading-5">{INITIAL_MESSAGE.message}</Text>
            </View>
          </View>

          {messages.slice(1).map((message) => (
            <View
              className={`flex-row ${message.from === 'employee' ? 'justify-end' : 'justify-start'}`}
              key={message.id}>
              <View
                className={`max-w-[88%] rounded-3xl px-4 py-3 ${message.from === 'employee' ? 'rounded-br-md bg-emerald-700' : 'bg-secondary rounded-bl-md'}`}>
                <Text
                  className={`text-sm leading-5 ${message.from === 'employee' ? 'text-white' : 'text-foreground'}`}>
                  {message.message}
                </Text>
              </View>
            </View>
          ))}

          {messages.length === 1 ? (
            <View className="gap-2">
              <Text className="text-muted-foreground text-xs font-semibold">
                SUGGESTED QUESTIONS
              </Text>
              {QUICK_QUESTIONS.map((question) => (
                <Pressable
                  accessibilityRole="button"
                  className="border-border bg-card min-h-12 flex-row items-center justify-between rounded-2xl border px-4 py-3"
                  key={question}
                  onPress={() => sendMessage(question)}>
                  <Text className="text-foreground flex-1 pr-3 text-sm font-medium">
                    {question}
                  </Text>
                  <Send color="#047857" size={16} />
                </Pressable>
              ))}
            </View>
          ) : null}
        </ScrollView>

        <View className="border-border border-t px-4 pt-3 pb-5">
          <View className="border-border bg-card flex-row items-end gap-2 rounded-2xl border p-2">
            <TextInput
              accessibilityLabel="Message Aaptha AI"
              className="text-foreground max-h-28 min-h-11 flex-1 px-3 py-2 text-base"
              multiline
              onChangeText={setDraft}
              onSubmitEditing={() => sendMessage()}
              placeholder="Ask about work…"
              placeholderTextColor="#98a2b3"
              returnKeyType="send"
              value={draft}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Send message"
              className="h-11 w-11 items-center justify-center rounded-xl bg-emerald-700"
              disabled={!draft.trim()}
              onPress={() => sendMessage()}>
              <Send color="#ffffff" size={19} />
            </Pressable>
          </View>
          <Text className="text-muted-foreground mt-2 text-center text-[11px]">
            Preview only: messages are not sent to an AI service or saved to an account. Do not
            enter sensitive personal details.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
