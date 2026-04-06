import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import type { GrammarLesson } from '@/types';

// TODO: Replace with real data source
const SAMPLE: GrammarLesson = {
  id: 'g1',
  title: '現在完了形 (Present Perfect)',
  description: '過去に起きた出来事が現在にも関係している場合に使います。',
  level: 'intermediate',
  questions: [
    {
      id: 'q1',
      question: '正しい文を選んでください。',
      options: [
        'I have seen that movie yesterday.',
        'I saw that movie yesterday.',
        'I have saw that movie yesterday.',
        'I seen that movie yesterday.',
      ],
      correctIndex: 1,
      explanation: '"yesterday" など具体的な過去時制を示す語句がある場合は過去形 (simple past) を使います。',
    },
    {
      id: 'q2',
      question: '空欄を埋めてください: "She ___ already ___ lunch."',
      options: ['has / eaten', 'have / ate', 'had / eat', 'is / eating'],
      correctIndex: 0,
      explanation: '"already" は現在完了でよく使われる副詞。主語が三人称単数なので has を使います。',
    },
  ],
};

export default function GrammarScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState(0);

  const question = SAMPLE.questions[currentIndex];

  const handleAnswer = (i: number) => {
    if (selected !== null) return;
    setSelected(i);
    if (i === question.correctIndex) setScore((s) => s + 1);
  };

  const next = () => {
    if (currentIndex + 1 >= SAMPLE.questions.length) { setFinished(true); return; }
    setCurrentIndex((n) => n + 1);
    setSelected(null);
  };

  if (finished) {
    return (
      <View style={styles.center}>
        <Text style={styles.resultTitle}>レッスン完了！</Text>
        <Text style={styles.resultScore}>{score} / {SAMPLE.questions.length} 正解</Text>
        <TouchableOpacity style={styles.btn} onPress={() => { setCurrentIndex(0); setSelected(null); setScore(0); setFinished(false); }}>
          <Text style={styles.btnText}>もう一度</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.lessonTitle}>{SAMPLE.title}</Text>
      <Text style={styles.desc}>{SAMPLE.description}</Text>
      <Text style={styles.qNum}>{currentIndex + 1} / {SAMPLE.questions.length}</Text>
      <Text style={styles.question}>{question.question}</Text>

      {question.options.map((opt, i) => {
        const isCorrect = i === question.correctIndex;
        const isSelected = selected === i;
        return (
          <TouchableOpacity
            key={i}
            style={[
              styles.option,
              selected !== null && isCorrect && styles.correct,
              selected !== null && isSelected && !isCorrect && styles.incorrect,
            ]}
            onPress={() => handleAnswer(i)}
            disabled={selected !== null}
          >
            <Text>{opt}</Text>
          </TouchableOpacity>
        );
      })}

      {selected !== null && (
        <>
          <Text style={styles.explanation}>{question.explanation}</Text>
          <TouchableOpacity style={styles.btn} onPress={next}>
            <Text style={styles.btnText}>次へ →</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  lessonTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 6 },
  desc: { color: '#555', marginBottom: 20, lineHeight: 22 },
  qNum: { color: '#999', marginBottom: 8 },
  question: { fontSize: 17, fontWeight: '600', marginBottom: 16 },
  option: { backgroundColor: '#F7F9FC', borderRadius: 10, padding: 14, marginBottom: 8 },
  correct: { backgroundColor: '#D4EDDA' },
  incorrect: { backgroundColor: '#F8D7DA' },
  explanation: { color: '#555', fontStyle: 'italic', marginTop: 12, marginBottom: 16 },
  btn: { backgroundColor: '#4A90E2', borderRadius: 12, padding: 16, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' },
  resultTitle: { fontSize: 28, fontWeight: 'bold', marginBottom: 12 },
  resultScore: { fontSize: 22, color: '#4A90E2', marginBottom: 28 },
});
