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

/* ================================================================
 *  CEFR B2+ 語彙抽出アルゴリズム
 * ================================================================
 *  方針:
 *  1. A1–B1 レベルの基本語約800語をストップワードとして除外
 *  2. 句動詞・コロケーション・イディオムを最長一致で優先抽出
 *  3. 不規則活用→原形マッピング + 接尾辞ベースレンマタイズ
 *  4. 残った語のうち B2+ と推定される語のみを返す
 * ================================================================ */

/** 句動詞・イディオム・コロケーション（小文字） */
const PHRASES = new Set([
  // ── 句動詞 ──
  'look for','look up','look after','look forward to','look into','look out',
  'look back','look down on','look up to','look through',
  'give up','give in','give out','give away','give back','give off','give rise to',
  'take off','take on','take over','take up','take out','take back',
  'take part in','take care of','take place','take into account','take advantage of',
  'take for granted','take effect',
  'get up','get out','get over','get along','get back','get on','get off',
  'get rid of','get used to','get in touch','get away with','get through',
  'get hold of','get around to',
  'put off','put on','put out','put up with','put down','put away',
  'put forward','put aside','put into practice',
  'turn on','turn off','turn up','turn down','turn out','turn into',
  'turn around','turn over',
  'come up','come across','come back','come out','come in','come over',
  'come up with','come down with','come to terms with','come into effect',
  'come to grips with',
  'run out','run out of','run into','run away','run over','run through',
  'go on','go out','go back','go over','go through','go ahead','go off',
  'go along with','go for','go without','go against',
  'set up','set out','set off','set aside','set about',
  'pick up','pick out','pick up on',
  'stand out','stand up','stand by','stand for','stand in for',
  'break up','break down','break out','break into','break off','break through',
  'bring up','bring about','bring out','bring back','bring in','bring forward',
  'bring to light',
  'carry on','carry out','carry over','carry through',
  'cut off','cut down','cut out','cut back on','cut short',
  'fill in','fill out','fill up',
  'find out','find out about',
  'pay off','pay back','pay for',
  'work out','work on','work for','work through',
  'make up','make out','make up for','make sure','make sense',
  'make do with','make use of','make a point of',
  'keep up','keep on','keep in touch','keep up with','keep track of',
  'keep in mind',
  'hold on','hold up','hold back','hold out','hold accountable',
  'let down','let in','let out','let go of','let alone',
  'catch up','end up','grow up','show up','sign up','sum up',
  'deal with','agree with','argue with','talk about','think about',
  'wait for','care about','hear about','worry about',
  'figure out','point out','rule out','sort out','spell out',
  'lay off','lay out','lay down',
  'back up','back down','back off',
  'call off','call for','call on','call upon',
  'live up to','boil down to','narrow down',
  'phase out','opt out','opt in','stem from',
  'account for','allow for','cater to','comply with','consist of',
  'dispose of','embark on','engage in','impose on','indulge in',
  'interfere with','reflect on','refrain from','rely on','resort to',
  'result in','result from','speculate about','subscribe to',
  'abide by','adhere to','amount to','attribute to',
  'compensate for','conform to','contribute to','correspond to',
  'derive from','deviate from','distinguish from',
  'elaborate on','lapse into','pertain to','preside over',
  'prevail upon','refrain from','succumb to','tamper with',
  // ── イディオム・定型表現 ──
  'as well as','as soon as','as long as','as far as',
  'in spite of','in order to','in addition to','in terms of','in charge of',
  'in accordance with','in place of','in light of','in the wake of',
  'in favor of','in conjunction with','in the midst of',
  'on behalf of','on account of','on the other hand','on the grounds that',
  'on the verge of','on the whole',
  'due to','owing to','according to','thanks to',
  'with regard to','with respect to','regardless of',
  'by means of','by virtue of','by and large',
  'for the sake of','for the most part','for the time being',
  'at the expense of','at stake','at any rate',
  'to a certain extent','to some degree','to that end',
  'a great deal of','a wide range of','a matter of',
  // ── 接続表現・ディスコースマーカー ──
  'as a result','as a consequence','as a matter of fact',
  'on the contrary','in contrast','by contrast',
  'in other words','that is to say','needless to say',
  'all in all','above all','after all','first and foremost',
  'not only but also','whether or not','insofar as','inasmuch as',
  'provided that','on condition that','given that',
  'so as to','in such a way that',
]);

