// filepath: c:\\Users\\ketya\\GaFa\\frontend\\sketch.js

import { PoseLandmarker, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/vision_bundle.js";
let video;
let lastPose = "";
let lastPoseTimestamp = 0;
let x = 200, y = 200, speed = 4;
// プレイヤー定義
let player1 = {
  x: 100,
  y: 300,
  hp: 100,
  pose: 'IDLE',
  isAttacking: false, // 攻撃中フラグ
  attackTimer: 0      // 攻撃アニメーション用タイマー
};

let player2 = {
  x: 540,
  y: 300,
  hp: 100,
  pose: 'IDLE'
};
// 追加: poseLandmarker 変数を事前宣言（未定義エラー防止）
let poseLandmarker = null;

// 現在受信中のポーズ
let currentPose = 'IDLE';

// ポーズ → 色マッピング
const poseColors = {
  IDLE: [200, 160, 40],
  PUNCH: [255, 70, 70],
  KICK: [255, 150, 40],
  GUARD: [80, 170, 255]
};

let ws = null, wsStatusEl = null, useTestEndpoint = false;  // テスト用エンドポイント切り替え

// 各ポーズの性能を定義する設定オブジェクト
const poseSettings = {
  PUNCH: {
    type: 'attack',
    range: 80,   // パンチの射程
    damage: 20   // パンチのダメージ
  },
  KICK: {
    type: 'attack',
    range: 120,  // キックはパンチより射程が長い
    damage: 30   // キックはパンチより威力が高い
  },
  GUARD: {
    type: 'defense',
    damageMultiplier: 0.2 // 受けるダメージを20%に軽減
  },
  IDLE: {
    type: 'neutral'
  }
};

// 攻撃ポーズのリストを定義しておくと便利
const attackPoses = ['PUNCH', 'KICK'];

// MediaPipeの初期化処理
async function createPoseLandmarker() {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
  );
  poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
      delegate: "GPU"
    },
    runningMode: "VIDEO",
    numPoses: 1
  });
  console.log("PoseLandmarker created");
}

function connectWS() {
  if (ws) {
    try { ws.close(); } catch (e) { }
  }

  const endpoint = useTestEndpoint ? '/test' : '/ws';
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = protocol + '//' + window.location.host + endpoint;

  ws = new WebSocket(wsUrl);
  if (!wsStatusEl) wsStatusEl = document.getElementById('ws_status');
  if (wsStatusEl) wsStatusEl.textContent = `WS: connecting... (${wsUrl})`;
  ws.onopen = () => {
    if (wsStatusEl) wsStatusEl.textContent = `WS: open (${endpoint})`;
  };
  ws.onclose = () => {
    if (wsStatusEl) wsStatusEl.textContent = `WS: closed (${endpoint})`;
  };
  ws.onerror = () => {
    if (wsStatusEl) wsStatusEl.textContent = `WS: error (${endpoint})`;
  };
  ws.onmessage = (ev) => {
    try {
      const data = JSON.parse(ev.data);
      if (data.pose) {
        currentPose = data.pose;
      }
      console.log('Received:', data);  // デバッグ用
    } catch (_) {
      // 非JSONは無視
    }
  };
}

function setupButtons() {
  // テスト送信ボタン: 指定ポーズをクライアント内で直接反映 & サーバへ送信(モック用途)
  document.querySelectorAll('button[data-pose]').forEach(btn => {
    btn.addEventListener('click', () => {
      const pose = btn.getAttribute('data-pose');
      if (pose) {
        currentPose = pose; // ローカル即時反映
        // サーバへ通知(必須ではないがログ用途) - 簡易プロトコル
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ testPose: pose }));
        }
      }
    });
  });
  const reconnectBtn = document.getElementById('reconnect');
  reconnectBtn?.addEventListener('click', () => connectWS());

  // テストモード切り替えボタン
  const testModeBtn = document.getElementById('test_mode');
  testModeBtn?.addEventListener('click', () => {
    useTestEndpoint = !useTestEndpoint;
    testModeBtn.textContent = useTestEndpoint ? 'Test Mode: ON' : 'Test Mode: OFF';
    testModeBtn.style.backgroundColor = useTestEndpoint ? '#4a4' : '#444';
    connectWS();  // 切り替え後に再接続
  });
}

