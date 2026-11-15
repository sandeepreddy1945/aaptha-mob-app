import { AuthLoadingScreen, useAuth } from '@/contexts/auth-context';
import { Redirect, type Href } from 'expo-router';

export default function IndexRoute() {
  const { user, loading } = useAuth();
  if (loading) return <AuthLoadingScreen />;
  return <Redirect href={(user ? '/(tabs)/home' : '/login') as Href} />;
}
