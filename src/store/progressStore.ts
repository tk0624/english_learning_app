import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserProgress, FlashcardProgress, MyVocabularyItem, TrashItem } from '@/types';

const STORAGE_KEY  = 'user_progress';
const VOCAB_KEY    = 'my_vocabulary';
const TRASH_KEY    = 'my_trash';
const HISTORY_KEY  = 'text_history';
const MAX_HISTORY  = 10;
const STATS_KEY    = 'vocab_stats';

interface VocabStats {
  totalAdded: number;
  totalMastered: number;
}

const initialStats: VocabStats = { totalAdded: 0, totalMastered: 0 };

const initialProgress: UserProgress = {
  flashcardProgress: [],
  completedListening: [],
  completedGrammar: [],
  speakingHistory: [],
  streak: 0,
  lastStudiedDate: '',
};

export interface TextHistoryItem {
  id: string;
  text: string;
  addedDate: string;
}

interface ProgressStore {
  progress: UserProgress;
  myVocabulary: MyVocabularyItem[];
  trash: TrashItem[];
  textHistory: TextHistoryItem[];
  vocabStats: VocabStats;
  load: () => Promise<void>;
  recordFlashcard: (result: FlashcardProgress) => Promise<void>;
  completeListening: (id: string) => Promise<void>;
  completeGrammar: (id: string) => Promise<void>;
  recordSpeaking: (exerciseId: string, score: number) => Promise<void>;
  // Text History
  addTextHistory: (text: string) => Promise<void>;
  removeTextHistory: (id: string) => Promise<void>;
  // My Words
  addToVocabulary: (item: MyVocabularyItem) => Promise<void>;
  updateVocabulary: (id: string, patch: Partial<MyVocabularyItem>) => Promise<void>;
  bulkImportVocabulary: (items: MyVocabularyItem[]) => Promise<number>;
  masterWord: (id: string) => Promise<void>;
  restoreFromTrash: (trashId: string) => Promise<void>;
  removeFromTrash: (trashId: string) => Promise<void>;
  purgeOldTrash: () => Promise<void>;
}

