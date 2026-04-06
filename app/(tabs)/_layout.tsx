import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const TABS: { name: string; label: string; icon: IoniconName }[] = [
  { name: 'reader',   label: 'テキスト分析', icon: 'document-text-outline' },
  { name: 'my-words', label: 'マイ単語帳',   icon: 'bookmark-outline' },
  { name: 'mastered', label: '覚えた単語',   icon: 'checkmark-done-outline' },
];

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#4A90E2',
        tabBarInactiveTintColor: '#8E8E93',
        headerShown: true,
      }}
    >
      {TABS.map(({ name, label, icon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title: label,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name={icon} size={size} color={color} />
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
