# server.py

import cv2
import mediapipe as mp
import json
import base64 # ★ 画像エンコードのために追加
from flask import Flask, send_from_directory
from flask_sock import Sock
from pose_logic import classify_pose_from_results

# --- Flask & WebSocket 設定 ---
app = Flask(__name__)
sock = Sock(app)

# --- MediaPipe 設定 ---
mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils # ★ 描画ユーティリティを追加
SMOOTHING_STREAK = 3

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/js/<path:filename>')
def serve_js(filename):
    return send_from_directory('js', filename)

@app.route('/<path:filename>')
def serve_root_files(filename):
    return send_from_directory('.', filename)

@sock.route('/ws')
def pose_websocket(ws):
    print("WebSocket connected!")
    
    cap = cv2.VideoCapture(1) # カメラに合わせてこの数字は変更してください
    if not cap.isOpened():
        print("Error: Camera not found.")
        ws.send(json.dumps({"error": "Camera not found."}))
        return

    with mp_pose.Pose(model_complexity=1) as pose:
        stable_pose_name = "IDLE"
        candidate_pose = None
        candidate_count = 0
        
        try:
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break

                # MediaPipeでの処理
                rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                rgb.flags.writeable = False #この画像データは変更しません、と一時的に伝えて処理を早くする
                results = pose.process(rgb) #骨格情報をresultに抽出する
                rgb.flags.writeable = True # 元に戻す

                # ポーズ判定
                pose_raw = classify_pose_from_results(results)

                # スムージング処理
                if pose_raw == stable_pose_name:
                    candidate_pose = None
                    candidate_count = 0
                else:
                    if pose_raw == candidate_pose:
                        candidate_count += 1
                    else:
                        candidate_pose = pose_raw
                        candidate_count = 1
                    
                    if candidate_count >= SMOOTHING_STREAK:
                        stable_pose_name = candidate_pose
                        candidate_pose = None
                        candidate_count = 0

                # ▼▼▼▼▼ 映像送信の処理を追加 ▼▼▼▼▼
                
                # 骨格を描画した画像を作成
                vis_image = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR) # 表示用にBGRに戻す
                if results.pose_landmarks:
                    mp_drawing.draw_landmarks(
                        vis_image,
                        results.pose_landmarks,
                        mp_pose.POSE_CONNECTIONS,
                        mp_drawing.DrawingSpec(color=(245, 117, 66), thickness=2, circle_radius=2),
                        mp_drawing.DrawingSpec(color=(245, 66, 230), thickness=2, circle_radius=2)
                    )

                # 画像をJPEG形式にエンコード
                _, buffer = cv2.imencode('.jpg', vis_image)
                # Base64形式の文字列に変換
                jpg_as_text = base64.b64encode(buffer).decode('utf-8')

                # ポーズ名と画像データを一緒に送信
                payload = {
                    "pose": stable_pose_name,
                    "image": jpg_as_text
                }
                ws.send(json.dumps(payload))
                # ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

        except Exception as e:
            print(f"WebSocket error: {e}")
        finally:
            print("WebSocket disconnected.")
            cap.release()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)