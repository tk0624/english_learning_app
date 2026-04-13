import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useProgressStore } from '@/store/progressStore';

export default function RootLayout() {
  const load = useProgressStore((s) => s.load);

  useEffect(() => {
    load();
  }, []);

  // Web: viewport meta でピンチズーム・自動ズームを抑止
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const meta = document.querySelector('meta[name="viewport"]');
    if (meta) {
      meta.setAttribute(
        'content',
        'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
      );
    } else {
      const tag = document.createElement('meta');
      tag.name = 'viewport';
      tag.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no';
      document.head.appendChild(tag);
    }
  }, []);

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
