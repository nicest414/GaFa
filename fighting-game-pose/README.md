# Fighting Game with Pose Control - モーション対応版

ポーズ検出でコントロールする格闘ゲームです。各ポーズに対応したアニメーション枠を実装済み。

## 📋 アニメーション対応状況

### 実装済みモーション枠

#### 攻撃系ポーズ
- **PUNCH** → `punch` アニメーション (現在: Attack1.png)
- **KICK** → `kick` アニメーション (現在: Attack2.png)  
- **CROUCH_PUNCH** → `crouch_punch` アニメーション (現在: Attack1.png)
- **CROUCH_KICK** → `crouch_kick` アニメーション (現在: Attack2.png)

#### 防御系ポーズ
- **GUARD** → `guard` アニメーション (現在: Idle.png)
- **CROUCH_GUARD** → `crouch_guard` アニメーション (現在: Idle.png)

#### 移動系ポーズ
- **FORWARD** → `forward` アニメーション (現在: Run.png)
- **BACKWARD** → `backward` アニメーション (現在: Run.png)

#### 姿勢系ポーズ
- **CROUCH** → `crouch` アニメーション (現在: Idle.png)
- **STAND** → `stand` アニメーション (現在: Idle.png)

### 🎨 カスタムアニメーション追加方法

#### 1. 画像ファイルの追加
```
img/
├── samuraiMack/
│   ├── Guard.png          # ガード専用アニメーション
│   ├── Crouch.png         # しゃがみ専用アニメーション
│   ├── CrouchPunch.png    # しゃがみパンチ専用
│   └── ...
└── kenji/
    ├── Guard.png
    ├── Crouch.png
    └── ...
```

#### 2. スプライト定義の更新 (index.js)
```javascript
// プレイヤーのスプライト設定例
guard: {
  imageSrc: './img/samuraiMack/Guard.png',     // 専用画像に変更
  framesMax: 4                                 // フレーム数を調整
},
crouch: {
  imageSrc: './img/samuraiMack/Crouch.png',   // 専用画像に変更
  framesMax: 6
}
```

#### 3. 新しいアニメーション枠の追加
```javascript
// classes.js の switchSprite に新規ケース追加
case 'new_pose':
  if (this.sprites.newPose && this.image !== this.sprites.newPose.image) {
    this.image = this.sprites.newPose.image
    this.framesMax = this.sprites.newPose.framesMax
    this.framesCurrent = 0
  }
  break
```

## 使い方

### ブラウザで起動
```bash
# HTTP サーバーを起動
python -m http.server 8000
# または
npx serve .
```

ブラウザで `http://localhost:8000` にアクセス

### ポーズ制御の統合

外部のポーズ検出システムから以下の関数を呼び出してください：

```javascript
// プレイヤー1のポーズ設定
setPoseFromDetection('player1', 'PUNCH');

// プレイヤー2のポーズ設定  
setPoseFromDetection('player2', 'GUARD');
```

### テスト用キーボード操作

#### プレイヤー1（数字キー）
- `1`: STAND
- `2`: PUNCH
- `3`: KICK
- `4`: GUARD
- `5`: CROUCH
- `6`: FORWARD
- `7`: BACKWARD
- `8`: CROUCH_PUNCH
- `9`: CROUCH_KICK
- `0`: CROUCH_GUARD

#### プレイヤー2（ファンクションキー）
- `F1`: STAND
- `F2`: PUNCH
- `F3`: KICK
- `F4`: GUARD
- `F5`: CROUCH
- `F6`: FORWARD
- `F7`: BACKWARD
- `F8`: CROUCH_PUNCH
- `F9`: CROUCH_KICK
- `F10`: CROUCH_GUARD

#### デバッグ用（従来のキーボード操作）
**プレイヤー1:**
- `A/D`: 移動
- `W`: ジャンプ
- `S`: しゃがみ
- `X`: ガード
- `スペース`: 攻撃

**プレイヤー2:**
- `←/→`: 移動
- `↑`: ジャンプ
- `↓`: 攻撃

## ゲームシステム

### 戦闘
- HP: 各プレイヤー100
- 攻撃ダメージ: 20
- ガード時ダメージ: 10（半減）
- 制限時間: 60秒

### 当たり判定
- 通常時: 高さ150px
- しゃがみ時: 高さ90px（60%縮小）

### 勝利条件
1. 相手のHPを0にする
2. 時間切れ時のHP多い方が勝利
3. 同HP時は引き分け

## 開発者向け

### ファイル構成
```
fighting-game-pose/
├── index.html              # メインHTML
├── index.js                # ゲームロジック
├── js/
│   ├── classes.js          # ゲームクラス（Fighter, Sprite）
│   ├── utils.js            # ユーティリティ関数
│   └── pose-controller.js  # ポーズ制御システム
├── img/                    # 画像アセット
└── README.md              # このファイル
```

### ポーズ制御システムの統合
`pose-controller.js`の`setPoseFromDetection()`関数を使用して、外部のポーズ検出システムと連携できます。

### カスタマイズ
- `pose-controller.js`でポーズ判定ロジックを変更
- `classes.js`でキャラクター動作を調整
- `index.js`でゲームバランスを調整



🎯 実装完了事項
✅ アニメーション枠の作成
1. Fighterクラス拡張 (classes.js)
各ポーズ用のswitchSpriteケースを追加
フォールバック機能付き（専用アニメーションが無い場合は既存を使用）
以下のポーズアニメーションに対応：
punch, kick, crouch_punch, crouch_kick
guard, crouch_guard
forward, backward
crouch, stand
2. スプライト定義拡張 (index.js)
プレイヤー・エネミー両方に全ポーズ用スプライト定義を追加
現在は既存画像を使用、将来的に専用画像に差し替え可能
コメントで専用アニメーション追加時の変更箇所を明記
3. ポーズコントローラー拡張 (pose-controller.js)
各入力に対応するアニメーション名を返す機能追加
animationNameプロパティでゲーム側に適切なアニメーション指示
🎨 アニメーション対応状況
ポーズ	アニメーション名	現在使用画像	専用画像追加時
PUNCH	punch	Attack1.png	Punch.png
KICK	kick	Attack2.png	Kick.png
CROUCH_PUNCH	crouch_punch	Attack1.png	CrouchPunch.png
CROUCH_KICK	crouch_kick	Attack2.png	CrouchKick.png
GUARD	guard	Idle.png	Guard.png
CROUCH_GUARD	crouch_guard	Idle.png	CrouchGuard.png
FORWARD	forward	Run.png	Forward.png
BACKWARD	backward	Run.png	Backward.png
CROUCH	crouch	Idle.png	Crouch.png
STAND	stand	Idle.png	Stand.png