/** 不規則動詞 → 原形マッピング */
const IRREGULAR: Record<string, string> = {
  ran:'run', went:'go', gone:'go',
  got:'get', gotten:'get',
  gave:'give', given:'give',
  took:'take', taken:'take',
  came:'come',
  made:'make',
  caught:'catch',
  kept:'keep',
  held:'hold',
  broke:'break', broken:'break',
  brought:'bring',
  stood:'stand',
  thought:'think',
  told:'tell',
  found:'find',
  knew:'know', known:'know',
  saw:'see', seen:'see',
  left:'leave',
  felt:'feel',
  began:'begin', begun:'begin',
  wrote:'write', written:'write',
  spoke:'speak', spoken:'speak',
  chose:'choose', chosen:'choose',
  drove:'drive', driven:'drive',
  grew:'grow', grown:'grow',
  drew:'draw', drawn:'draw',
  threw:'throw', thrown:'throw',
  wore:'wear', worn:'wear',
  rose:'rise', risen:'rise',
  fell:'fall', fallen:'fall',
  shook:'shake', shaken:'shake',
  froze:'freeze', frozen:'freeze',
  lay:'lie', lain:'lie',
  led:'lead',
  meant:'mean',
  spent:'spend',
  built:'build',
  sent:'send',
  paid:'pay',
  dealt:'deal',
  sought:'seek',
  taught:'teach',
  lost:'lose',
  met:'meet',
  set:'set',
  bound:'bind',
  won:'win',
  hung:'hang',
  struck:'strike', stricken:'strike',
  woke:'wake', woken:'wake',
  bore:'bear', borne:'bear',
  swore:'swear', sworn:'swear',
  tore:'tear', torn:'tear',
  underwent:'undergo', undergone:'undergo',
  withdrew:'withdraw', withdrawn:'withdraw',
  arose:'arise', arisen:'arise',
  overcame:'overcome',
  undertook:'undertake', undertaken:'undertake',
  forbade:'forbid', forbidden:'forbid',
  forgave:'forgive', forgiven:'forgive',
  foresaw:'foresee', foreseen:'foresee',
  overlooked:'overlook',
  ended:'end', worked:'work', looked:'look',
  turned:'turn', picked:'pick',
  carried:'carry', filled:'fill',
};

