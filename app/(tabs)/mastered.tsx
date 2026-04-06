import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useProgressStore } from '@/store/progressStore';

export default function MasteredScreen() {
  const { trash, restoreFromTrash, removeFromTrash, purgeOldTrash } =
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
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>覚えた単語</Text>
      <Text style={styles.count}>{trash.length} 件</Text>

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
  container:    { padding: 20 },
  title:        { fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  count:        { color: '#999', marginBottom: 16 },
  empty:        { color: '#AAA', textAlign: 'center', marginTop: 40, lineHeight: 24 },

  card:         {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F9FC',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  cardInfo:     { flex: 1 },
  word:         { fontSize: 17, fontWeight: '600' },
  reading:      { fontSize: 12, color: '#4A90E2', marginTop: 2 },
  meaning:      { fontSize: 13, color: '#666', marginTop: 4 },
  daysLeft:     { fontSize: 11, color: '#CCC', marginTop: 4 },

  actions:      { flexDirection: 'column', gap: 8, marginLeft: 10 },
  restoreBtn:   { backgroundColor: '#4A90E2', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12 },
  restoreBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  deleteBtn:    { borderWidth: 1, borderColor: '#FF3B30', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12 },
  deleteBtnText:  { color: '#FF3B30', fontSize: 13, fontWeight: '600' },
  deleteAllBtn:   { backgroundColor: '#FF3B30', borderRadius: 10, padding: 12, alignItems: 'center', marginBottom: 16 },
  deleteAllBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
