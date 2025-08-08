"""
Task 1.2: Webカメラを起動し、MediaPipeで骨格ランドマークを取得して座標を出力する簡易スクリプト。
必要: pip install opencv-python mediapipe
終了: 'q'キー
"""
import cv2
import mediapipe as mp

mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils


def main():
    cap = cv2.VideoCapture(0)
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
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            # BGR -> RGB
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            rgb.flags.writeable = False
            results = pose.process(rgb)

            # 出力
            if results.pose_landmarks:
                lm = results.pose_landmarks.landmark
                # 例: 肩・肘・手首の一部を出力
                indices = [11, 13, 15, 12, 14, 16]  # 左右肩/肘/手首
                coords = [(i, round(lm[i].x, 3), round(lm[i].y, 3), round(lm[i].z, 3)) for i in indices]
                print(coords)

            # ビジュアライズ（任意）
            vis = frame.copy()
            if results.pose_landmarks:
                mp_drawing.draw_landmarks(vis, results.pose_landmarks, mp_pose.POSE_CONNECTIONS)
            cv2.imshow(window_name, vis)

            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
