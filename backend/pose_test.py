"""
Task 1.2: Webカメラを起動し、MediaPipeで骨格ランドマークを取得して座標を出力する簡易スクリプト。
必要: pip install opencv-python mediapipe
終了: 'q'キー
"""
import cv2
import mediapipe as mp

# 追加: 2.1 のポーズ判定ロジック
from pose_logic import classify_pose_from_results

mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils

# フレーム間スムージング設定: 同じポーズがこのフレーム数続いたら確定
SMOOTHING_STREAK = 3


def main():
    cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)  # CAP_DSHOWはWindowsでのカメラ遅延回避用
    if not cap.isOpened():
        print("Error: Camera not found.")
        return

    # OpenCVウィンドウを先に作成し、位置を固定
    window_name = "PoseTest - press q to quit"
    cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)
    try:
        cv2.resizeWindow(window_name, 960, 540)
    except Exception:
        pass
    try:
        cv2.moveWindow(window_name, 100, 100)
    except Exception:
        pass

    with mp_pose.Pose(model_complexity=1, enable_segmentation=False) as pose:
        # スムージング用状態
        stable_pose_name = "IDLE"
        candidate_pose = None
        candidate_count = 0
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            # BGR -> RGB
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            rgb.flags.writeable = False
            results = pose.process(rgb)

            # 現在フレームの生ポーズ推定
            pose_raw = classify_pose_from_results(results)

            # ヒステリシス: 一定フレーム同じなら確定
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
                    print("POSE:", stable_pose_name)
                    candidate_pose = None
                    candidate_count = 0

            # ビジュアライズ（確定ポーズを表示）
            vis = frame.copy()
            if results.pose_landmarks:
                mp_drawing.draw_landmarks(vis, results.pose_landmarks, mp_pose.POSE_CONNECTIONS)
            cv2.putText(vis, stable_pose_name, (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 255, 255), 2, cv2.LINE_AA)
            cv2.imshow(window_name, vis)

            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
