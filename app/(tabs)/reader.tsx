import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import * as Speech from 'expo-speech';
import { useProgressStore } from '@/store/progressStore';
import { lookupWord } from '@/utils/dictionaryApi';
import type { MyVocabularyItem } from '@/types';

/** よく使われる句動詞・イディオムのパターン（小文字） */
const PHRASE_VERBS = new Set([
  'look for', 'look up', 'look after', 'look forward to', 'look into', 'look out',
  'look back', 'look down on', 'look up to',
  'give up', 'give in', 'give out', 'give away', 'give back',
  'take off', 'take on', 'take over', 'take up', 'take out', 'take back',
  'take part in', 'take care of', 'take place',
  'get up', 'get out', 'get over', 'get along', 'get back', 'get on', 'get off',
  'get rid of', 'get used to', 'get in touch',
  'put off', 'put on', 'put out', 'put up with', 'put down', 'put away',
  'turn on', 'turn off', 'turn up', 'turn down', 'turn out', 'turn into',
  'come up', 'come across', 'come back', 'come out', 'come in', 'come over',
  'come up with', 'come down with',
  'run out', 'run out of', 'run into', 'run away', 'run over',
  'go on', 'go out', 'go back', 'go over', 'go through', 'go ahead', 'go off',
  'go along with', 'go for',
  'set up', 'set out', 'set off', 'set aside',
  'pick up', 'pick out', 'pick up on',
  'stand out', 'stand up', 'stand by', 'stand for',
  'break up', 'break down', 'break out', 'break into', 'break off', 'break through',
  'bring up', 'bring about', 'bring out', 'bring back', 'bring in',
  'carry on', 'carry out', 'carry over',
  'cut off', 'cut down', 'cut out', 'cut back on',
  'fill in', 'fill out', 'fill up',
  'find out', 'find out about',
  'pay off', 'pay back', 'pay for',
  'work out', 'work on', 'work for',
  'make up', 'make out', 'make up for', 'make sure', 'make sense',
  'keep up', 'keep on', 'keep in touch', 'keep up with',
  'hold on', 'hold up', 'hold back', 'hold out',
  'let down', 'let in', 'let out', 'let go of',
  'as well as', 'as soon as', 'as long as', 'as far as',
  'in spite of', 'in order to', 'in addition to', 'in terms of', 'in charge of',
  'in accordance with', 'in place of',
  'on behalf of', 'on account of', 'on the other hand',
  'due to', 'owing to', 'according to', 'thanks to',
  'manage to', 'tend to', 'used to', 'happen to', 'fail to',
  'catch up', 'end up', 'grow up', 'show up', 'sign up', 'sum up',
  'deal with', 'agree with', 'argue with', 'talk about', 'think about',
  'wait for', 'care about', 'hear about', 'worry about',
]);

/** 不規則動詞・活用形 → 原形マッピング（句動詞マッチング用） */
const VERB_NORMALIZE: Record<string, string> = {
  'ran': 'run', 'went': 'go',
  'got': 'get', 'gotten': 'get',
  'gave': 'give', 'given': 'give',
  'took': 'take', 'taken': 'take',
  'came': 'come',
  'made': 'make',
  'caught': 'catch',
  'kept': 'keep',
  'held': 'hold',
  'broke': 'break', 'broken': 'break',
  'brought': 'bring',
  'stood': 'stand',
  'ended': 'end', 'worked': 'work', 'looked': 'look',
  'turned': 'turn', 'picked': 'pick', 'paid': 'pay',
  'carried': 'carry', 'filled': 'fill',
};