export const useProgressStore = create<ProgressStore>((set, get) => ({
  progress: initialProgress,
  myVocabulary: [],
  trash: [],
  textHistory: [],
  vocabStats: initialStats,

  load: async () => {
    const [raw, vocabRaw, trashRaw, histRaw, statsRaw] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEY),
      AsyncStorage.getItem(VOCAB_KEY),
      AsyncStorage.getItem(TRASH_KEY),
      AsyncStorage.getItem(HISTORY_KEY),
      AsyncStorage.getItem(STATS_KEY),
    ]);
    const myVocabData = vocabRaw ? (JSON.parse(vocabRaw) as MyVocabularyItem[]) : [];
    const trashData   = trashRaw ? (JSON.parse(trashRaw) as TrashItem[])        : [];
    set({
      progress:     raw ? (JSON.parse(raw) as UserProgress) : initialProgress,
      myVocabulary: myVocabData,
      trash:        trashData,
      textHistory:  histRaw ? (JSON.parse(histRaw) as TextHistoryItem[]) : [],
      vocabStats:   statsRaw ? (JSON.parse(statsRaw) as VocabStats) : {
        totalAdded:    myVocabData.length + trashData.length,
        totalMastered: trashData.length,
      },
    });
  },

  recordFlashcard: async (result) => {
    const progress = {
      ...get().progress,
      flashcardProgress: [
        ...get().progress.flashcardProgress.filter(
          (p) => p.vocabularyId !== result.vocabularyId
        ),
        result,
      ],
    };
    set({ progress });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  },

  completeListening: async (id) => {
    const ids = get().progress.completedListening;
    if (ids.includes(id)) return;
    const progress = { ...get().progress, completedListening: [...ids, id] };
    set({ progress });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  },

  completeGrammar: async (id) => {
    const ids = get().progress.completedGrammar;
    if (ids.includes(id)) return;
    const progress = { ...get().progress, completedGrammar: [...ids, id] };
    set({ progress });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  },

  recordSpeaking: async (exerciseId, score) => {
    const history = [
      ...get().progress.speakingHistory,
      { exerciseId, score, date: new Date().toISOString() },
    ];
    const progress = { ...get().progress, speakingHistory: history };
    set({ progress });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  },

  // ── Text History ────────────────────────────────────────

  addTextHistory: async (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    // 同じテキストがあれば先頭に移動
    const filtered = get().textHistory.filter((h) => h.text !== trimmed);
    const entry: TextHistoryItem = {
      id: `hist-${Date.now()}`,
      text: trimmed,
      addedDate: new Date().toISOString(),
    };
    const textHistory = [entry, ...filtered].slice(0, MAX_HISTORY);
    set({ textHistory });
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(textHistory));
  },

  removeTextHistory: async (id) => {
    const textHistory = get().textHistory.filter((h) => h.id !== id);
    set({ textHistory });
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(textHistory));
  },

  // ── My Words ────────────────────────────────────────────

  addToVocabulary: async (item) => {
    // 重複チェック（同じ単語が既に存在する場合はスキップ）
    const exists = get().myVocabulary.some(
      (v) => v.word.toLowerCase() === item.word.toLowerCase()
    );
    if (exists) return;
    const myVocabulary = [item, ...get().myVocabulary];
    const vocabStats = { ...get().vocabStats, totalAdded: get().vocabStats.totalAdded + 1 };
    set({ myVocabulary, vocabStats });
    await Promise.all([
      AsyncStorage.setItem(VOCAB_KEY, JSON.stringify(myVocabulary)),
      AsyncStorage.setItem(STATS_KEY, JSON.stringify(vocabStats)),
    ]);
  },

  updateVocabulary: async (id, patch) => {
    const myVocabulary = get().myVocabulary.map((v) =>
      v.id === id ? { ...v, ...patch } : v
    );
    set({ myVocabulary });
    await AsyncStorage.setItem(VOCAB_KEY, JSON.stringify(myVocabulary));
  },

  bulkImportVocabulary: async (items) => {
    const existing = new Set(
      get().myVocabulary.map((v) => v.word.toLowerCase())
    );
    const newItems = items.filter((i) => !existing.has(i.word.toLowerCase()));
    if (newItems.length === 0) return 0;
    const myVocabulary = [...newItems, ...get().myVocabulary];
    const prevStats = get().vocabStats;
    const vocabStats: VocabStats = {
      ...prevStats,
      totalAdded: prevStats.totalAdded + newItems.length,
    };
    set({ myVocabulary, vocabStats });
    await Promise.all([
      AsyncStorage.setItem(VOCAB_KEY, JSON.stringify(myVocabulary)),
      AsyncStorage.setItem(STATS_KEY, JSON.stringify(vocabStats)),
    ]);
    return newItems.length;
  },

  masterWord: async (id) => {
    const item = get().myVocabulary.find((v) => v.id === id);
    if (!item) return;
    const myVocabulary = get().myVocabulary.filter((v) => v.id !== id);
    const trashEntry: TrashItem = {
      id: `trash-${id}-${Date.now()}`,
      item,
      deletedDate: new Date().toISOString(),
    };
    const trash = [trashEntry, ...get().trash];
    const vocabStats = { ...get().vocabStats, totalMastered: get().vocabStats.totalMastered + 1 };
    set({ myVocabulary, trash, vocabStats });
    await Promise.all([
      AsyncStorage.setItem(VOCAB_KEY, JSON.stringify(myVocabulary)),
      AsyncStorage.setItem(TRASH_KEY, JSON.stringify(trash)),
      AsyncStorage.setItem(STATS_KEY, JSON.stringify(vocabStats)),
    ]);
  },

  restoreFromTrash: async (trashId) => {
    const trashEntry = get().trash.find((t) => t.id === trashId);
    if (!trashEntry) return;
    const trash = get().trash.filter((t) => t.id !== trashId);
    const myVocabulary = [trashEntry.item, ...get().myVocabulary];
    set({ myVocabulary, trash });
    await Promise.all([
      AsyncStorage.setItem(VOCAB_KEY, JSON.stringify(myVocabulary)),
      AsyncStorage.setItem(TRASH_KEY, JSON.stringify(trash)),
    ]);
  },

  removeFromTrash: async (trashId) => {
    const trash = get().trash.filter((t) => t.id !== trashId);
    set({ trash });
    await AsyncStorage.setItem(TRASH_KEY, JSON.stringify(trash));
  },

  purgeOldTrash: async () => {
    const threshold = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const trash = get().trash.filter(
      (t) => new Date(t.deletedDate).getTime() > threshold
    );
    if (trash.length === get().trash.length) return;
    set({ trash });
    await AsyncStorage.setItem(TRASH_KEY, JSON.stringify(trash));
  },
}));
