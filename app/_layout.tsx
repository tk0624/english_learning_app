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

  // Web: no-cache meta + viewport meta
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    // キャッシュ無効化
    const addMeta = (httpEquiv: string, content: string) => {
      if (!document.querySelector(`meta[http-equiv="${httpEquiv}"]`)) {
        const m = document.createElement('meta');
        m.httpEquiv = httpEquiv;
        m.content = content;
        document.head.appendChild(m);
      }
    };
    addMeta('Cache-Control', 'no-cache, no-store, must-revalidate');
    addMeta('Pragma', 'no-cache');
    addMeta('Expires', '0');
    const meta = document.querySelector('meta[name="viewport"]');
    if (meta) {
      meta.setAttribute(
        'content',
        'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover',
      );
    } else {
      const tag = document.createElement('meta');
      tag.name = 'viewport';
      tag.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover';
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
