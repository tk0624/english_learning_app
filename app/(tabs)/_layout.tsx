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
        headerShown: true,
        headerTitle: 'English Learning App',
        headerStyle: { backgroundColor: '#1a1a2e' },
        headerTitleStyle: { color: '#f5f5f5', fontWeight: 'bold', fontSize: 17 },
        tabBarActiveTintColor: '#7ed957',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: {
          backgroundColor: '#1a1a2e',
          borderTopColor: '#2a2a3e',
          height: 80,
          paddingBottom: 18,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginBottom: 4,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
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
