import { Tabs } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Redirect } from 'expo-router';
import { Palette } from '@/constants/theme';

export default function ClientTabsLayout() {
  const { profile } = useAuth();

  if (profile?.is_owner === true) {
    return <Redirect href="/(owner-tabs)" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Palette.primary,
        tabBarInactiveTintColor: Palette.textMuted,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Accueil', href: '/(client-tabs)' }} />
      <Tabs.Screen name="my-card" options={{ title: 'Ma Carte' }} />
      <Tabs.Screen name="wheel" options={{ title: 'Roue' }} />
      <Tabs.Screen name="rewards" options={{ title: 'Récompenses' }} />
      <Tabs.Screen name="settings" options={{ title: 'Paramètres' }} />
    </Tabs>
  );
}
