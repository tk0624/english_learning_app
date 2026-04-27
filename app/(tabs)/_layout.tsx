import { Tabs } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, Text } from 'react-native';

const TABS: { name: string; label: string; emoji: string }[] = [
  { name: 'reader',   label: 'テキスト分析', emoji: '📖' },
  { name: 'my-words', label: 'マイ単語帳',   emoji: '📒' },
  { name: 'mastered', label: '覚えた単語',   emoji: '✅' },
];

export default function TabLayout() {
  const [safeBottom, setSafeBottom] = useState(0);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const probe = document.createElement('div');
    probe.style.paddingBottom = 'env(safe-area-inset-bottom, 0px)';
    probe.style.position = 'fixed';
    probe.style.visibility = 'hidden';
    probe.style.pointerEvents = 'none';
    document.body.appendChild(probe);
    const val = parseFloat(getComputedStyle(probe).paddingBottom) || 0;
    document.body.removeChild(probe);
    setSafeBottom(val);
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTitle: 'English Learning App',
        headerStyle: { backgroundColor: '#1a1a2e' },
        headerTitleStyle: { color: '#f5f5f5', fontWeight: 'bold', fontSize: 17 },
        tabBarActiveTintColor: '#7ed957',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: {
          backgroundColor: '#1a1a2e',
          borderTopColor: '#2a2a3e',
          height: Platform.OS === 'web' ? 68 + safeBottom : 96,
          paddingBottom: Platform.OS === 'web' ? safeBottom : 0,
        },
        tabBarItemStyle: {
          paddingTop: 6,
          paddingBottom: Platform.OS === 'web' ? 10 : 30,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginBottom: 2,
        },
      }}
    >
      {TABS.map(({ name, label, emoji }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title: label,
            tabBarIcon: ({ color }) => (
              <Text style={{ fontSize: 20, color, textAlign: 'center' }}>{emoji}</Text>
            ),
          }}
        />
      ))}
      {/* 使っていないがファイルが残っているルートを非表示にする */}
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="flashcard" options={{ href: null }} />
      <Tabs.Screen name="grammar" options={{ href: null }} />
      <Tabs.Screen name="listening" options={{ href: null }} />
      <Tabs.Screen name="speaking" options={{ href: null }} />
      <Tabs.Screen name="pronunciation" options={{ href: null }} />
    </Tabs>
  );
}
