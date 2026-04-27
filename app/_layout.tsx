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
        'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover',
      );
    } else {
      const tag = document.createElement('meta');
      tag.name = 'viewport';
      tag.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover';
      document.head.appendChild(tag);
    }

    // iOS PWA: キーボード表示時にビューポート高さが縮小してタブバーが消える問題を防ぐ
    // screen.height はキーボードが出ても変化しない物理画面高さ
    const appH = window.screen.height;
    const style = document.createElement('style');
    style.textContent = `html,body{height:${appH}px!important;max-height:${appH}px!important;overflow:hidden!important;position:fixed!important;width:100%!important;}`;
    document.head.appendChild(style);
  }, []);

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