/** 接尾辞ベースのレンマタイズ（基本的な活用を原形に戻す） */
function lemmatize(word: string): string {
  if (IRREGULAR[word]) return IRREGULAR[word];
  // -ies → -y  (e.g. studies → study)
  if (word.endsWith('ies') && word.length > 4) return word.slice(0, -3) + 'y';
  // -ied → -y  (e.g. studied → study)
  if (word.endsWith('ied') && word.length > 4) return word.slice(0, -3) + 'y';
  // -ying → -y is unlikely needed
  // -ness → remove (e.g. happiness → happi → skip, too lossy — let it through)
  // -ing (running→run, making→make, getting→get)
  if (word.endsWith('ing') && word.length > 4) {
    const stem = word.slice(0, -3);
    // doubling: running → run
    if (stem.length >= 3 && stem[stem.length - 1] === stem[stem.length - 2]) {
      return stem.slice(0, -1);
    }
    // making → make
    if (!stem.endsWith('e') && BASIC_WORDS.has(stem + 'e')) return stem + 'e';
    if (BASIC_WORDS.has(stem)) return stem;
    return stem;
  }
  // -ed (played→play, stopped→stop, managed→manage)
  if (word.endsWith('ed') && word.length > 3) {
    const noEd = word.slice(0, -2);
    if (noEd.length >= 3 && noEd[noEd.length - 1] === noEd[noEd.length - 2]) {
      return noEd.slice(0, -1);
    }
    if (word.endsWith('eed')) return word.slice(0, -2); // agreed→agree
    if (!noEd.endsWith('e') && BASIC_WORDS.has(noEd + 'e')) return noEd + 'e';
    if (BASIC_WORDS.has(noEd)) return noEd;
    // -d removed (e.g. managed → manage)
    const noD = word.slice(0, -1);
    if (BASIC_WORDS.has(noD)) return noD;
    return noEd;
  }
  // -es (watches→watch, goes→go)
  if (word.endsWith('es') && word.length > 3) {
    if (word.endsWith('shes') || word.endsWith('ches') || word.endsWith('xes') || word.endsWith('zes') || word.endsWith('sses')) {
      return word.slice(0, -2);
    }
  }
  // -s (cats→cat)
  if (word.endsWith('s') && !word.endsWith('ss') && word.length > 3) {
    return word.slice(0, -1);
  }
  // -ly → base adjective (carefully→careful)
  if (word.endsWith('ly') && word.length > 4) {
    const base = word.slice(0, -2);
    if (BASIC_WORDS.has(base)) return base;
    return word; // keep adverb if base is not basic
  }
  return word;
}

/**
 * A1–B1 基本語（CEFR B1 以下）。
 * これらの語は学習不要とみなして除外する。
 * 機能語（代名詞・冠詞・前置詞・接続詞等）+ 最頻出の内容語を含む。
 */
