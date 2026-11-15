import { AppButton, AppCard, AppPage } from '@/components/app/ui';
import { Text } from '@/components/ui/text';
import { AuthLoadingScreen, useAuth } from '@/contexts/auth-context';
import { Redirect } from 'expo-router';
import Constants from 'expo-constants';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useRef, useState } from 'react';
import { Alert, Platform, Pressable, TextInput, View } from 'react-native';
import { LockKeyhole, Mail, ShieldCheck } from 'lucide-react-native';

WebBrowser.maybeCompleteAuthSession();

type LoginMode = 'sign-in' | 'sign-up';

function errorMessage(error: unknown) {
  const code = (error as { code?: string })?.code;
  switch (code) {
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'The email or password is incorrect.';
    case 'auth/email-already-in-use':
      return 'An account already exists for this email.';
    case 'auth/weak-password':
      return 'Choose a password with at least 6 characters.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a little and try again.';
    case 'auth/network-request-failed':
      return 'Check your internet connection and try again.';
    default:
      return error instanceof Error ? error.message : 'Authentication failed. Try again.';
  }
}

type GoogleOAuthConfig = {
  webClientId: string;
  androidClientId?: string;
  iosClientId?: string;
};

function GoogleSignInButton({
  config,
  busy,
  onBusyChange,
  onError,
  onSignIn,
  onStart,
}: {
  config: GoogleOAuthConfig;
  busy: boolean;
  onBusyChange: (busy: boolean) => void;
  onError: (error: unknown) => void;
  onSignIn: (idToken: string) => Promise<void>;
  onStart: () => void;
}) {
  const [request, response, promptGoogle] = Google.useIdTokenAuthRequest(config);
  const handledGoogleToken = useRef<string | null>(null);

  useEffect(() => {
    const idToken = response?.type === 'success' ? response.params.id_token : undefined;
    if (!idToken || handledGoogleToken.current === idToken) return;
    handledGoogleToken.current = idToken;
    onBusyChange(true);
    void onSignIn(idToken)
      .catch(onError)
      .finally(() => onBusyChange(false));
  }, [onBusyChange, onError, onSignIn, response]);

  return (
    <AppButton
      disabled={busy || !request}
      label="Continue with Google"
      onPress={() => {
        onStart();
        void promptGoogle().catch(onError);
      }}
      variant="outline"
    />
  );
}