/** 学習不要な基本語（ストップワード） */
const STOP_WORDS = new Set([
  // 代名詞
  'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves',
  'you', 'your', 'yours', 'yourself', 'yourselves',
  'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself',
  'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves',
  // 冠詞
  'a', 'an', 'the',
  // be動詞・助動詞
  'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did',
  'will', 'would', 'shall', 'should', 'may', 'might', 'can', 'could', 'must',
  // 前置詞
  'at', 'by', 'for', 'in', 'of', 'on', 'to', 'as',
  'into', 'from', 'with', 'about', 'over', 'under', 'through',
  // 接続詞
  'and', 'but', 'or', 'nor', 'so', 'yet',
  'if', 'when', 'while', 'although', 'because', 'since', 'though', 'after',
  // 指示語・疑問詞
  'this', 'that', 'these', 'those',
  'what', 'which', 'who', 'whom', 'whose', 'how', 'why', 'where',
  // 副詞・時間語
  'not', 'no', 'very', 'just', 'also', 'too', 'only',
  'now', 'then', 'here', 'there',
  'today', 'yesterday', 'tomorrow',
  'always', 'never', 'often', 'sometimes', 'usually', 'already',
  // 数量詞・限定詞
  'all', 'both', 'each', 'every', 'some', 'any', 'such',
  'more', 'most', 'other', 'few', 'many', 'much',
  'one', 'two', 'three', 'first', 'second', 'last', 'next',
  'than', 'well', 'still', 'even', 'same', 'own',
]);

/** 最大何単語のフレーズを探すか */
const MAX_PHRASE_LEN = 4;