const BASIC_WORDS = new Set([
  // ── 機能語 ──
  'i','me','my','myself','we','our','ours','ourselves',
  'you','your','yours','yourself','yourselves',
  'he','him','his','himself','she','her','hers','herself',
  'it','its','itself','they','them','their','theirs','themselves',
  'a','an','the',
  'am','is','are','was','were','be','been','being',
  'have','has','had','do','does','did',
  'will','would','shall','should','may','might','can','could','must',
  'at','by','for','in','of','on','to','as',
  'into','from','with','about','over','under','through',
  'up','down','out','off','between','among','around','along',
  'before','after','during','until','within','without','above','below',
  'behind','beside','beyond','toward','towards','upon','against','across',
  'and','but','or','nor','so','yet',
  'if','when','while','although','because','since','though',
  'this','that','these','those',
  'what','which','who','whom','whose','how','why','where',
  'not','no','yes','very','just','also','too','only',
  'now','then','here','there','where',
  'today','yesterday','tomorrow',
  'always','never','often','sometimes','usually','already','still','even',
  'all','both','each','every','some','any','such','no',
  'more','most','other','few','many','much',
  'one','two','three','four','five','six','seven','eight','nine','ten',
  'first','second','third','last','next',
  'than','well','quite','rather','enough','almost','really','again',
  'same','own','another','either','neither','else',
  // ── A1–B1 基本内容語（名詞）──
  'time','year','people','way','day','man','woman','child','children','world',
  'life','hand','part','place','case','week','company','system','program',
  'question','work','government','number','night','point','home','water',
  'room','mother','father','parent','area','money','story','fact','month',
  'lot','right','study','book','eye','job','word','business','issue','side',
  'kind','head','house','service','friend','family','body','hour','game',
  'line','end','member','result','level','name','office','door','health',
  'person','art','war','history','party','morning','reason','change',
  'research','girl','boy','food','car','city','state','country','school',
  'class','group','student','table','course','age','policy','music',
  'market','love','color','colour','dog','cat','baby','teacher','doctor',
  'thing','face','power','idea','team','center','centre','church',
  'road','street','picture','garden','sun','rain','air','bed','shop','store',
  'phone','letter','movie','film','sport','news','paper','cup','box',
  'window','bag','chair','test','animal','tree','flower','season','clothes',
  'price','space','rest','brain','earth','sky','sea','river','mountain',
  // ── A1–B1 基本内容語（動詞）──
  'go','come','get','make','know','think','take','see','want','look',
  'give','use','find','tell','ask','work','seem','feel','try','leave',
  'call','need','become','keep','let','begin','show','hear','play',
  'run','move','live','believe','happen','include','allow','meet','lead',
  'stand','pay','bring','hold','write','provide','sit','lose','turn',
  'read','learn','stop','watch','follow','start','speak','open','close',
  'grow','walk','offer','remember','love','consider','appear','buy','wait',
  'die','send','expect','build','stay','fall','cut','reach',
  'kill','remain','suggest','raise','pass','sell','decide','return',
  'explain','hope','develop','carry','break','receive','agree','support',
  'matter','pull','push','eat','drink','sleep','drive','fly','swim',
  'pick','sing','dance','draw','wear','win','help','put','talk',
  'clean','cook','finish','fill','spend','catch','choose','touch','add',
  'change','move','sit','run','set','end',
  // ── A1–B1 基本内容語（形容詞）──
  'good','new','old','great','big','small','long','short','high','low',
  'young','large','important','little','different','local','social','free',
  'right','left','real','best','better','sure','possible','late','early',
  'hard','special','easy','clear','recent','certain','personal','open',
  'whole','main','public','available','full','able','common','simple',
  'happy','sad','nice','bad','wrong','hot','cold','warm','cool','dry',
  'wet','fast','slow','strong','weak','rich','poor','dark','light','safe',
  'dangerous','beautiful','pretty','ugly','clean','dirty','heavy','soft',
  'hard','true','false','ready','busy','tired','hungry','angry','sorry',
  'afraid','interesting','boring','cheap','expensive','famous','popular',
  'quiet','loud','thick','thin','wide','narrow','deep','flat','smooth',
  'rough','sharp','sweet','sour','bitter','fresh','raw',
  // ── A1–B1 基本内容語（副詞）──
  'away','back','ago','off','however','together','please',
  'else','far','near','perhaps','probably','maybe',
  // ── 数量・頻度 ──
  'lot','every','once','twice','everything','everyone','nothing','nobody',
  'something','someone','anything','anyone','half','double',
]);

/** 最大フレーズ長（単語数） */
const MAX_PHRASE_LEN = 5;

