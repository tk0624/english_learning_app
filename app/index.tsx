import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import ReaderTab from './(tabs)/reader';
import MyWordsTab from './(tabs)/my-words';
import MasteredTab from './(tabs)/mastered';

type TabId = 'reader' | 'my-words' | 'mastered';

const TABS: { id: TabId; label: string; emoji: string }[] = [
  { id: 'reader',   label: 'テキスト分析', emoji: '📖' },
  { id: 'my-words', label: 'マイ単語帳',   emoji: '📒' },
  { id: 'mastered', label: '覚えた単語',   emoji: '✅' },
];

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState<TabId>('reader');

  return (
    <View style={styles.root}>
      {/* ── ヘッダー ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>English Learning App</Text>
      </View>

      {/* ── コンテンツ（全タブを常時マウント、display切替で状態保持） ── */}
      <View style={[styles.content, activeTab !== 'reader'   && styles.hidden]}>
        <ReaderTab />
      </View>
      <View style={[styles.content, activeTab !== 'my-words' && styles.hidden]}>
        <MyWordsTab />
      </View>
      <View style={[styles.content, activeTab !== 'mastered' && styles.hidden]}>
        <MasteredTab />
      </View>

      {/* ── タブバー ── */}
      <View style={styles.tabBar}>
        {TABS.map(({ id, label, emoji }) => {
          const active = activeTab === id;
          return Platform.OS === 'web' ? (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                paddingTop: 6,
                paddingBottom: 10,
                background: active ? 'rgba(126,217,87,0.10)' : 'none',
                border: 'none',
                borderTop: active ? '2px solid #7ed957' : '2px solid transparent',
                cursor: 'pointer',
                gap: 2,
                transition: 'background 0.15s',
              } as React.CSSProperties}
            >
              <span style={{ fontSize: active ? 22 : 20, transition: 'font-size 0.15s' }}>{emoji}</span>
              <span style={{
                fontSize: 11,
                fontWeight: '700',
                color: active ? '#7ed957' : '#888',
              }}>{label}</span>
            </button>
          ) : (
            <TouchableOpacity key={id} style={styles.tabItem} onPress={() => setActiveTab(id)}>
              <Text style={styles.tabEmoji}>{emoji}</Text>
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:           { flex: 1, backgroundColor: '#121212' },
  header:         { backgroundColor: '#1a1a2e', height: 56, justifyContent: 'center', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#2a2a3e' },
  headerTitle:    { color: '#f5f5f5', fontWeight: 'bold', fontSize: 17 },
  content:        { flex: 1 },
  hidden:         { display: 'none' },
  tabBar:         { flexDirection: 'row', backgroundColor: '#1a1a2e', borderTopWidth: 1, borderTopColor: '#2a2a3e', height: Platform.OS === 'web' ? 68 : 96 },
  tabItem:        { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 6, paddingBottom: Platform.OS === 'web' ? 10 : 30 },
  tabEmoji:       { fontSize: 20 },
  tabLabel:       { fontSize: 11, fontWeight: '600', color: '#888', marginTop: 2 },
  tabLabelActive: { color: '#7ed957' },
});
