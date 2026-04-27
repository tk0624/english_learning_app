import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useProgressStore } from '@/store/progressStore';

// ── マイルストーン & 統計カード ──────────────────────────────

const MILESTONES_M = [10, 25, 50, 100, 200, 300, 500];

function getMilestoneInfoM(count: number): { next: number; progress: number } {
  const idx = MILESTONES_M.findIndex(m => m > count);
  if (idx === -1) {
    const next = Math.ceil((count + 1) / 100) * 100;
    const prev = Math.floor(count / 100) * 100;
    return { next, progress: prev === next ? 0 : (count - prev) / (next - prev) };
  }
  const next = MILESTONES_M[idx];
  const prev = idx > 0 ? MILESTONES_M[idx - 1] : 0;
  return { next, progress: count === 0 ? 0 : (count - prev) / (next - prev) };
}

function getBadgeColorM(count: number): string {
  if (count >= 500) return '#00bfff';
  if (count >= 200) return '#ff914d';
  if (count >= 100) return '#7ed957';
  if (count >= 50)  return '#ffd700';
  if (count >= 25)  return '#b0b0b0';
  if (count >= 10)  return '#cd7f32';
  return '#555';
}

function MasteredStatsCard({
  totalMastered, trashCount,
}: { totalMastered: number; trashCount: number }) {
  const { next, progress } = getMilestoneInfoM(totalMastered);
  const barColor  = getBadgeColorM(totalMastered);
  const fillWidth = (Math.max(0, Math.min(progress * 100, 100)).toFixed(1) + '%') as any;
  return (
    <View style={mStatsStyles.card}>
      <View style={mStatsStyles.row}>
        <View style={mStatsStyles.item}>
          <Text style={[mStatsStyles.num, { color: '#7ed957' }]}>{totalMastered}</Text>
          <Text style={mStatsStyles.lbl}>✅ 累積習得</Text>
        </View>
        <View style={mStatsStyles.sep} />
        <View style={mStatsStyles.item}>
          <Text style={mStatsStyles.num}>{trashCount}</Text>
          <Text style={mStatsStyles.lbl}>📋 保存中（30日）</Text>
        </View>
      </View>
      <View style={mStatsStyles.barBg}>
        <View style={[mStatsStyles.barFill, { width: fillWidth, backgroundColor: barColor }]} />
      </View>
      <Text style={mStatsStyles.mileTxt}>
        🎯 次の目標 {next}語 — あと {next - totalMastered}語
      </Text>
    </View>
  );
}

const mStatsStyles = StyleSheet.create({
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

export default function MasteredScreen() {
  const { trash, restoreFromTrash, removeFromTrash, purgeOldTrash, vocabStats } =
    useProgressStore();

  useEffect(() => {
    purgeOldTrash();
  }, []);

  const handleRestore = (trashId: string) => {
    restoreFromTrash(trashId);
  };

  const handleDelete = (trashId: string) => {
    removeFromTrash(trashId);
  };

  const handleDeleteAll = () => {
    if (window.confirm(`覚えた単語 ${trash.length} 件をすべて削除しますか？`)) {
      trash.forEach(({ id }) => removeFromTrash(id));
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} style={styles.scrollBg}>
      <MasteredStatsCard totalMastered={vocabStats.totalMastered} trashCount={trash.length} />

      {trash.length > 0 && (
        <TouchableOpacity style={styles.deleteAllBtn} onPress={handleDeleteAll}>
          <Text style={styles.deleteAllBtnText}>🗑 すべて削除</Text>
        </TouchableOpacity>
      )}

      {trash.length === 0 ? (
        <Text style={styles.empty}>
          マイ単語帳で「覚えた」をタップすると、ここに移動します。
        </Text>
      ) : (
        trash.map(({ id, item, deletedDate }) => {
          const expiresAt = new Date(deletedDate).getTime() + 30 * 24 * 60 * 60 * 1000;
          const daysLeft  = Math.max(0, Math.ceil((expiresAt - Date.now()) / (24 * 60 * 60 * 1000)));
          return (
            <View key={id} style={styles.card}>
              <View style={styles.cardInfo}>
                <Text style={styles.word}>{item.word}</Text>
                {item.reading ? <Text style={styles.reading}>{item.reading}</Text> : null}
                {item.meaning ? <Text style={styles.meaning} numberOfLines={2}>{item.meaning}</Text> : null}
                <Text style={styles.daysLeft}>あと {daysLeft} 日で自動削除</Text>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.restoreBtn}
                  onPress={() => handleRestore(id)}
                >
                  <Text style={styles.restoreBtnText}>↩ 戻す</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(id)}
                >
                  <Text style={styles.deleteBtnText}>✕ 削除</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollBg:     { backgroundColor: '#121212' },
  container:    { padding: 20, paddingBottom: 40 },
  count:        { color: '#888', marginBottom: 16, fontSize: 13 },
  empty:        { color: '#666', textAlign: 'center', marginTop: 40, lineHeight: 24 },

  card:         {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e2e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  cardInfo:     { flex: 1 },
  word:         { fontSize: 17, fontWeight: '600', color: '#f5f5f5' },
  reading:      { fontSize: 12, color: '#7ed957', marginTop: 2 },
  meaning:      { fontSize: 13, color: '#999', marginTop: 4 },
  daysLeft:     { fontSize: 11, color: '#555', marginTop: 4 },

  actions:      { flexDirection: 'column', gap: 8, marginLeft: 10 },
  restoreBtn:   { backgroundColor: '#2a5298', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12 },
  restoreBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  deleteBtn:    { borderWidth: 1, borderColor: '#c62828', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12 },
  deleteBtnText:  { color: '#ef5350', fontSize: 13, fontWeight: '600' },
  deleteAllBtn:   { backgroundColor: '#c62828', borderRadius: 10, padding: 12, alignItems: 'center', marginBottom: 16 },
  deleteAllBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
