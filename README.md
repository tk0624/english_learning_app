# English Learning App

英語学習Webアプリ（React Native + Expo → GitHub Pages）

**公開URL**: https://tk0624.github.io/english_learning_app/

iPhoneのSafariで上記URLを開き「ホーム画面に追加」でアプリアイコンとして使えます。

## 機能

| タブ | 機能 |
|------|------|
| 📖 テキスト分析 | 英文を貼り付けて単語抽出・音声再生・和訳取得 |
| 📒 マイ単語帳 | 抽出した単語を管理・辞書+和訳ワンタップ取得・手動編集 |
| ✅ 覚えた単語 | 覚えた単語の一覧・戻す・削除 |

### テキスト分析

- 句動詞・イディオム（約90件）を優先的にマッチ
- 不規則動詞の活用形を原形に正規化
- ストップワード（代名詞・冠詞・前置詞等）を自動除外
- 音声再生（ブラウザ標準 SpeechSynthesis API）
- 和訳取得（MyMemory API）

### マイ単語帳

- 辞書+和訳ワンタップ取得（Free Dictionary API → Wiktionary → MyMemory API）
- Web検索ボタン（Google検索で意味を確認）
- インライン手動編集（意味・例文）
- 「覚えた」ボタンで覚えた単語タブへ移動

## 技術スタック

- **React Native 0.76 + Expo 52** — Webアプリとしてビルド
- **Expo Router** — ファイルベースナビゲーション
- **react-native-web** — Web向けレンダリング
- **expo-speech（シム）** — ブラウザ標準 SpeechSynthesis API
- **Zustand + AsyncStorage** — 状態管理・localStorage永続化
- **Free Dictionary API / Wiktionary REST API** — 英英辞書検索
- **MyMemory API** — 英→日翻訳
- **GitHub Pages** — 静的ホスティング（`docs/` フォルダ）

## 開発・デプロイ

```bash
# 依存パッケージのインストール
npm install

# ローカル開発サーバー起動
npx expo start --web

# Webビルド → docs/ にコピー → デプロイ
npm run build:web
# dist/ → docs/ にコピー後、git commit & push
```

## ディレクトリ構成

```
app/
  _layout.tsx            # ルートレイアウト
  (tabs)/
    _layout.tsx          # タブバー定義（3タブ）
    index.tsx            # リダイレクト → reader
    reader.tsx           # テキスト分析
    my-words.tsx         # マイ単語帳
    mastered.tsx         # 覚えた単語

src/
  types/index.ts         # 型定義
  store/progressStore.ts # Zustand ストア
  utils/dictionaryApi.ts # 辞書・翻訳API

shims/
  expo-modules-core.js   # Web用シム
  expo-speech.js         # Web用シム（SpeechSynthesis）

docs/                    # ビルド出力（GitHub Pages）
```
