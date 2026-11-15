import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { ActivityIndicator, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { auth } from '@/lib/firebase-auth';
import {
  registerFcmToken,
  subscribeToFcmTokenRefresh,
  subscribeToForegroundMessages,
  unregisterFcmToken,
} from '@/lib/push-notifications';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  createAccount: (email: string, password: string) => Promise<void>;
  signInWithGoogleIdToken: (idToken: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(
    () =>
      onAuthStateChanged(
        auth,
        (nextUser) => {
          setUser(nextUser);
          setLoading(false);
        },
        (error) => {
          console.warn('Firebase Auth state could not be restored:', error);
          setLoading(false);
        }
      ),
    []
  );

  useEffect(() => {
    if (!user) return;

    let active = true;
    let stopTokenRefresh = () => undefined;
    let stopForegroundMessages = () => undefined;

    void registerFcmToken(user.uid).catch((error) => {
      console.warn('Unable to register this device for FCM notifications:', error);
    });
    void subscribeToFcmTokenRefresh(user.uid)
      .then((stop) => {
        if (active) stopTokenRefresh = stop;
        else stop();
      })
      .catch((error) => console.warn('Unable to listen for FCM token changes:', error));
    void subscribeToForegroundMessages()
      .then((stop) => {
        if (active) stopForegroundMessages = stop;
        else stop();
      })
      .catch((error) => console.warn('Unable to listen for foreground FCM messages:', error));

    return () => {
      active = false;
      stopTokenRefresh();
      stopForegroundMessages();
    };
  }, [user?.uid]);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  }, []);

  const createAccount = useCallback(async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email.trim(), password);
  }, []);

  const signInWithGoogleIdToken = useCallback(async (idToken: string) => {
    await signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  }, []);

  const signOut = useCallback(async () => {
    if (user) {
      try {
        await unregisterFcmToken(user.uid);
      } catch (error) {
        console.warn('Unable to remove the device FCM token before sign-out:', error);
      }
    }
    await firebaseSignOut(auth);
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      loading,
      signInWithEmail,
      createAccount,
      signInWithGoogleIdToken,
      resetPassword,
      signOut,
    }),
    [user, loading, signInWithEmail, createAccount, signInWithGoogleIdToken, resetPassword, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside an AuthProvider.');
  return context;
}

export function AuthLoadingScreen() {
  return (
    <View className="bg-background flex-1 items-center justify-center gap-3">
      <ActivityIndicator color="#047857" size="large" />
      <Text className="text-muted-foreground text-sm">Restoring your secure session…</Text>
    </View>
  );
}