/** 英文からB2+レベルの単語・句動詞・イディオムを抽出 */
function extractWords(text: string): string[] {
  const tokens = text.toLowerCase().match(/\b[a-z]+(?:'[a-z]+)?\b/g) ?? [];

  const results: string[] = [];
  const usedIndexes = new Set<number>();

  // Pass 1: 最長一致でフレーズを優先抽出
  for (let i = 0; i < tokens.length; i++) {
    if (usedIndexes.has(i)) continue;
    let matched = false;
    for (let len = MAX_PHRASE_LEN; len >= 2; len--) {
      if (i + len > tokens.length) continue;
      // 全ての単語位置を正規化して結合
      const phraseTokens = tokens.slice(i, i + len).map((t) => IRREGULAR[t] ?? t);
      const phrase = phraseTokens.join(' ');
      if (PHRASES.has(phrase)) {
        const idxs = Array.from({ length: len }, (_, k) => i + k);
        if (!idxs.some((idx) => usedIndexes.has(idx))) {
          results.push(phrase);
          idxs.forEach((idx) => usedIndexes.add(idx));
          matched = true;
          break;
        }
      }
    }

    // Pass 2: 単語レベルのフィルタ
    if (!matched && !usedIndexes.has(i)) {
      const raw = tokens[i];
      if (raw.length < 2) continue;
      // レンマタイズ
      const lemma = lemmatize(raw);
      // 基本語はスキップ
      if (BASIC_WORDS.has(raw) || BASIC_WORDS.has(lemma)) continue;
      // 数字混じりや 's などもスキップ
      if (/^\d+$/.test(raw) || raw === "'s" || raw === "'t" || raw === "'re" || raw === "'ve" || raw === "'ll" || raw === "'d") continue;
      results.push(lemma);
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

  /** 和訳を取得（500文字超は文単位で分割して送信） */
  const fetchTranslation = async (text: string) => {
    setIsTranslating(true);
    try {
      const LIMIT = 480;
      if (text.length <= LIMIT) {
        const res = await fetch(
          `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|ja`
        );
        const data = await res.json();
        setTranslation(data?.responseData?.translatedText ?? '翻訳に失敗しました');
      } else {
        // 文単位で分割してチャンクにまとめる
        const sentences = text.match(/[^.!?]+[.!?]+\s*/g) ?? [text];
        const chunks: string[] = [];
        let current = '';
        for (const s of sentences) {
          if ((current + s).length > LIMIT && current) {
            chunks.push(current.trim());
            current = s;
          } else {
            current += s;
          }
        }
        if (current.trim()) chunks.push(current.trim());

        const results: string[] = [];
        for (const chunk of chunks) {
          const res = await fetch(
            `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=en|ja`
          );
          const data = await res.json();
          results.push(data?.responseData?.translatedText ?? '');
        }
        setTranslation(results.join('') || '翻訳に失敗しました');
      }
    } catch {
      setTranslation('翻訳に失敗しました');
    } finally {
      setIsTranslating(false);
    }
  };

  const analyze = () => {
    if (!inputText.trim()) return;
    // 日本語（ひらがな・カタカナ・漢字・全角記号）が出現したらそこ以降を切り捨て
    const jpMatch = inputText.search(/[\u3000-\u30FF\u4E00-\u9FFF\uFF00-\uFFEF]/);
    const cleanText = jpMatch >= 0 ? inputText.slice(0, jpMatch).trim() : inputText.trim();
    if (!cleanText) return;
    setInputText(cleanText);
    setWords(extractWords(cleanText));
    setUnknownWords(new Set());
    setTranslation('');
    setIsAnalyzed(true);
    addTextHistory(cleanText);
    setShowHistory(false);
    // 和訳を自動取得
    fetchTranslation(cleanText);
  };

  const clearInput = () => {
    setInputText('');
    setIsAnalyzed(false);
    setWords([]);
    setUnknownWords(new Set());
    setTranslation('');
  };

  const loadHistory = (text: string) => {
    setInputText(text);
    setIsAnalyzed(false);
    setTranslation('');
    setShowHistory(false);
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
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.textInput}
          multiline
          placeholder="英文をここに貼り付けてください..."
          placeholderTextColor="#666"
          value={inputText}
          onChangeText={(t) => { setInputText(t); setIsAnalyzed(false); }}
          textAlignVertical="top"
        />
        {inputText.length > 0 && (
          <TouchableOpacity style={styles.clearBtn} onPress={clearInput}>
            <Text style={styles.clearBtnText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

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
            {isTranslating ? (
              <View style={styles.placeholderBox}>
                <ActivityIndicator color="#7ed957" />
                <Text style={[styles.placeholderText, { marginTop: 8 }]}>翻訳中...</Text>
              </View>
            ) : translation !== '' ? (
              <View style={styles.placeholderBox}>
                <Text style={styles.placeholderText}>{translation}</Text>
              </View>
            ) : null}
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
  inputWrapper:     { position: 'relative', marginBottom: 12 },
  textInput:        {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    padding: 14,
    paddingRight: 40,
    fontSize: 15,
    minHeight: 140,
    backgroundColor: '#1e1e1e',
    color: '#f5f5f5',
  },
  clearBtn:         {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnText:     { color: '#ccc', fontSize: 13, fontWeight: 'bold' },
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