export default function LoginScreen() {
  const { user, loading, signInWithEmail, createAccount, signInWithGoogleIdToken, resetPassword } =
    useAuth();
  const [mode, setMode] = useState<LoginMode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const configuredGoogleOAuth = Constants.expoConfig?.extra?.googleOAuth ?? {};
  const googleWebClientId =
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || configuredGoogleOAuth.webClientId || '';
  const googleAndroidClientId =
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || configuredGoogleOAuth.androidClientId;
  const googleIosClientId =
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || configuredGoogleOAuth.iosClientId;
  const googleConfig = {
    webClientId: googleWebClientId,
    androidClientId: googleAndroidClientId,
    iosClientId: googleIosClientId,
  };
  const googlePlatformClientId =
    Platform.OS === 'android'
      ? googleAndroidClientId
      : Platform.OS === 'ios'
        ? googleIosClientId
        : googleWebClientId;
  const googleSignInConfigured = Boolean(googleWebClientId && googlePlatformClientId);

  if (loading) return <AuthLoadingScreen />;
  if (user) return <Redirect href="/(tabs)/home" />;

  const submitEmail = async () => {
    setError(null);
    const normalizedEmail = email.trim();
    if (!normalizedEmail || !password) {
      setError('Enter your email and password.');
      return;
    }
    if (mode === 'sign-up' && password.length < 6) {
      setError('Choose a password with at least 6 characters.');
      return;
    }

    setBusy(true);
    try {
      if (mode === 'sign-up') await createAccount(normalizedEmail, password);
      else await signInWithEmail(normalizedEmail, password);
    } catch (authError) {
      setError(errorMessage(authError));
    } finally {
      setBusy(false);
    }
  };

  const sendResetEmail = async () => {
    if (!email.trim()) {
      setError('Enter your email address first.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await resetPassword(email);
      Alert.alert('Check your email', 'A password reset link has been sent.');
    } catch (resetError) {
      setError(errorMessage(resetError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppPage>
      <View className="mt-10 items-center">
        <View className="h-16 w-16 items-center justify-center rounded-3xl bg-emerald-100 dark:bg-emerald-900">
          <ShieldCheck color="#047857" size={32} />
        </View>
        <Text className="text-foreground mt-5 text-3xl font-extrabold">Welcome to Aaptha</Text>
        <Text className="text-muted-foreground mt-2 text-center text-base">
          Sign in to securely access your account.
        </Text>
      </View>

      <AppCard className="mt-8 gap-4">
        <View className="gap-2">
          <Text className="text-foreground text-sm font-semibold">Email address</Text>
          <View className="border-border bg-background min-h-14 flex-row items-center gap-3 rounded-2xl border px-4">
            <Mail color="#667085" size={19} />
            <TextInput
              accessibilityLabel="Email address"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              className="text-foreground flex-1 py-3 text-base"
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="name@example.com"
              placeholderTextColor="#98a2b3"
              textContentType="emailAddress"
              value={email}
            />
          </View>
        </View>

        <View className="gap-2">
          <Text className="text-foreground text-sm font-semibold">Password</Text>
          <View className="border-border bg-background min-h-14 flex-row items-center gap-3 rounded-2xl border px-4">
            <LockKeyhole color="#667085" size={19} />
            <TextInput
              accessibilityLabel="Password"
              autoCapitalize="none"
              autoComplete={mode === 'sign-up' ? 'new-password' : 'password'}
              className="text-foreground flex-1 py-3 text-base"
              onChangeText={setPassword}
              onSubmitEditing={() => void submitEmail()}
              placeholder="Password"
              placeholderTextColor="#98a2b3"
              secureTextEntry
              textContentType={mode === 'sign-up' ? 'newPassword' : 'password'}
              value={password}
            />
          </View>
        </View>

        {error ? (
          <Text accessibilityRole="alert" className="text-sm font-medium text-rose-700">
            {error}
          </Text>
        ) : null}

        <AppButton
          disabled={busy}
          label={busy ? 'Please wait…' : mode === 'sign-up' ? 'Create account' : 'Sign in'}
          onPress={() => void submitEmail()}
        />

        {mode === 'sign-in' ? (
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={() => void sendResetEmail()}>
            <Text className="text-center text-sm font-semibold text-emerald-800 dark:text-emerald-200">
              Forgot password?
            </Text>
          </Pressable>
        ) : null}

        <View className="flex-row items-center gap-3">
          <View className="bg-border h-px flex-1" />
          <Text className="text-muted-foreground text-xs font-semibold">OR</Text>
          <View className="bg-border h-px flex-1" />
        </View>

        {googleSignInConfigured ? (
          <GoogleSignInButton
            busy={busy}
            config={googleConfig}
            onBusyChange={setBusy}
            onError={(authError) => setError(errorMessage(authError))}
            onSignIn={signInWithGoogleIdToken}
            onStart={() => setError(null)}
          />
        ) : (
          <>
            <AppButton
              disabled
              label="Continue with Google"
              onPress={() => undefined}
              variant="outline"
            />
            <Text className="text-muted-foreground text-center text-xs leading-5">
              {Platform.OS === 'android'
                ? 'Add an Android OAuth client ID for com.sandeep209.minimal to enable Google sign-in.'
                : `Add the Google OAuth client ID for ${Platform.OS} to enable Google sign-in.`}
            </Text>
          </>
        )}

        <View className="flex-row justify-center gap-1">
          <Text className="text-muted-foreground text-sm">
            {mode === 'sign-up' ? 'Already have an account?' : 'New to Aaptha?'}
          </Text>
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={() => {
              setError(null);
              setMode((current) => (current === 'sign-in' ? 'sign-up' : 'sign-in'));
            }}>
            <Text className="text-sm font-bold text-emerald-800 dark:text-emerald-200">
              {mode === 'sign-up' ? 'Sign in' : 'Create account'}
            </Text>
          </Pressable>
        </View>
      </AppCard>

      <Text className="text-muted-foreground mt-5 text-center text-xs leading-5">
        Your Firebase session persists across app restarts. Sign out any time from your profile.
      </Text>
    </AppPage>
  );
}
