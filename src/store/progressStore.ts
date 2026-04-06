import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserProgress, FlashcardProgress, MyVocabularyItem, TrashItem } from '@/types';

const STORAGE_KEY = 'user_progress';
const VOCAB_KEY   = 'my_vocabulary';
const TRASH_KEY   = 'my_trash';

const initialProgress: UserProgress = {
  flashcardProgress: [],
  completedListening: [],
  completedGrammar: [],
  speakingHistory: [],
  streak: 0,
  lastStudiedDate: '',
};

interface ProgressStore {
  progress: UserProgress;
  myVocabulary: MyVocabularyItem[];
  trash: TrashItem[];
  load: () => Promise<void>;
  recordFlashcard: (result: FlashcardProgress) => Promise<void>;
  completeListening: (id: string) => Promise<void>;
  completeGrammar: (id: string) => Promise<void>;
  recordSpeaking: (exerciseId: string, score: number) => Promise<void>;
  // My Words
  addToVocabulary: (item: MyVocabularyItem) => Promise<void>;
  updateVocabulary: (id: string, patch: Partial<MyVocabularyItem>) => Promise<void>;
  masterWord: (id: string) => Promise<void>;
  restoreFromTrash: (trashId: string) => Promise<void>;
  removeFromTrash: (trashId: string) => Promise<void>;
  purgeOldTrash: () => Promise<void>;
}

export const useProgressStore = create<ProgressStore>((set, get) => ({
  progress: initialProgress,
  myVocabulary: [],
  trash: [],

  load: async () => {
    const [raw, vocabRaw, trashRaw] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEY),
      AsyncStorage.getItem(VOCAB_KEY),
      AsyncStorage.getItem(TRASH_KEY),
    ]);
    set({
      progress:     raw      ? (JSON.parse(raw)      as UserProgress)       : initialProgress,
      myVocabulary: vocabRaw ? (JSON.parse(vocabRaw) as MyVocabularyItem[]) : [],
      trash:        trashRaw ? (JSON.parse(trashRaw) as TrashItem[])        : [],
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

  // ── My Words ────────────────────────────────────────────

  addToVocabulary: async (item) => {
    // 重複チェック（同じ単語が既に存在する場合はスキップ）
    const exists = get().myVocabulary.some(
      (v) => v.word.toLowerCase() === item.word.toLowerCase()
    );
    if (exists) return;
    const myVocabulary = [...get().myVocabulary, item];
    set({ myVocabulary });
    await AsyncStorage.setItem(VOCAB_KEY, JSON.stringify(myVocabulary));
  },

  updateVocabulary: async (id, patch) => {
    const myVocabulary = get().myVocabulary.map((v) =>
      v.id === id ? { ...v, ...patch } : v
    );
    set({ myVocabulary });
    await AsyncStorage.setItem(VOCAB_KEY, JSON.stringify(myVocabulary));
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
    const trash = [...get().trash, trashEntry];
    set({ myVocabulary, trash });
    await Promise.all([
      AsyncStorage.setItem(VOCAB_KEY, JSON.stringify(myVocabulary)),
      AsyncStorage.setItem(TRASH_KEY, JSON.stringify(trash)),
    ]);
  },

  restoreFromTrash: async (trashId) => {
    const trashEntry = get().trash.find((t) => t.id === trashId);
    if (!trashEntry) return;
    const trash = get().trash.filter((t) => t.id !== trashId);
    const myVocabulary = [...get().myVocabulary, trashEntry.item];
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
