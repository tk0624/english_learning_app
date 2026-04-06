import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { Vocabulary, ReviewResult } from '@/types';

// TODO: Replace with real data source / API
const SAMPLE: Vocabulary = {
  id: '1',
  word: 'serendipity',
  reading: '/ˌserənˈdɪpɪti/',
  meaning: '思いがけない幸運な発見',
  example: 'Finding this café was pure serendipity.',
  exampleTranslation: 'このカフェを見つけたのは全くの偶然の幸運だった。',
  level: 'advanced',
  tags: ['noun', 'abstract'],
};

export default function FlashcardScreen() {
  const [flipped, setFlipped] = useState(false);
  const card = SAMPLE; // TODO: use SRS queue from store

  return (
    <View style={styles.container}>
      <Text style={styles.progress}>1 / 20</Text>

      <TouchableOpacity
        style={styles.card}
        onPress={() => setFlipped((f) => !f)}
        activeOpacity={0.85}
      >
        {!flipped ? (
          <>
            <Text style={styles.word}>{card.word}</Text>
            <Text style={styles.reading}>{card.reading}</Text>
            <Text style={styles.hint}>タップして意味を確認</Text>
          </>
        ) : (
          <>
            <Text style={styles.meaning}>{card.meaning}</Text>
            <Text style={styles.example}>{card.example}</Text>
            <Text style={styles.exampleJa}>{card.exampleTranslation}</Text>
          </>
        )}
      </TouchableOpacity>

      {flipped && (
        <View style={styles.buttonRow}>
          {(['again', 'hard', 'good', 'easy'] as ReviewResult[]).map((r) => (
            <TouchableOpacity key={r} style={[styles.btn, styles[r]]}>
              <Text style={styles.btnText}>{r.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', padding: 24, backgroundColor: '#fff' },
  progress: { color: '#999', marginBottom: 16 },
  card: {
    width: '100%',
    minHeight: 260,
    backgroundColor: '#F7F9FC',
    borderRadius: 20,
    padding: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  word: { fontSize: 36, fontWeight: 'bold', textAlign: 'center' },
  reading: { fontSize: 18, color: '#4A90E2', marginTop: 8 },
  hint: { fontSize: 13, color: '#bbb', marginTop: 20 },
  meaning: { fontSize: 22, fontWeight: '600', textAlign: 'center' },
  example: { fontSize: 15, color: '#444', marginTop: 16, textAlign: 'center', fontStyle: 'italic' },
  exampleJa: { fontSize: 13, color: '#888', marginTop: 8, textAlign: 'center' },
  buttonRow: { flexDirection: 'row', gap: 10, marginTop: 28 },
  btn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  again: { backgroundColor: '#FF3B30' },
  hard:  { backgroundColor: '#FF9500' },
  good:  { backgroundColor: '#34C759' },
  easy:  { backgroundColor: '#007AFF' },
});
