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
  Platform,
  Alert,
} from 'react-native';
import * as Speech from 'expo-speech';
import { useProgressStore } from '@/store/progressStore';
import { lookupWord, translateToJa } from '@/utils/dictionaryApi';
import type { MyVocabularyItem } from '@/types';

// ── マイルストーン & 統計カード ──────────────────────────────

const MILESTONES = [10, 25, 50, 100, 200, 300, 500];

function getMilestoneInfo(count: number): { next: number; progress: number } {
  const idx = MILESTONES.findIndex(m => m > count);
  if (idx === -1) {
    const next = Math.ceil((count + 1) / 100) * 100;
    const prev = Math.floor(count / 100) * 100;
    return { next, progress: prev === next ? 0 : (count - prev) / (next - prev) };
  }
  const next = MILESTONES[idx];
  const prev = idx > 0 ? MILESTONES[idx - 1] : 0;
  return { next, progress: count === 0 ? 0 : (count - prev) / (next - prev) };
}

function getBadgeColor(count: number): string {
  if (count >= 500) return '#00bfff';
  if (count >= 200) return '#ff914d';
  if (count >= 100) return '#7ed957';
  if (count >= 50)  return '#ffd700';
  if (count >= 25)  return '#b0b0b0';
  if (count >= 10)  return '#cd7f32';
  return '#555';
}

function StatsCard({
  current, totalAdded, totalMastered,
}: { current: number; totalAdded: number; totalMastered: number }) {
  const { next, progress } = getMilestoneInfo(totalAdded);
  const barColor  = getBadgeColor(totalAdded);
  const fillWidth = (Math.max(0, Math.min(progress * 100, 100)).toFixed(1) + '%') as any;
  return (
    <View style={statsStyles.card}>
      <View style={statsStyles.row}>
        <View style={statsStyles.item}>
          <Text style={statsStyles.num}>{current}</Text>
          <Text style={statsStyles.lbl}>📚 学習中</Text>
        </View>
        <View style={statsStyles.sep} />
        <View style={statsStyles.item}>
          <Text style={statsStyles.num}>{totalAdded}</Text>
          <Text style={statsStyles.lbl}>📖 累積登録</Text>
        </View>
        <View style={statsStyles.sep} />
        <View style={statsStyles.item}>
          <Text style={[statsStyles.num, { color: '#7ed957' }]}>{totalMastered}</Text>
          <Text style={statsStyles.lbl}>✅ 累積習得</Text>
        </View>
      </View>
      <View style={statsStyles.barBg}>
        <View style={[statsStyles.barFill, { width: fillWidth, backgroundColor: barColor }]} />
      </View>
      <Text style={statsStyles.mileTxt}>
        🎯 次の目標 {next}語 — あと {next - totalAdded}語
      </Text>
    </View>
  );
}

const statsStyles = StyleSheet.create({
  card:    { backgroundColor: '#1e1e2e', borderRadius: 14, padding: 16, marginBottom: 16 },
  row:     { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  item:    { alignItems: 'center', flex: 1 },
  num:     { fontSize: 26, fontWeight: 'bold', color: '#f5f5f5' },
  lbl:     { fontSize: 11, color: '#888', marginTop: 2 },
  sep:     { width: 1, backgroundColor: '#2a2a3e', marginVertical: 4 },
  barBg:   { height: 6, backgroundColor: '#2a2a3e', borderRadius: 3, marginBottom: 8, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3 },
  mileTxt: { fontSize: 12, color: '#666', textAlign: 'center' },
});

export default function MyWordsScreen() {
  const { myVocabulary, masterWord, updateVocabulary, vocabStats, bulkImportVocabulary } =
    useProgressStore();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editMeaning, setEditMeaning] = useState('');
  const [editExample, setEditExample] = useState('');
  const [fetchingId, setFetchingId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  // ── エクスポート ───────────────────────────────────────
  const handleExport = () => {
    if (Platform.OS !== 'web') return;
    const payload = { version: 1, exportedAt: new Date().toISOString(), vocabulary: myVocabulary };
    const json  = JSON.stringify(payload, null, 2);
    const blob  = new Blob([json], { type: 'application/json' });
    const url   = URL.createObjectURL(blob);
    const a     = document.createElement('a');
    a.href      = url;
    a.download  = `vocabulary-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ── インポート ───────────────────────────────────────
  const handleImport = () => {
    if (Platform.OS !== 'web') return;
    const input = document.createElement('input');
    input.type   = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setImporting(true);
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        // フォーマットバリデーション
        const items: any[] = Array.isArray(parsed)
          ? parsed
          : Array.isArray(parsed.vocabulary) ? parsed.vocabulary : null;
        if (!items) { window.alert('ファイルの形式が正しくありません'); return; }
        const count = await bulkImportVocabulary(items);
        window.alert(`${count} 語をインポートしました。`);
      } catch {
        window.alert('インポートに失敗しました。JSONファイルを確認してください。');
      } finally {
        setImporting(false);
      }
    };
    input.click();
  };

  const handleMaster = (id: string) => {
    masterWord(id);
  };

  const playWord = (item: MyVocabularyItem) => {
    Speech.stop();
    setTimeout(() => {
      Speech.speak(item.word, { language: 'en-US', rate: 0.8 });
    }, 150);
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
      <StatsCard
        current={myVocabulary.length}
        totalAdded={vocabStats.totalAdded}
        totalMastered={vocabStats.totalMastered}
      />

      {/* バックアップ操作 */}
      <View style={styles.backupRow}>
        <TouchableOpacity style={styles.exportBtn} onPress={handleExport} disabled={myVocabulary.length === 0}>
          <Text style={styles.exportBtnText}>📥 バックアップ保存</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.importBtn} onPress={handleImport} disabled={importing}>
          {importing
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.importBtnText}>📤 バックアップ復元</Text>
          }
        </TouchableOpacity>
      </View>

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
                      onPress={() => { Speech.stop(); setTimeout(() => Speech.speak(item.example, { language: 'en-US', rate: 0.8 }), 150); }}
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

  backupRow:        { flexDirection: 'row', gap: 8, marginBottom: 16 },
  exportBtn:        { flex: 1, backgroundColor: '#2a3a2a', borderWidth: 1, borderColor: '#7ed957', borderRadius: 10, padding: 10, alignItems: 'center' },
  exportBtnText:    { color: '#7ed957', fontSize: 13, fontWeight: '600' },
  importBtn:        { flex: 1, backgroundColor: '#2a2a3e', borderWidth: 1, borderColor: '#5856D6', borderRadius: 10, padding: 10, alignItems: 'center' },
  importBtnText:    { color: '#a0a0ff', fontSize: 13, fontWeight: '600' },

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
