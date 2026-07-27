import { Stack } from 'expo-router';
import { AuthProvider } from '@/contexts/AuthContext';
import { LoyaltyProvider } from '@/contexts/LoyaltyContext';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Italiana_400Regular: require('@expo-google-fonts/italiana').Italiana_400Regular,
    Manrope_400Regular: require('@expo-google-fonts/manrope').Manrope_400Regular,
    Manrope_500Medium: require('@expo-google-fonts/manrope').Manrope_500Medium,
    Manrope_700Bold: require('@expo-google-fonts/manrope').Manrope_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AuthProvider>
      <LoyaltyProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            animationEnabled: true,
          }}
        >
          <Stack.Screen name="(auth)" options={{ animationEnabled: false }} />
          <Stack.Screen name="(client-tabs)" options={{ animationEnabled: false }} />
          <Stack.Screen name="(owner-tabs)" options={{ animationEnabled: false }} />
        </Stack>
      </LoyaltyProvider>
    </AuthProvider>
  );
}
