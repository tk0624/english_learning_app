// Vocabulary / Flashcard types
export interface Vocabulary {
  id: string;
  word: string;
  reading: string;         // 読み仮名 or IPA
  meaning: string;         // 日本語意味
  example: string;         // 例文
  exampleTranslation: string;
  audioUrl?: string;       // 音声ファイル URI
  level: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
}

// Flashcard review result
export type ReviewResult = 'again' | 'hard' | 'good' | 'easy';

export interface FlashcardProgress {
  vocabularyId: string;
  interval: number;        // days
  easeFactor: number;
  dueDate: string;         // ISO date
  repetitions: number;
}

// Listening exercise
export interface ListeningExercise {
  id: string;
  title: string;
  audioUrl: string;
  transcript: string;
  questions: QuizQuestion[];
  level: 'beginner' | 'intermediate' | 'advanced';
}

// Speaking exercise
export interface SpeakingExercise {
  id: string;
  prompt: string;          // 日本語のお題
  sampleAnswer: string;    // 模範解答
  keywords: string[];      // 含めるべきキーワード
}

// Grammar question
export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface GrammarLesson {
  id: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
  level: 'beginner' | 'intermediate' | 'advanced';
}

// Pronunciation exercise
export interface PronunciationExercise {
  id: string;
  word: string;
  ipa: string;              // 発音記号
  audioUrl: string;
  tips: string[];
}

// My vocabulary item (added from text reader)
export interface MyVocabularyItem {
  id: string;
  word: string;
  reading: string;            // IPA
  meaning: string;            // 日本語意味（翻訳API接続後に自動入力）
  example: string;            // 英語例文
  exampleTranslation: string; // 例文の和訳
  audioUrl?: string;          // 辞書音声 URI
  sourceText?: string;        // 抽出元テキスト（先頭100文字）
  addedDate: string;          // ISO date
}

// Trash item — 30日後に自動削除
export interface TrashItem {
  id: string;
  item: MyVocabularyItem;
  deletedDate: string;        // ISO date（この日から30日後に削除）
}

// User progress
export interface UserProgress {
  flashcardProgress: FlashcardProgress[];
  completedListening: string[];
  completedGrammar: string[];
  speakingHistory: { exerciseId: string; score: number; date: string }[];
  streak: number;
  lastStudiedDate: string;
}
