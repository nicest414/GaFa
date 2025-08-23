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

app = Flask(__name__)
sock = Sock(app)

@app.route('/')
def index():
    return send_from_directory('frontend', 'index.html')

@app.route('/sketch.js')
def sketch_js():
    return send_from_directory('frontend', 'sketch.js')

@sock.route('/test')
def test_websocket(ws):
    """テスト用WebSocket - カメラ不要"""
    print("Test WebSocket connected!")
    
    try:
        ws.send(json.dumps({"pose": "IDLE", "status": "test_connected"}))

        poses = ["IDLE", "PUNCH", "KICK", "GUARD","CROUCH_PUNCH","CROUCH_KICK","CROUCH_GUARD","FORWARD","BACKWARD","CROUCH","STAND"]
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
        
        # メッセージ受信ループ
        while True:
            # クライアントからのメッセージを待つ
            message = ws.receive()
            if message is None:
                break # 接続が切れたらループを抜ける

            # 受信したメッセージを処理
            data = json.loads(message)
            if 'pose' in data:
                # ここでゲームロジックなどを実行できる
                print(f"Received pose from client: {data['pose']}")
                
                # 他のクライアントにブロードキャストするなどの処理も可能
                # ws.send(...) 
            
    except Exception as e:
        print(f"Pose WebSocket error: {e}")
    finally:
        print("Pose WebSocket disconnected.")

if __name__ == "__main__":
    print("Starting integrated Pose Duel server...")
    print("Access: http://127.0.0.1:5000")
    app.run(host="127.0.0.1", port=5000, debug=True)