async function setup() {
  console.log("Setup starting...");
  const canvasWidth = 640, canvasHeight = 480
  const canvas = createCanvas(canvasWidth, canvasHeight);
  canvas.parent("container");
  noStroke();

  console.log("Canvas created, initializing MediaPipe...");
  await createPoseLandmarker();

  // ✨変更: p5.jsでカメラを起動
  console.log("Creating video capture...");
  video = createCapture(VIDEO);
  video.size(canvasWidth, canvasHeight);
  video.hide(); // p5が自動で描画する映像は非表示にする

  setupButtons();
  connectWS();
  console.log("Setup complete!");
}

async function draw() {
  background(20);

  // ✨追加: カメラ映像をキャンバスに描画 (左右反転)
  if (video && video.elt && video.elt.readyState >= 2) {
    push();
    translate(width, 0);
    scale(-1, 1);
    image(video, 0, 0, width, height);
    pop();
  }

  // ✨追加: MediaPipeでポーズを予測
  if (poseLandmarker && video.elt.readyState === 4) {
    const startTimeMs = performance.now();
    poseLandmarker.detectForVideo(video.elt, startTimeMs, (result) => {
      if (result.landmarks && result.landmarks.length > 0) {
        // サーバーにある pose_logic.py のロジックをJSに移植
        const pose = classifyPoseFromLandmarks(result.landmarks[0]);
        if (pose && (pose !== lastPose || Date.now() - lastPoseTimestamp > 1000)) {
          // ポーズが変化したか、1秒経過した場合のみ送信
          currentPose = pose;
          lastPose = pose;
          lastPoseTimestamp = Date.now();
          if (ws && ws.readyState === WebSocket.OPEN) {
            // サーバーにポーズ情報を送信！
            ws.send(JSON.stringify({ pose: currentPose }));
          }
        }
      }
    });
  }

  player1.pose = currentPose;
  player2.pose = await getPose();

  // 入力
  if (keyIsDown(LEFT_ARROW)) player1.x -= speed;
  if (keyIsDown(RIGHT_ARROW)) player1.x += speed;
  if (keyIsDown(UP_ARROW)) player1.y -= speed;
  if (keyIsDown(DOWN_ARROW)) player1.y += speed;

  // 画面端でラップ
  x = (x + width) % width;
  y = (y + height) % height;  // 色決定
  const col = poseColors[currentPose] || poseColors.IDLE;
  fill(...col);

  // 各プレイヤーを表示
  const col1 = poseColors[player1.pose] || poseColors.IDLE;
  fill(...col);
  circle(player1.x, player1.y, 60);

  const col2 = poseColors[player2.pose] || poseColors.IDLE;
  fill(...col);
  circle(player2.x, player2.y, 60);
  // 各プレイヤーを表示

  // デバッグ用: 円の位置と色をコンソールに出力（最初の10フレームのみ）
  if (frameCount <= 10) {
    console.log(`Frame ${frameCount}: x=${x}, y=${y}, pose=${currentPose}, color=[${col.join(',')}]`);
  }


  const currentPoseName = player1.pose;
  const attackData = poseSettings[currentPoseName];

  // 1. 現在のポーズが「攻撃」タイプで、かつ攻撃中でないかチェック
  if (attackData?.type === 'attack' && !player1.isAttacking) {
    player1.isAttacking = true; // 攻撃中のフラグを立てる

    // 2. 相手との距離を計算
    const distance = dist(player1.x, player1.y, player2.x, player2.y);

    // 3. 攻撃の「range」設定を使って、当たり判定を行う
    if (distance < attackData.range) {
      // ヒット！
      
      // 4. ダメージを計算する
      let finalDamage = attackData.damage;
      const opponentPoseData = poseSettings[player2.pose];

      // 相手が防御ポーズならダメージを軽減する
      if (opponentPoseData?.type === 'defense') {
        finalDamage *= opponentPoseData.damageMultiplier;
      }
      
      // 5. HPから最終ダメージを引く
      player2.hp -= finalDamage;
      
      // HPが0未満にならないように調整
      if (player2.hp < 0) {
        player2.hp = 0;
      }
    }
  }

  // 6. 攻撃ポーズが終わったら、攻撃中フラグを解除する
  if (!attackPoses.includes(currentPoseName)) {
    player1.isAttacking = false;
  }

  // パンチポーズが終わったら、攻撃状態を解除
  if (player1.pose !== 'PUNCH') {
    player1.isAttacking = false;
  }

  circle(x, y, 60);

  // 現在ポーズを左上に表示
  fill(255);
  textSize(16);
  text(currentPose, 10, 20);
}

async function getPose(){

}

// 追加: module 内でも p5 がこれらを見つけられるように window に公開
window.setup = setup;
window.draw = draw;