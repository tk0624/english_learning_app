import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Linking,
} from 'react-native';
import * as Speech from 'expo-speech';
import { useProgressStore } from '@/store/progressStore';
import { lookupWord, translateToJa } from '@/utils/dictionaryApi';
import type { MyVocabularyItem } from '@/types';

export default function MyWordsScreen() {
  const { myVocabulary, masterWord, updateVocabulary } =
    useProgressStore();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editMeaning, setEditMeaning] = useState('');
  const [editExample, setEditExample] = useState('');
  const [fetchingId, setFetchingId] = useState<string | null>(null);

  const handleMaster = (id: string) => {
    masterWord(id);
  };

  const playWord = (item: MyVocabularyItem) => {
    Speech.speak(item.word, { language: 'en-US', rate: 0.8 });
  };

  const searchWeb = (word: string) => {
    Linking.openURL(`https://www.google.com/search?q=${encodeURIComponent(word + ' meaning english')}`);
  };

  const startEdit = (item: MyVocabularyItem) => {
    setEditingId(item.id);
    setEditMeaning(item.meaning || '');
    setEditExample(item.example || '');
  };

  const saveEdit = () => {
    if (!editingId) return;
    updateVocabulary(editingId, {
      meaning: editMeaning.trim(),
      example: editExample.trim(),
    });
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  /** 辞書API + 和訳を自動取得してストアに即保存 */
  const fetchMeaning = async (item: MyVocabularyItem) => {
    setFetchingId(item.id);
    try {
      // 1. 辞書API再検索（英英）
      const dict = await lookupWord(item.word);
      const topDef = dict?.definitions?.[0];

      // 2. 和訳を取得
      const ja = await translateToJa(item.word);

      const parts: string[] = [];
      if (topDef) parts.push(`(${topDef.partOfSpeech}) ${topDef.definition}`);
      if (ja) parts.push(`【和訳】${ja}`);

      const meaning = parts.join('\n') || '';
      const example = topDef?.example || item.example || '';

      if (meaning) {
        updateVocabulary(item.id, { meaning, example });
      } else {
        window.alert('辞書・翻訳ともに取得できませんでした。Web検索で確認してください。');
      }
    } catch {
      window.alert('取得に失敗しました');
    } finally {
      setFetchingId(null);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} style={styles.scrollBg}>
      <Text style={styles.count}>{myVocabulary.length} 件</Text>

      {myVocabulary.length === 0 ? (
        <Text style={styles.empty}>
          「テキスト分析」でわからない単語をチェックすると、ここに追加されます。
        </Text>
      ) : (
        myVocabulary.map((item) => (
          <WordCard
            key={item.id}
            item={item}
            expanded={expanded === item.id}
            editing={editingId === item.id}
            fetching={fetchingId === item.id}
            editMeaning={editMeaning}
            editExample={editExample}
            onToggle={() => setExpanded(expanded === item.id ? null : item.id)}
            onPlay={() => playWord(item)}
            onMaster={() => handleMaster(item.id)}
            onSearch={() => searchWeb(item.word)}
            onFetchMeaning={() => fetchMeaning(item)}
            onStartEdit={() => startEdit(item)}
            onSaveEdit={saveEdit}
            onCancelEdit={cancelEdit}
            onChangeMeaning={setEditMeaning}
            onChangeExample={setEditExample}
          />
        ))
      )}

    </ScrollView>
  );
}

// ── WordCard コンポーネント ─────────────────────────────────

function WordCard({
  item,
  expanded,
  editing,
  fetching,
  editMeaning,
  editExample,
  onToggle,
  onPlay,
  onMaster,
  onSearch,
  onFetchMeaning,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onChangeMeaning,
  onChangeExample,
}: {
  item: MyVocabularyItem;
  expanded: boolean;
  editing: boolean;
  fetching: boolean;
  editMeaning: string;
  editExample: string;
  onToggle: () => void;
  onPlay: () => void;
  onMaster: () => void;
  onSearch: () => void;
  onFetchMeaning: () => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onChangeMeaning: (t: string) => void;
  onChangeExample: (t: string) => void;
}) {
  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.cardHeader} onPress={onToggle} activeOpacity={0.7}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.word}>{item.word}</Text>
          {item.reading ? <Text style={styles.reading}>{item.reading}</Text> : null}
          {!item.meaning && <Text style={styles.noMeaningBadge}>要編集</Text>}
        </View>
        <View style={styles.cardHeaderRight}>
          <TouchableOpacity onPress={onPlay} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.playIcon}>🔊</Text>
          </TouchableOpacity>
          <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.cardBody}>
          {editing ? (
            <>
              <Text style={styles.editLabel}>意味</Text>
              <TextInput
                style={styles.editInput}
                value={editMeaning}
                onChangeText={onChangeMeaning}
                placeholder="e.g. to meet someone by chance"
                multiline
              />
              <Text style={styles.editLabel}>例文（任意）</Text>
              <TextInput
                style={styles.editInput}
                value={editExample}
                onChangeText={onChangeExample}
                placeholder="e.g. I ran into an old friend."
                multiline
              />
              <View style={styles.editActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={onCancelEdit}>
                  <Text style={styles.cancelBtnText}>キャンセル</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={onSaveEdit}>
                  <Text style={styles.saveBtnText}>保存</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              {item.meaning ? (
                <Text style={styles.meaning}>{item.meaning}</Text>
              ) : (
                <Text style={styles.noMeaning}>※ 意味が未登録です</Text>
              )}

              {item.example ? (
                <View style={styles.exampleBox}>
                  <Text style={styles.exampleLabel}>Example</Text>
                  <View style={styles.exampleRow}>
                    <Text style={styles.example}>{item.example}</Text>
                    <TouchableOpacity
                      onPress={() => Speech.speak(item.example, { language: 'en-US', rate: 0.8 })}
                    >
                      <Text style={styles.playIcon}>🔊</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null}

              {/* メインアクション: ワンタップで意味を自動取得 */}
              <TouchableOpacity
                style={styles.fetchBtn}
                onPress={onFetchMeaning}
                disabled={fetching}
              >
                {fetching ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.fetchBtnText}>📖 意味を取得（辞書+和訳）</Text>
                )}
              </TouchableOpacity>

              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.webSearchBtn} onPress={onSearch}>
                  <Text style={styles.webSearchBtnText}>🔍 Web検索</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.editBtn} onPress={onStartEdit}>
                  <Text style={styles.editBtnText}>✏️ 手動編集</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.masterBtn} onPress={onMaster}>
                <Text style={styles.masterBtnText}>✓ 覚えた</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </View>
  );
}

