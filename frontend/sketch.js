// filepath: c:\\Users\\ketya\\GaFa\\frontend\\sketch.js

import { PoseLandmarker, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/vision_bundle.js";
let video;
let lastPose = "";
let lastPoseTimestamp = 0;
let x = 200, y = 200, speed = 4;

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
  const width = 640, height = 480
  const canvas = createCanvas(width, height);
  canvas.parent("container");
  noStroke();

  await createPoseLandmarker();

  // ✨変更: p5.jsでカメラを起動
  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide(); // p5が自動で描画する映像は非表示にする

  setupButtons();
  connectWS();
}

function draw() {
  background(20);

  // ✨追加: カメラ映像をキャンバスに描画 (左右反転)
  push();
  translate(width, 0);
  scale(-1, 1);
  image(video, 0, 0, width, height);
  pop();

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

  // 入力
  if (keyIsDown(LEFT_ARROW)) x -= speed;
  if (keyIsDown(RIGHT_ARROW)) x += speed;
  if (keyIsDown(UP_ARROW)) y -= speed;
  if (keyIsDown(DOWN_ARROW)) y += speed;

  // 画面端でラップ
  x = (x + width) % width;
  y = (y + height) % height;

  // 色決定
  const col = poseColors[currentPose] || poseColors.IDLE;
  fill(...col);
  circle(x, y, 60);

  // 現在ポーズを左上に表示
  fill(255);
  textSize(16);
  text(currentPose, 10, 20);
}