// filepath: c:\\Users\\ketya\\GaFa\\frontend\\sketch.js
let x = 200;
let y = 200;
let speed = 4;

// 現在受信中のポーズ
let currentPose = 'IDLE';

// ポーズ → 色マッピング
const poseColors = {
  IDLE: [200, 160, 40],
  PUNCH: [255, 70, 70],
  KICK: [255, 150, 40],
  GUARD: [80, 170, 255]
};

let ws = null;
let wsStatusEl = null;
let useTestEndpoint = false;  // テスト用エンドポイント切り替え

function connectWS() {
  if (ws) {
    try { ws.close(); } catch(e) {}
  }
  const endpoint = useTestEndpoint ? '/test' : '/ws';
  ws = new WebSocket(getWsUrl() + endpoint);
  if (!wsStatusEl) wsStatusEl = document.getElementById('ws_status');
  if (wsStatusEl) wsStatusEl.textContent = `WS: connecting... (${endpoint})`;

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

function getWsUrl() {
  // websocketsライブラリ版サーバー用（ポート5001）
  return 'ws://127.0.0.1:5001';
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
          ws.send(JSON.stringify({testPose: pose}));
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

function setup() {
  const canvas = createCanvas(640, 480);
  canvas.parent("container");
  noStroke();
  setupButtons();
  connectWS();
}

function draw() {
  background(20);
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
