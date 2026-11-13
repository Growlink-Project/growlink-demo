import React, { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { Lexend_400Regular } from '@expo-google-fonts/lexend/400Regular';
import { Lexend_500Medium } from '@expo-google-fonts/lexend/500Medium';
import { Lexend_600SemiBold } from '@expo-google-fonts/lexend/600SemiBold';
import { Lexend_700Bold } from '@expo-google-fonts/lexend/700Bold';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { colors } from '@/theme/tokens';
import { Toast } from '@/components/ui/core';
import { LabFab } from '@/features/lab/Lab';

SplashScreen.preventAutoHideAsync().catch(() => {});
const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 30_000 } } });

export default function RootLayout() {
  const [loaded, error] = useFonts({ Lexend_400Regular, Lexend_500Medium, Lexend_600SemiBold, Lexend_700Bold, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });
  useEffect(() => { if (loaded || error) SplashScreen.hideAsync().catch(() => {}); }, [loaded, error]);
  if (!loaded && !error) return <View style={{ flex: 1, backgroundColor: colors.canvas }} />;
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <View style={[{ flex: 1, backgroundColor: colors.canvas }, Platform.OS === 'web' ? ({ maxWidth: 480, width: '100%', alignSelf: 'center', overflow: 'hidden' } as object) : null]}>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas }, animation: 'slide_from_right' }}>
            <Stack.Screen name="student" options={{ animation: 'fade' }} />
            <Stack.Screen name="teacher" options={{ animation: 'fade' }} />
            <Stack.Screen name="filters" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="location" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="search" options={{ animation: 'fade' }} />
            <Stack.Screen name="lab" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          </Stack>
          <Toast />
          <LabFab />
        </View>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
