import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import * as Speech from 'expo-speech';
import type { PronunciationExercise } from '@/types';

// TODO: Replace with real data source
const EXERCISES: PronunciationExercise[] = [
  {
    id: 'p1',
    word: 'through',
    ipa: '/θruː/',
    audioUrl: '',
    tips: [
      '「th」は舌先を上の歯の裏に軽く当てて息を出す',
      '「gh」は発音しない（サイレント）',
      '「through」= スルー（日本語の「スルー」に近いが th に注意）',
    ],
  },
  {
    id: 'p2',
    word: 'world',
    ipa: '/wɜːrld/',
    audioUrl: '',
    tips: [
      '「or」は /ɜːr/ — 口を軽く開けて "アー" と "ウー" の中間',
      '語末の "ld" はしっかり発音する',
    ],
  },
];

export default function PronunciationScreen() {
  const [index, setIndex] = useState(0);
  const exercise = EXERCISES[index];

  const playNative = () => {
    Speech.speak(exercise.word, { language: 'en-US', rate: 0.75 });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>発音練習</Text>
      <Text style={styles.counter}>{index + 1} / {EXERCISES.length}</Text>

      <View style={styles.card}>
        <Text style={styles.word}>{exercise.word}</Text>
        <Text style={styles.ipa}>{exercise.ipa}</Text>
        <TouchableOpacity style={styles.listenBtn} onPress={playNative}>
          <Text style={styles.listenBtnText}>🔊 ネイティブ音声を聴く</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.tipsTitle}>発音のポイント</Text>
      {exercise.tips.map((tip, i) => (
        <View key={i} style={styles.tip}>
          <Text style={styles.tipBullet}>•</Text>
          <Text style={styles.tipText}>{tip}</Text>
        </View>
      ))}

      <View style={styles.nav}>
        <TouchableOpacity
          style={[styles.navBtn, index === 0 && styles.disabled]}
          onPress={() => { if (index > 0) setIndex((n) => n - 1); }}
          disabled={index === 0}
        >
          <Text style={styles.navBtnText}>← 前へ</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navBtn, index === EXERCISES.length - 1 && styles.disabled]}
          onPress={() => { if (index < EXERCISES.length - 1) setIndex((n) => n + 1); }}
          disabled={index === EXERCISES.length - 1}
        >
          <Text style={styles.navBtnText}>次へ →</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  counter: { color: '#999', marginBottom: 20 },
  card: {
    backgroundColor: '#F0F4FF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    marginBottom: 24,
  },
  word: { fontSize: 40, fontWeight: 'bold' },
  ipa: { fontSize: 22, color: '#4A90E2', marginTop: 8, marginBottom: 16 },
  listenBtn: { backgroundColor: '#4A90E2', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 20 },
  listenBtnText: { color: '#fff', fontWeight: '600' },
  tipsTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  tip: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  tipBullet: { color: '#4A90E2', fontSize: 18, lineHeight: 22 },
  tipText: { flex: 1, fontSize: 15, color: '#333', lineHeight: 22 },
  nav: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 32 },
  navBtn: { backgroundColor: '#4A90E2', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24 },
  navBtnText: { color: '#fff', fontWeight: '600' },
  disabled: { backgroundColor: '#ccc' },
});
