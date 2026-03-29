import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AudioPlayerProvider } from '@/contexts/AudioPlayerContext';
import { LibraryProvider } from '@/contexts/LibraryContext';
import { AIRecommendationsProvider } from '@/contexts/AIRecommendationsContext';
import { Colors } from '@/constants/colors';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <LibraryProvider>
        <AIRecommendationsProvider>
          <AudioPlayerProvider>
            <StatusBar style="light" />
            <RootLayoutNav />
          </AudioPlayerProvider>
        </AIRecommendationsProvider>
      </LibraryProvider>
    </QueryClientProvider>
  );
}

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.dark.background },
        animation: 'slide_from_bottom',
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen 
        name="now-playing" 
        options={{ 
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }} 
      />
      <Stack.Screen 
        name="queue" 
        options={{ 
          presentation: 'modal',
          animation: 'slide_from_right',
        }} 
      />
      <Stack.Screen 
        name="equalizer" 
        options={{ 
          presentation: 'modal',
          animation: 'slide_from_right',
        }} 
      />
      <Stack.Screen 
        name="volume-booster" 
        options={{ 
          presentation: 'modal',
          animation: 'slide_from_right',
        }} 
      />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}
