/**
 * ポーズベースのゲームコントローラー
 * pose_guide.mdで定義されたポーズ信号を受け取ってゲームを制御
 */

class PoseController {
  constructor() {
    // 各プレイヤーの現在のポーズ状態
    this.player1Pose = 'STAND';
    this.player2Pose = 'STAND';
    
    // ポーズの継続時間（フレーム数）
    this.player1PoseFrames = 0;
    this.player2PoseFrames = 0;
    
    // ポーズ変更のクールダウン
    this.player1Cooldown = 0;
    this.player2Cooldown = 0;
    
    // デバッグ表示の更新
    this.updateDebugDisplay();
  }

  /**
   * プレイヤー1のポーズを設定
   * @param {string} pose - ポーズ名
   */
  setPlayer1Pose(pose) {
    this.player1Pose = pose;
    this.player1PoseFrames = 0;  // フレームカウントをリセット
    this.updateDebugDisplay();
  }

  /**
   * プレイヤー2のポーズを設定
   * @param {string} pose - ポーズ名
   */
  setPlayer2Pose(pose) {
    this.player2Pose = pose;
    this.player2PoseFrames = 0;  // フレームカウントをリセット
    this.updateDebugDisplay();
  }

  /**
   * デバッグ表示を更新
   */
  updateDebugDisplay() {
    const player1Element = document.getElementById('player1-pose');
    const player2Element = document.getElementById('player2-pose');
    
    if (player1Element) player1Element.textContent = this.player1Pose;
    if (player2Element) player2Element.textContent = this.player2Pose;
  }

  /**
   * フレーム更新処理
   */
  update() {
    if (this.player1Cooldown > 0) this.player1Cooldown--;
    if (this.player2Cooldown > 0) this.player2Cooldown--;
  }

  /**
   * プレイヤー1のゲーム入力状態を取得
   */
  getPlayer1Input() {
    const input = {
      left: false,
      right: false,
      jump: false,
      attack: false,
      kick: false,
      guard: false,
      crouch: false,
      animationName: 'stand'
    };

    // ポーズ優先度に従って処理
    switch (this.player1Pose) {
      case 'CROUCH_PUNCH':
        input.attack = true;
        input.crouch = true;
        input.animationName = 'crouch_Punch';
        break;
      case 'CROUCH_KICK':
        input.kick = true;
        input.crouch = true;
        input.animationName = 'crouch_Kick';
        break;
      case 'PUNCH':
        input.attack = true;
        input.animationName = 'punch';
        break;
      case 'KICK':
        input.kick = true;
        input.animationName = 'kick';
        break;
      case 'CROUCH_GUARD':
        input.guard = true;
        input.crouch = true;
        input.animationName = 'crouch_guard';
        break;
      case 'GUARD':
        input.guard = true;
        input.animationName = 'guard';
        break;
      case 'CROUCH':
        input.crouch = true;
        input.animationName = 'crouch';
        break;
      case 'FORWARD':
        input.right = true;
        input.animationName = 'forward';
        break;
      case 'BACKWARD':
        input.left = true;
        input.animationName = 'backward';
        break;
      case 'STAND':
      default:
        input.animationName = 'stand';
        break;
    }

    return input;
  }

  /**
   * プレイヤー2のゲーム入力状態を取得
   */
  getPlayer2Input() {
    const input = {
      left: false,
      right: false,
      jump: false,
      attack: false,
      kick: false,
      guard: false,
      crouch: false,
      animationName: 'stand'
    };

    // ポーズ優先度に従って処理
    switch (this.player2Pose) {
      case 'CROUCH_PUNCH':
        input.attack = true;
        input.crouch = true;
        input.animationName = 'crouch_Punch';
        break;
      case 'CROUCH_KICK':
        input.kick = true;
        input.crouch = true;
        input.animationName = 'crouch_Kick';
        break;
      case 'PUNCH':
        input.attack = true;
        input.animationName = 'punch';
        break;
      case 'KICK':
        input.kick = true;
        input.animationName = 'kick';
        break;
      case 'CROUCH_GUARD':
        input.guard = true;
        input.crouch = true;
        input.animationName = 'crouch_guard';
        break;
      case 'GUARD':
        input.guard = true;
        input.animationName = 'guard';
        break;
      case 'CROUCH':
        input.crouch = true;
        input.animationName = 'crouch';
        break;
      case 'FORWARD':
        input.left = true;  // プレイヤー2は左向きなので逆
        input.animationName = 'forward';
        break;
      case 'BACKWARD':
        input.right = true; // プレイヤー2は左向きなので逆
        input.animationName = 'backward';
        break;
      case 'STAND':
      default:
        input.animationName = 'stand';
        break;
    }

    return input;
  }
}

// グローバルなポーズコントローラーインスタンス
const poseController = new PoseController();

// テスト用：キーボードでポーズをシミュレート
window.addEventListener('keydown', (event) => {
  // プレイヤー1のポーズ制御（数字キー）
  switch (event.key) {
    case '1': poseController.setPlayer1Pose('STAND'); break;
    case '2': poseController.setPlayer1Pose('PUNCH'); break;
    case '3': poseController.setPlayer1Pose('KICK'); break;
    case '4': poseController.setPlayer1Pose('GUARD'); break;
    case '5': poseController.setPlayer1Pose('CROUCH'); break;
    case '6': poseController.setPlayer1Pose('FORWARD'); break;
    case '7': poseController.setPlayer1Pose('BACKWARD'); break;
    case '8': poseController.setPlayer1Pose('CROUCH_PUNCH'); break;
    case '9': poseController.setPlayer1Pose('CROUCH_KICK'); break;
    case '0': poseController.setPlayer1Pose('CROUCH_GUARD'); break;
  }

  // プレイヤー2のポーズ制御（F1-F10キー）
  switch (event.key) {
    case 'F1': poseController.setPlayer2Pose('STAND'); break;
    case 'F2': poseController.setPlayer2Pose('PUNCH'); break;
    case 'F3': poseController.setPlayer2Pose('KICK'); break;
    case 'F4': poseController.setPlayer2Pose('GUARD'); break;
    case 'F5': poseController.setPlayer2Pose('CROUCH'); break;
    case 'F6': poseController.setPlayer2Pose('FORWARD'); break;
    case 'F7': poseController.setPlayer2Pose('BACKWARD'); break;
    case 'F8': poseController.setPlayer2Pose('CROUCH_PUNCH'); break;
    case 'F9': poseController.setPlayer2Pose('CROUCH_KICK'); break;
    case 'F10': poseController.setPlayer2Pose('CROUCH_GUARD'); break;
  }
});

/**
 * 外部のポーズ検出システムから呼び出される関数
 * @param {string} player - 'player1' または 'player2'
 * @param {string} pose - 検出されたポーズ名
 */
function setPoseFromDetection(player, pose) {
  if (player === 'player1') {
    poseController.setPlayer1Pose(pose);
  } else if (player === 'player2') {
    poseController.setPlayer2Pose(pose);
  }
}

// グローバルに公開
window.setPoseFromDetection = setPoseFromDetection;
