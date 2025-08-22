# API仕様書 - Pose Duel

## 1. WebSocketメッセージ形式

### 1.1 ポーズデータ (サーバー→クライアント)
```json
{
  "type": "pose_update",
  "player_id": "P1" | "P2",
  "pose": "IDLE" | "PUNCH" | "KICK" | "GUARD" | "FORWARD" | "BACKWARD" | "STAND" | "CROUCH" | "CROUCH_PUNCH" | "CROUCH_KICK" | "CROUCH_GUARD",
  "confidence": 0.85,
  "timestamp": 1691234567890,
  "frame_id": 12345
}
```

### 1.2 ゲーム状態 (サーバー→クライアント)
```json
{
  "type": "game_state",  "player1": {
    "health": 80,
    "pose": "PUNCH",
    "position": {"x": 200, "y": 300},
    "status": "attacking" | "defending" | "idle" | "damaged" | "moving_forward" | "moving_backward" | "crouching" | "crouch_attacking" | "crouch_defending" | "attack_canceling"
  },
  "player2": {
    "health": 65,
    "pose": "GUARD", 
    "position": {"x": 400, "y": 300},
    "status": "defending"
  },
  "game_timer": 45.2,
  "round_number": 1,
  "game_status": "playing" | "paused" | "finished"
}
```

### 1.3 ゲームイベント (サーバー→クライアント)
```json
{
  "type": "game_event",
  "event": "hit" | "block" | "ko" | "round_start" | "round_end" | "player_moved" | "stance_changed" | "movement_canceled" | "combo_attack",
  "attacker": "P1" | "P2",
  "target": "P1" | "P2",
  "damage": 15,
  "effect": "normal" | "critical" | "blocked" | "crouch_hit" | "cancel_combo" | "crouch_blocked",
  "movement": "forward" | "backward" | "crouch" | "stand",
  "attack_type": "punch" | "kick" | "crouch_punch" | "crouch_kick",
  "timestamp": 1691234567890
}
```

### 1.4 クライアント→サーバー
```json
{
  "type": "pose_detected",
  "pose": "PUNCH" | "KICK" | "GUARD" | "FORWARD" | "BACKWARD" | "STAND" | "CROUCH" | "CROUCH_PUNCH" | "CROUCH_KICK" | "CROUCH_GUARD",
  "landmarks": [...], // MediaPipeの生データ（デバッグ用）
  "timestamp": 1691234567890
}
```

## 2. ゲームパラメータ

### 2.1 基本設定
- ラウンド時間: 60秒
- プレイヤー初期HP: 100
- 攻撃力:
  - PUNCH: 20ダメージ
  - KICK: 25ダメージ
  - CROUCH_PUNCH: 15ダメージ（下段攻撃）
  - CROUCH_KICK: 18ダメージ（下段攻撃）
- 防御力:
  - GUARD: 100%軽減（上段攻撃）下段は食らう
  - CROUCH_GUARD: 100%軽減（下段攻撃）上段は半分食らう
- 移動設定:
  - FORWARD: 前進速度 2px/frame
  - BACKWARD: 後退速度 1.5px/frame
  - CROUCH: しゃがみ
  - STAND: 通常の当たり判定

### 2.2 判定タイミング
- ポーズ検出間隔: 60ms
- 攻撃持続時間: 240ms
- ガード持続時間: 連続検出中
- 攻撃後のクールダウン: 
- 移動判定:
  - FORWARD/BACKWARD: 連続検出中は移動継続
  - CROUCH: ポーズ検出中は姿勢維持
  - STAND: デフォルト姿勢（他ポーズ未検出時）
- 攻撃キャンセルルール:
  - 移動中に攻撃ポーズ検出 → 即座に移動キャンセル、攻撃発動
  - キャンセル攻撃は通常攻撃より10%速く発動
  - キャンセル可能時間: 移動開始から1.5秒以内

## 3. エラーハンドリング

### 3.1 接続エラー
```json
{
  "type": "error",
  "code": "CONNECTION_LOST",
  "message": "プレイヤー2の接続が切れました",
  "action": "reconnect" | "pause" | "end_game"
}
```

### 3.2 カメラエラー
```json
{
  "type": "error", 
  "code": "CAMERA_ERROR",
  "message": "カメラアクセスに失敗しました",
  "player": "P1" | "P2"
}
```

### 4.6 移動キャンセル攻撃システム
移動中に攻撃が入力された場合の処理：

**キャンセル可能な状況：**
- FORWARD中 → 全ての攻撃でキャンセル可能
- BACKWARD中 → 全ての攻撃でキャンセル可能  
- CROUCH中 → CROUCH_PUNCH、CROUCH_KICKでキャンセル可能

**キャンセル効果：**
- 移動モーション即座停止
- 攻撃発動時間が10%短縮
- ダメージは通常通り
- 「movement_canceled」イベント発生

**キャンセル不可能な状況：**
- 攻撃モーション中
- ガードモーション中
- ダメージ受け中

## 5. 攻守相性システム

### 5.1 攻撃 vs 防御の相性表

| 攻撃技 | vs 立ちガード(GUARD) | vs しゃがみガード(CROUCH_GUARD) |
|--------|---------------------|--------------------------------|
| PUNCH | 100%軽減 | 50%軽減 |
| KICK | 100%軽減 | 50%軽減 |
| CROUCH_PUNCH | ガード不可（100%ダメージ） | 100%軽減 |
| CROUCH_KICK | ガード不可（100%ダメージ） | 100%軽減 |

### 5.2 戦略的なポイント
- **立ちガード**: 上段攻撃には強いが、下段攻撃を防げない
- **しゃがみガード**: 下段攻撃に特化、上段も部分的に防御
- **攻撃側**: 相手のガードタイプを見極めて攻撃を選択
- **防御側**: 相手の攻撃パターンを読んでガードタイプを切り替え
