import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useProgressStore } from '@/store/progressStore';

export default function RootLayout() {
  const load = useProgressStore((s) => s.load);

  useEffect(() => {
    load();
  }, []);

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