// ── スタイル ─────────────────────────────────────────────────

const styles = StyleSheet.create({
  scrollBg:         { backgroundColor: '#121212' },
  container:        { padding: 20, paddingBottom: 40 },
  count:            { color: '#888', marginBottom: 16, fontSize: 13 },
  empty:            { color: '#666', textAlign: 'center', marginTop: 20, lineHeight: 24 },

  card:             { backgroundColor: '#1e1e2e', borderRadius: 14, marginBottom: 10, overflow: 'hidden' },
  cardHeader:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
  cardHeaderLeft:   { flex: 1 },
  cardHeaderRight:  { flexDirection: 'row', alignItems: 'center', gap: 14 },
  word:             { fontSize: 18, fontWeight: 'bold', color: '#f5f5f5' },
  reading:          { fontSize: 13, color: '#7ed957', marginTop: 2 },
  playIcon:         { fontSize: 18 },
  chevron:          { color: '#666', fontSize: 14 },

  cardBody:         { paddingHorizontal: 14, paddingBottom: 14, borderTopWidth: 1, borderTopColor: '#2a2a3e' },
  meaning:          { fontSize: 16, color: '#ddd', marginTop: 10, marginBottom: 8 },
  noMeaning:        { fontSize: 13, color: '#666', fontStyle: 'italic', marginTop: 10, marginBottom: 8 },
  exampleBox:       { backgroundColor: '#1a2a1a', borderRadius: 10, padding: 12, marginBottom: 10 },
  exampleLabel:     { fontSize: 11, color: '#7ed957', marginBottom: 4 },
  exampleRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  example:          { flex: 1, fontSize: 14, color: '#bbb', fontStyle: 'italic', lineHeight: 22 },
  exampleJa:        { fontSize: 13, color: '#888', marginTop: 6 },
  source:           { fontSize: 11, color: '#555', marginBottom: 10 },
  masterBtn:        { backgroundColor: '#2e7d32', borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 8 },
  masterBtnText:    { color: '#fff', fontWeight: '600' },

  noMeaningBadge:   { fontSize: 11, color: '#ff914d', fontWeight: '600', marginTop: 2 },
  fetchBtn:         { backgroundColor: '#5856D6', borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 10 },
  fetchBtnText:     { color: '#fff', fontWeight: '600', fontSize: 14 },
  actionRow:        { flexDirection: 'row', gap: 8, marginTop: 8 },
  webSearchBtn:     { flex: 1, backgroundColor: '#2a5298', borderRadius: 8, padding: 10, alignItems: 'center' },
  webSearchBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  editBtn:          { flex: 1, backgroundColor: '#b36b00', borderRadius: 8, padding: 10, alignItems: 'center' },
  editBtnText:      { color: '#fff', fontSize: 13, fontWeight: '600' },

  editLabel:        { fontSize: 13, color: '#999', marginTop: 10, marginBottom: 4 },
  editInput:        { borderWidth: 1, borderColor: '#333', borderRadius: 8, padding: 10, fontSize: 16, minHeight: 44, marginBottom: 8, backgroundColor: '#1a1a1a', color: '#f5f5f5' },
  editActions:      { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn:        { flex: 1, borderWidth: 1, borderColor: '#555', borderRadius: 10, padding: 12, alignItems: 'center' },
  cancelBtnText:    { color: '#999' },
  saveBtn:          { flex: 1, backgroundColor: '#7ed957', borderRadius: 10, padding: 12, alignItems: 'center' },
  saveBtnText:      { color: '#111', fontWeight: '600' },
});
