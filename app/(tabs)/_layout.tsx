import { Tabs } from 'expo-router';
import { Platform, Text } from 'react-native';

const TABS: { name: string; label: string; emoji: string }[] = [
  { name: 'reader',   label: 'テキスト分析', emoji: '📖' },
  { name: 'my-words', label: 'マイ単語帳',   emoji: '📒' },
  { name: 'mastered', label: '覚えた単語',   emoji: '✅' },
];

export default function TabLayout() {
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
          height: Platform.OS === 'web' ? 68 : 96,
          paddingBottom: 0,
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
