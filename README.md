# English Learning App

iPhone向け英語学習アプリ（React Native + Expo）

## 機能

| 画面 | 機能 |
|------|------|
| 🏠 ホーム | 学習状況サマリ・連続学習日数 |
| 📒 単語帳 | SRS（間隔反復）フラッシュカード |
| 🎧 リスニング | 音声再生・書き取りクイズ |
| 🎙 スピーキング | 録音→採点（キーワードチェック） |
| 📚 文法 | 文法問題・解説 |
| 🔊 発音 | IPA表示・ネイティブ音声・発音ヒント |

## 技術スタック

- **React Native 0.76 + Expo 52**（Windowsで開発可能）
- **Expo Router** — ファイルベースナビゲーション
- **expo-av** — 音声再生・録音
- **expo-speech** — TTS（Text-to-Speech）
- **Zustand** — 状態管理
- **AsyncStorage** — ローカル学習進捗の永続化
- **EAS Build** — Macなしで iOS/Android バイナリをクラウドビルド

## セットアップ

```bash
# 依存パッケージのインストール
npm install

# 開発サーバー起動（Expo Go アプリで iPhone 実機確認可）
npm start

# iOS ビルド（EAS — クラウドビルド、Mac不要）
npm run build:ios
```

### 事前準備

1. [Expo アカウント作成](https://expo.dev)
2. `app.json` の `bundleIdentifier` と `eas.extra.projectId` を更新
3. iPhone に **Expo Go** アプリをインストール（開発時の実機テスト用）

## ディレクトリ構成

```
app/
  _layout.tsx          # ルートレイアウト
  (tabs)/
    _layout.tsx        # タブバー定義
    index.tsx          # ホーム画面
    flashcard.tsx      # フラッシュカード
    listening.tsx      # リスニング
    speaking.tsx       # スピーキング
    grammar.tsx        # 文法
    pronunciation.tsx  # 発音

src/
  types/index.ts       # 型定義
  store/
    progressStore.ts   # Zustand 学習進捗ストア

assets/
  images/              # アイコン・スプラッシュ
  sounds/              # 音声ファイル（TODO）
```

## TODO（今後の実装予定）

- [ ] 単語データベース（CSV / JSON → AsyncStorage）
- [ ] SRS アルゴリズム（間隔反復スケジューリング）
- [ ] 音声認識 API 連携（スピーキング採点）
- [ ] 音声ファイルの追加・管理
- [ ] ユーザー認証・クラウド同期
- [ ] 通知（毎日のリマインダー）
