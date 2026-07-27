import { Tabs } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Redirect } from 'expo-router';
import { Palette } from '@/constants/theme';

export default function OwnerTabsLayout() {
  const { profile } = useAuth();

  if (profile?.is_owner === false) {
    return <Redirect href="/(client-tabs)" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Palette.primary,
        tabBarInactiveTintColor: Palette.textMuted,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Dashboard', href: '/(owner-tabs)' }} />
      <Tabs.Screen name="clients" options={{ title: 'Clients' }} />
      <Tabs.Screen name="rewards" options={{ title: 'Roue' }} />
      <Tabs.Screen name="settings" options={{ title: 'Paramètres' }} />
    </Tabs>
  );
}
