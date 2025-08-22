# 🎮 画像挿入テストツール

格闘ゲームプロジェクト用の画像読み込み・検証ツールセットです。

## 📁 ファイル構成

```
imgtest/
├── complete-image-test.html    # メインの包括的テストページ
├── image-test.html            # シンプルな基本テストページ
├── README.md                  # このファイル
└── js/
    ├── image-tester.js        # 一般的な画像テスト用ライブラリ
    └── game-image-tester.js   # ゲーム専用テストライブラリ
```

## 🚀 使用方法

### 1. 基本テスト（推奨）
```
imgtest/complete-image-test.html
```
をブラウザで開いて、以下のテストを実行：

- **🖼️ 基本画像テスト** - すべての画像の読み込み確認
- **🎯 ゲーム互換性テスト** - 実際のゲーム環境でのテスト
- **🎨 キャンバス描画テスト** - HTML5 Canvasでの描画確認
- **📁 新規画像テスト** - 新しい画像ファイルの互換性確認

### 2. シンプルテスト
軽量で高速なテストが必要な場合：
```
imgtest/image-test.html
```

## 🧪 テスト対象画像

### Kenjiキャラクター
- Attack1.png, Attack2.png
- Death.png, Fall.png
- Idle.png, Jump.png, Run.png
- Take hit.png

### SamuraiMackキャラクター
- Attack1.png, Attack2.png
- Death.png, Fall.png
- Idle.png, Jump.png, Run.png
- Take Hit.png, Take Hit - white silhouette.png

### 背景・環境
- background.png
- shop.png

## 📊 テスト結果

### 成功指標
- ✅ 読み込み成功率 100%
- ⚡ 平均読み込み時間 < 100ms
- 🎮 ゲーム準備状況: READY

### 警告指標
- ⚠️ 画像サイズ > 1000px
- ⚠️ 読み込み時間 > 100ms
- ⚠️ 一部画像読み込み失敗

### エラー指標
- ❌ 重要画像の読み込み失敗
- ❌ キャンバス描画失敗
- ❌ ファイル形式不対応

## 🔧 カスタマイズ

### 画像パスの変更
`js/game-image-tester.js` の `GAME_IMAGES` オブジェクトを編集：

```javascript
const GAME_IMAGES = {
    background: '../img/background.png',
    // ... その他の画像パス
};
```

### テスト条件の変更
`js/image-tester.js` の設定値を調整：

```javascript
// 大きな画像の閾値（px）
const largeDimensions = successful.filter(img => img.width > 1000 || img.height > 1000);

// 遅い読み込みの閾値（ms）
const slowLoading = successful.filter(img => img.loadTime > 100);
```

## 🆘 トラブルシューティング

### 画像が読み込めない場合
1. ファイルパスが正しいか確認
2. 画像ファイルが存在するか確認
3. ファイル権限を確認
4. ブラウザのコンソールでエラーを確認

### キャンバス描画が失敗する場合
1. 画像形式がブラウザ対応か確認
2. CORS設定を確認（ローカルサーバー使用推奨）
3. 画像サイズが適切か確認

### パフォーマンスが悪い場合
1. 画像ファイルサイズを最適化
2. 画像形式をWebPなどに変更検討
3. 画像の解像度を調整

## 💡 推奨事項

- **ローカルサーバー使用**: CORSエラー回避のため
- **定期的なテスト実行**: 新しい画像追加時
- **パフォーマンス監視**: 読み込み時間の追跡
- **ファイル形式統一**: PNG形式推奨

## 🎯 ゲーム準備チェックリスト

- [ ] 全画像読み込み成功
- [ ] 重要画像（Idle, Attack1等）確認
- [ ] キャンバス描画テスト成功
- [ ] 読み込み時間が適切
- [ ] 新規画像の動作確認

---

📝 **Note**: このツールは格闘ゲームプロジェクト専用に最適化されています。他のプロジェクトで使用する場合は、画像パスや設定を適宜調整してください。
