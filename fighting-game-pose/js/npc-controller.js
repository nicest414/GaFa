/**
 * NPC（AI）コントローラー
 * Player2を自動操作
 */

class NPCController {
    constructor() {
      this.currentPose = 'STAND';
      this.actionTimer = 0;
      this.actionDuration = 60; // 60フレーム = 約1秒
      this.thinkTimer = 0;
      this.thinkInterval = 30; // 30フレームごとに次の行動を考える
      
      // 行動の重み付け（より戦略的に）
      this.actionWeights = {
        'STAND': 30,      // 待機
        'FORWARD': 20,    // 前進
        'BACKWARD': 10,   // 後退
        'PUNCH': 15,      // パンチ
        'KICK': 10,       // キック
        'GUARD': 10,      // ガード
        'CROUCH': 5,      // しゃがみ
        'JUMP': 5         // ジャンプ
      };
    }
  
    /**
     * フレームごとの更新処理
     * @param {Fighter} player - Player1（自分）
     * @param {Fighter} enemy - Player2（NPC）
     */
    update(player, enemy) {
      this.actionTimer++;
      this.thinkTimer++;
  
      // 一定時間ごとに次の行動を決定
      if (this.thinkTimer >= this.thinkInterval) {
        this.thinkTimer = 0;
        this.decideNextAction(player, enemy);
      }
  
      // 行動の継続時間が終わったらSTANDに戻る
      if (this.actionTimer >= this.actionDuration) {
        this.currentPose = 'STAND';
        this.actionTimer = 0;
      }
    }
  
    /**
     * 次の行動を決定（距離や状況に応じて）
     */
    decideNextAction(player, enemy) {
      const distance = Math.abs(player.position.x - enemy.position.x);
      
      // 距離に応じて行動を変える
      if (distance < 200) {
        // 近距離：攻撃またはガード
        this.currentPose = this.weightedRandom({
          'PUNCH': 40,
          'KICK': 30,
          'GUARD': 20,
          'BACKWARD': 10
        });
        this.actionDuration = 40;
        
      } else if (distance < 400) {
        // 中距離：前進または攻撃準備
        this.currentPose = this.weightedRandom({
          'FORWARD': 50,
          'STAND': 20,
          'PUNCH': 15,
          'KICK': 15
        });
        this.actionDuration = 50;
        
      } else {
        // 遠距離：前進
        this.currentPose = this.weightedRandom({
          'FORWARD': 70,
          'STAND': 20,
          'KICK': 10
        });
        this.actionDuration = 60;
      }
  
      // プレイヤーが攻撃中ならガードの確率を上げる
      if (player.isAttacking && Math.random() < 0.4) {
        this.currentPose = 'GUARD';
        this.actionDuration = 30;
      }
  
      // たまにランダムでしゃがみ系
      if (Math.random() < 0.1) {
        this.currentPose = this.weightedRandom({
          'CROUCH': 50,
          'CROUCH_GUARD': 30,
          'CROUCH_PUNCH': 20
        });
        this.actionDuration = 35;
      }
    }
  
    /**
     * 重み付きランダム選択
     */
    weightedRandom(weights) {
      const total = Object.values(weights).reduce((a, b) => a + b, 0);
      let random = Math.random() * total;
      
      for (const [action, weight] of Object.entries(weights)) {
        random -= weight;
        if (random <= 0) {
          return action;
        }
      }
      
      return 'STAND'; // フォールバック
    }
  
    /**
     * 現在のポーズを取得
     */
    getCurrentPose() {
      return this.currentPose;
    }
  
    /**
     * 強制的にポーズを設定（デバッグ用）
     */
    setPose(pose) {
      this.currentPose = pose;
      this.actionTimer = 0;
    }
  }
  
  // グローバルインスタンス
  const npcController = new NPCController();