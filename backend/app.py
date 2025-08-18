"""簡易 Flask + Flask-Sock サーバー（修正版）

エンドポイント:
  GET /       : フロントエンド配信
  GET /sketch.js : p5.jsスクリプト
  WS  /ws     : ポーズ分類WebSocket（同一オリジン）
  WS  /test   : テスト用WebSocket（カメラ不要）
"""

from flask import Flask, render_template_string, send_from_directory
from flask_sock import Sock
import json
import time
import os

from pose_logic import classify_pose_from_results

try:
    import cv2  # type: ignore
    import mediapipe as mp  # type: ignore
except Exception as e:  # pragma: no cover
    cv2 = None  # type: ignore
    mp = None  # type: ignore
    _import_error = e
else:
    _import_error = None

app = Flask(__name__)
sock = Sock(app)

# フロントエンドHTMLテンプレート（同一オリジン版）
FRONTEND_HTML = '''<!doctype html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Pose Duel - WebSocket統合版</title>
    <style>
      html, body { height: 100%; margin: 0; background: #111; color: #eee; font-family: system-ui, sans-serif; }
      #container { display: grid; place-items: center; height: 100%; }
      .hint { position: fixed; inset: auto 12px 12px 12px; opacity: .8; font-size: 12px; }
    </style>
  </head>
  <body>
    <div id="container"></div>
    <div class="hint">
      <div>矢印キーで円を動かせます / カメラポーズで色変化</div>
      <div style="margin-top:4px; display:flex; gap:4px; flex-wrap:wrap;">
        <button data-pose="IDLE">IDLE</button>
        <button data-pose="PUNCH" style="color:#f55">PUNCH</button>
        <button data-pose="KICK" style="color:#fa3">KICK</button>
        <button data-pose="GUARD" style="color:#5af">GUARD</button>
        <button id="reconnect">Reconnect WS</button>
        <button id="test_mode" style="background:#444;">Test Mode: OFF</button>
        <span id="ws_status" style="margin-left:6px;">WS: init</span>
      </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/p5@1.9.2/lib/p5.min.js"></script>
    <script src="/sketch.js"></script>
  </body>
</html>'''

@app.route('/')
def index():
    return render_template_string(FRONTEND_HTML)

@app.route('/sketch.js')
def sketch_js():
    # 同一オリジン版のsketch.js
    sketch_content = '''
let x = 200;
let y = 200;
let speed = 4;
let currentPose = 'IDLE';
let useTestEndpoint = false;

const poseColors = {
  IDLE: [200, 160, 40],
  PUNCH: [255, 70, 70],
  KICK: [255, 150, 40],
  GUARD: [80, 170, 255]
};

let ws = null;
let wsStatusEl = null;

function connectWS() {
  if (ws) {
    try { ws.close(); } catch(e) {}
  }
  const endpoint = useTestEndpoint ? '/test' : '/ws';
  // 同一オリジン接続
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = protocol + '//' + window.location.host + endpoint;
  
  ws = new WebSocket(wsUrl);
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
      console.log('Received:', data);
    } catch (_) {}
  };
}

function setupButtons() {
  document.querySelectorAll('button[data-pose]').forEach(btn => {
    btn.addEventListener('click', () => {
      const pose = btn.getAttribute('data-pose');
      if (pose) {
        currentPose = pose;
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({testPose: pose}));
        }
      }
    });
  });
  const reconnectBtn = document.getElementById('reconnect');
  reconnectBtn?.addEventListener('click', () => connectWS());
  
  const testModeBtn = document.getElementById('test_mode');
  testModeBtn?.addEventListener('click', () => {
    useTestEndpoint = !useTestEndpoint;
    testModeBtn.textContent = useTestEndpoint ? 'Test Mode: ON' : 'Test Mode: OFF';
    testModeBtn.style.backgroundColor = useTestEndpoint ? '#4a4' : '#444';
    connectWS();
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
  if (keyIsDown(LEFT_ARROW)) x -= speed;
  if (keyIsDown(RIGHT_ARROW)) x += speed;
  if (keyIsDown(UP_ARROW)) y -= speed;
  if (keyIsDown(DOWN_ARROW)) y += speed;

  x = (x + width) % width;
  y = (y + height) % height;

  const col = poseColors[currentPose] || poseColors.IDLE;
  fill(...col);
  circle(x, y, 60);

  fill(255);
  textSize(16);
  text(currentPose, 10, 20);
}
'''
    return sketch_content, 200, {'Content-Type': 'application/javascript'}

@sock.route('/test')
def test_websocket(ws):
    """テスト用WebSocket - カメラ不要"""
    print("Test WebSocket connected!")
    
    try:
        ws.send(json.dumps({"pose": "IDLE", "status": "test_connected"}))
        
        poses = ["IDLE", "PUNCH", "KICK", "GUARD"]
        for i in range(20):  # 20回送信
            pose = poses[i % len(poses)]
            payload = {
                "pose": pose,
                "ts": time.time(),
                "status": "test_mode",
                "count": i
            }
            ws.send(json.dumps(payload))
            print(f"Test message {i}: {pose}")
            time.sleep(2)  # 2秒間隔
            
    except Exception as e:
        print(f"Test WebSocket error: {e}")

@sock.route('/ws')
def pose_websocket(ws):
    """実際のポーズ検出WebSocket"""
    print("Pose WebSocket connected!")
    
    try:
        ws.send(json.dumps({"pose": "IDLE", "status": "connected"}))
        
        if _import_error or cv2 is None or mp is None:
            # カメラ利用不可の場合はデモモード
            print("Running demo mode (no camera)")
            poses = ["IDLE", "PUNCH", "KICK", "GUARD"]
            count = 0
            while True:
                pose = poses[count % len(poses)]
                payload = {"pose": pose, "ts": time.time(), "status": "demo"}
                ws.send(json.dumps(payload))
                count += 1
                if count % 4 == 0:
                    print(f"Demo cycle {count//4}")
                time.sleep(3)
        else:
            # カメラモード
            print("Starting camera mode")
            cap = cv2.VideoCapture(0)
            if not cap.isOpened():
                ws.send(json.dumps({"error": "Camera open failed"}))
                return
            
            mp_pose = mp.solutions.pose
            with mp_pose.Pose(model_complexity=1, enable_segmentation=False) as pose:
                frame_count = 0
                while True:
                    ret, frame = cap.read()
                    if not ret:
                        break
                    
                    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    rgb.flags.writeable = False
                    results = pose.process(rgb)
                    pose_name = classify_pose_from_results(results)
                    
                    payload = {"pose": pose_name, "ts": time.time()}
                    ws.send(json.dumps(payload))
                    frame_count += 1
                    
                    if frame_count % 30 == 0:
                        print(f"Camera frame {frame_count}, pose: {pose_name}")
                    
                    time.sleep(1/30)
            
            cap.release()
            
    except Exception as e:
        print(f"Pose WebSocket error: {e}")

if __name__ == "__main__":
    print("Starting integrated Pose Duel server...")
    print("Access: http://127.0.0.1:5000")
    app.run(host="127.0.0.1", port=5000, debug=True)