/** 英文から単語・句動詞・イディオムを抽出する */
function extractWords(text: string): string[] {
  // トークン分割（単語のみ、記号除去）
  const tokens = text.toLowerCase().match(/\b[a-z']+\b/g) ?? [];

  const results: string[] = [];
  const usedIndexes = new Set<number>();

  // フレーズ優先で検出
  for (let i = 0; i < tokens.length; i++) {
    let matched = false;
    for (let len = MAX_PHRASE_LEN; len >= 2; len--) {
      if (i + len > tokens.length) continue;
      const firstNorm = VERB_NORMALIZE[tokens[i]] ?? tokens[i];
      const phrase = [firstNorm, ...tokens.slice(i + 1, i + len)].join(' ');
      if (PHRASE_VERBS.has(phrase)) {
        // 使用済みインデックスと重複しないか確認
        const idxs = Array.from({ length: len }, (_, k) => i + k);
        if (!idxs.some((idx) => usedIndexes.has(idx))) {
          results.push(phrase);
          idxs.forEach((idx) => usedIndexes.add(idx));
          matched = true;
          break;
        }
      }
    }
    if (!matched && !usedIndexes.has(i) && tokens[i].length >= 2 && !STOP_WORDS.has(tokens[i])) {
      results.push(tokens[i]);
      usedIndexes.add(i);
    }
  }

  // 重複除去してアルファベット順
  return Array.from(new Set(results)).sort();
}

export default function ReaderScreen() {
  const [inputText, setInputText]       = useState('');
  const [isAnalyzed, setIsAnalyzed]     = useState(false);
  const [words, setWords]               = useState<string[]>([]);
  const [unknownWords, setUnknownWords] = useState<Set<string>>(new Set());
  const [isPlaying, setIsPlaying]       = useState(false);
  const [isAdding, setIsAdding]         = useState(false);
  const [translation, setTranslation]   = useState<string>('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [showHistory, setShowHistory]   = useState(false);

  const addToVocabulary = useProgressStore((s) => s.addToVocabulary);
  const textHistory     = useProgressStore((s) => s.textHistory);
  const addTextHistory  = useProgressStore((s) => s.addTextHistory);
  const removeTextHistory = useProgressStore((s) => s.removeTextHistory);

  const analyze = () => {
    if (!inputText.trim()) return;
    setWords(extractWords(inputText));
    setUnknownWords(new Set());
    setTranslation('');
    setIsAnalyzed(true);
    addTextHistory(inputText);
    setShowHistory(false);
  };

  const loadHistory = (text: string) => {
    setInputText(text);
    setIsAnalyzed(false);
    setShowHistory(false);
  };

  const translateText = async () => {
    if (!inputText.trim() || isTranslating) return;
    setIsTranslating(true);
    try {
      const res = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(inputText)}&langpair=en|ja`
      );
      const data = await res.json();
      setTranslation(data?.responseData?.translatedText ?? '翻訳に失敗しました');
    } catch {
      setTranslation('翻訳に失敗しました');
    } finally {
      setIsTranslating(false);
    }
  };

  const toggleUnknown = (word: string) => {
    setUnknownWords((prev) => {
      const next = new Set(prev);
      next.has(word) ? next.delete(word) : next.add(word);
      return next;
    });
  };

  const playText = (rate: number) => {
    if (isPlaying) {
      Speech.stop();
      setIsPlaying(false);
      return;
    }
    Speech.speak(inputText, {
      language: 'en-US',
      rate,
      onDone:  () => setIsPlaying(false),
      onError: () => setIsPlaying(false),
    });
    setIsPlaying(true);
  };

  const stopPlay = () => {
    Speech.stop();
    setIsPlaying(false);
  };

  /** 不明語を辞書 API で調べてマイ単語帳に追加 */
  const addUnknownToMyWords = async () => {
    if (unknownWords.size === 0) {
      window.alert('わからない単語にチェックを入れてください');
      return;
    }
    setIsAdding(true);
    let addedCount = 0;
    let dictFound  = 0;
    for (const word of unknownWords) {
      const dict = await lookupWord(word);
      const topDef = dict?.definitions?.[0];
      const item: MyVocabularyItem = {
        id:                 `${word}-${Date.now()}`,
        word,
        reading:            dict?.phonetic            ?? '',
        meaning:            topDef ? `(${topDef.partOfSpeech}) ${topDef.definition}` : '',
        example:            topDef?.example           ?? '',
        exampleTranslation: '',
        audioUrl:           dict?.audioUrl,
        sourceText:         inputText.slice(0, 120),
        addedDate:          new Date().toISOString(),
      };
      await addToVocabulary(item);
      addedCount++;
      if (topDef) dictFound++;
    }
    setIsAdding(false);
    setUnknownWords(new Set());
    const missCount = addedCount - dictFound;
    if (missCount > 0) {
      window.alert(`${addedCount} 件追加（${missCount} 件は辞書未発見）\nマイ単語帳で意味を追加できます`);
    } else {
      window.alert(`${addedCount} 件をマイ単語帳に追加しました`);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      style={styles.scrollBg}
    >
      {/* ── テキスト入力 ── */}
      <TextInput
        style={styles.textInput}
        multiline
        placeholder="英文をここに貼り付けてください..."
        value={inputText}
        onChangeText={(t) => { setInputText(t); setIsAnalyzed(false); }}
        textAlignVertical="top"
      />

      <TouchableOpacity style={styles.analyzeBtn} onPress={analyze}>
        <Text style={styles.analyzeBtnText}>分析する</Text>
      </TouchableOpacity>

      {/* ── 履歴 ── */}
      {textHistory.length > 0 && (
        <View style={styles.historySection}>
          <TouchableOpacity
            style={styles.historyToggle}
            onPress={() => setShowHistory(!showHistory)}
          >
            <Text style={styles.historyToggleText}>
              📋 履歴（{textHistory.length}件）{showHistory ? ' ▲' : ' ▼'}
            </Text>
          </TouchableOpacity>
          {showHistory && textHistory.map((h) => (
            <View key={h.id} style={styles.historyItem}>
              <TouchableOpacity
                style={styles.historyTextArea}
                onPress={() => loadHistory(h.text)}
              >
                <Text style={styles.historyText} numberOfLines={2}>
                  {h.text}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.historyDelete}
                onPress={() => removeTextHistory(h.id)}
              >
                <Text style={styles.historyDeleteText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {isAnalyzed && (
        <>
          {/* ── 音声読み上げ ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📢 音声読み上げ</Text>
            <View style={styles.audioRow}>
              <TouchableOpacity
                style={styles.audioBtn}
                onPress={() => playText(1.0)}
                disabled={isPlaying}
              >
                <Text style={styles.audioBtnText}>▶ ネイティブ速度</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.audioBtn, styles.audioBtnSlow]}
                onPress={() => playText(0.6)}
                disabled={isPlaying}
              >
                <Text style={styles.audioBtnText}>▶ ゆっくり</Text>
              </TouchableOpacity>
            </View>
            {isPlaying && (
              <TouchableOpacity style={styles.stopBtn} onPress={stopPlay}>
                <Text style={styles.stopBtnText}>⏹ 停止</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ── 和訳 ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🇯🇵 和訳</Text>
            <TouchableOpacity
              style={[styles.audioBtn, { marginBottom: 10 }]}
              onPress={translateText}
              disabled={isTranslating}
            >
              <Text style={styles.audioBtnText}>
                {isTranslating ? '翻訳中...' : '和訳を表示'}
              </Text>
            </TouchableOpacity>
            {translation !== '' && (
              <View style={styles.placeholderBox}>
                <Text style={styles.placeholderText}>{translation}</Text>
              </View>
            )}
          </View>

          {/* ── 単語・熟語リスト ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              📝 単語一覧 — わからない語をタップしてチェック
            </Text>
            <View style={styles.wordChips}>
              {words.map((word) => {
                const checked = unknownWords.has(word);
                return (
                  <TouchableOpacity
                    key={word}
                    style={[styles.chip, checked && styles.chipChecked]}
                    onPress={() => toggleUnknown(word)}
                  >
                    {checked && <Text style={styles.chipCheck}>✓ </Text>}
                    <Text style={[styles.chipText, checked && styles.chipTextChecked]}>
                      {word}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ── マイ単語帳に追加 ── */}
          {unknownWords.size > 0 && (
            <TouchableOpacity
              style={styles.addBtn}
              onPress={addUnknownToMyWords}
              disabled={isAdding}
            >
              {isAdding ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.addBtnText}>
                  マイ単語帳に追加（{unknownWords.size} 件）→
                </Text>
              )}
            </TouchableOpacity>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollBg:         { backgroundColor: '#121212' },
  container:        { padding: 20, paddingBottom: 40 },
  textInput:        {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    minHeight: 140,
    backgroundColor: '#1e1e1e',
    color: '#f5f5f5',
    marginBottom: 12,
  },
  analyzeBtn:       { backgroundColor: '#7ed957', borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 12 },
  analyzeBtnText:   { color: '#111', fontWeight: 'bold', fontSize: 16 },
  historySection:   { marginBottom: 24 },
  historyToggle:    { paddingVertical: 8 },
  historyToggleText:{ color: '#888', fontSize: 13, fontWeight: '600' },
  historyItem:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e1e2e', borderRadius: 10, padding: 10, marginTop: 6 },
  historyTextArea:  { flex: 1 },
  historyText:      { color: '#bbb', fontSize: 13, lineHeight: 18 },
  historyDelete:    { marginLeft: 8, padding: 4 },
  historyDeleteText:{ color: '#666', fontSize: 14 },
  section:          { marginBottom: 24 },
  sectionTitle:     { fontSize: 15, fontWeight: '600', marginBottom: 10, color: '#ccc' },
  audioRow:         { flexDirection: 'row', gap: 10, marginBottom: 8 },
  audioBtn:         { flex: 1, backgroundColor: '#2a5298', borderRadius: 10, padding: 13, alignItems: 'center' },
  audioBtnSlow:     { backgroundColor: '#2e7d32' },
  audioBtnText:     { color: '#fff', fontWeight: '600', fontSize: 14 },
  stopBtn:          { backgroundColor: '#c62828', borderRadius: 10, padding: 12, alignItems: 'center' },
  stopBtnText:      { color: '#fff', fontWeight: '600' },
  placeholderBox:   { backgroundColor: '#1e1e1e', borderRadius: 10, padding: 14 },
  placeholderText:  { color: '#aaa', fontStyle: 'italic', lineHeight: 22 },
  wordChips:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:             {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e2e',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#333',
  },
  chipChecked:      { backgroundColor: '#3e2a00', borderColor: '#ff914d' },
  chipCheck:        { color: '#ff914d', fontWeight: 'bold' },
  chipText:         { fontSize: 14, color: '#ddd' },
  chipTextChecked:  { color: '#ff914d', fontWeight: '600' },
  addBtn:           { backgroundColor: '#ff914d', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 20 },
  addBtnText:       { color: '#111', fontWeight: 'bold', fontSize: 16 },
});
