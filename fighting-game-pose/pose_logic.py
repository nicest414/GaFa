"""
Task 2.1: ポーズ判定ロジック

MediaPipe Pose のランドマーク配列(33個)から、
  - "PUNCH"
  - "KICK"
  - "GUARD"
  - "IDLE"
のいずれかを返す。

使い方例:
    from pose_logic import classify_pose_from_landmarks
    pose = classify_pose_from_landmarks(landmarks)  # landmarks: results.pose_landmarks.landmark

    # または MediaPipe の results から直接:
    from pose_logic import classify_pose_from_results
    pose = classify_pose_from_results(results)

ヒューリスティックベースで、スケールは肩幅で正規化しています。
必要ランドマークが欠ける場合は "IDLE" を返します。

[微調整ガイド]
- 座標系: MediaPipe の2D座標は x: 右が+、y: 下が+（上に行くほど y は小さくなる）。0〜1に正規化。
- スケール: 基本は肩幅（左右肩の距離）を1.0として、距離しきい値を比率で記述。肩が見えないときは腰幅にフォールバック。
- 可視性: visibility が低い点はノイズが多いので無視（min_visibility）。屋内・明るさで最適値が変わる。
- チューニング手順の例:
  1) 誤検出を減らしたい → 角度の最小/最大を厳しく、距離比を大きめに、min_visibility を少し上げる。
  2) 反応を良くしたい → 角度の閾値を緩める、距離比を小さく、スムージング（pose_test側）を弱める。
  3) 体格差対応 → すべて比率ベースなので基本は不要。肩や腰が隠れやすい衣服の場合は min_visibility を調整。
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Sequence, Optional
import math

try:
    # 型安全かつ定数参照のために import（未インストールでも動くように例外は無視）
    from mediapipe.python.solutions.pose import PoseLandmark as PL
except Exception:  # pragma: no cover - 実行環境に mediapipe が無い場合のフォールバック
    class PL:  # type: ignore
        NOSE = 0
        LEFT_SHOULDER = 11
        RIGHT_SHOULDER = 12
        LEFT_ELBOW = 13
        RIGHT_ELBOW = 14
        LEFT_WRIST = 15
        RIGHT_WRIST = 16
        LEFT_HIP = 23
        RIGHT_HIP = 24
        LEFT_KNEE = 25
        RIGHT_KNEE = 26
        LEFT_ANKLE = 27
        RIGHT_ANKLE = 28


# しきい値のまとめ。各値は「肩幅=1.0」の比率で扱う（角度は度）。
# 値の右側に、想定レンジや調整のヒントを記載。
@dataclass(frozen=True)
class Thresholds:
    # スケールは肩幅（左右肩の距離）。小さすぎるとノイズに敏感、大きすぎると反応鈍化。
    # 推奨: 0.4〜0.7。暗所・ブレが多いなら 0.6 付近に上げる。
    min_visibility: float = 0.5

    # GUARD 条件: 「両手が顔/肩の近く」かつ「肘が曲がっている」。
    # guard_elbow_angle_max: 肘の曲がり（小さいほど曲げ）。120〜140で調整。低いほど厳しい。
    guard_elbow_angle_max: float = 120.0
    # guard_wrist_to_face_scale: 手首-鼻が近いほど良い。1.0〜1.4。小さくするほど厳しい。
    guard_wrist_to_face_scale: float = 1.1
    # guard_wrist_to_shoulder_scale: 手首-肩が近いかどうか。0.6〜1.0。小さくするほど厳しい。
    guard_wrist_to_shoulder_scale: float = 0.6

    # PUNCH 条件: 「肘が伸びている」かつ「手首が肩から十分離れている」かつ「肩高さと大きくズレない」。
    # punch_elbow_angle_min: 150〜175。高いほど「しっかり伸ばした」時のみ反応。
    punch_elbow_angle_min: float = 145.0
    # punch_wrist_to_shoulder_scale: 手首-肩の距離比。1.0〜1.3。大きくすると厳しい。
    punch_wrist_to_shoulder_scale: float = 1.0
    # punch_wrist_y_align_scale: 肩高さからの許容ずれ（y方向）。0.2〜0.5。小さいほど厳しい。
    punch_wrist_y_align_scale: float = 0.9
    # Z軸 PUNCH 条件: 手首が肩よりどれだけ前に出ているかの最小値
    punch_wrist_z_diff_min: float = 0.2

    # KICK 条件（常時検出抑止のため厳格化）。
    # kick_knee_angle_min: 膝の伸び。160〜175。高いほど「しっかり伸ばした」時のみ反応。
    kick_knee_angle_min: float = 155.0
    # 旧仕様の直線距離しきい値（互換のため残置）。通常は無効。
    kick_ankle_to_hip_scale: float = 1.1
    # 新基準1: 股関節から足首が x 方向に前へ出ている比率。0.4〜0.9。大きくすると厳しい。
    kick_ankle_x_to_hip_scale: float = 0.9
    # 新基準2: 足首が膝より十分「上」（y が小さい）かどうかのバッファ。0.2〜0.4。大きくすると検出しやすい。
    kick_ankle_above_knee_scale: float = 0.2
    # Z軸 KICK 条件: 足首が股関節よりどれだけ前に出ているかの最小値
    kick_ankle_z_diff_min: float = 0.2

    # Z軸 FORWARD/BACKWARD 条件: 肩が腰よりどれだけ前後にいるか
    forward_lean_z_diff_min: float = 0.1

    # ▼▼▼ 新しい後傾のルール（肩と足首のZ軸の差）を追加 ▼▼▼
    # 後傾条件: 肩が足首よりどれだけ後ろにあるかの最小値（肩幅比）
    backward_lean_shoulders_ankles_z_diff: float = 0.01

    # ▼▼▼ ここに新しいCROUCHのルールを追加 ▼▼▼
    # CROUCH 条件: 膝の曲がり具合
    # 90に近いほど深いしゃがみ。大きくすると浅いしゃがみでも反応。
    crouch_knee_angle_max: float = 140.0
    # ▼▼▼ 新しいルールを追加 ▼▼▼
    # 腰と足首の最大Y距離（肩幅比）。大きいほど浅いしゃがみで反応
    crouch_hip_ankle_dist_max: float = 1.0

TH = Thresholds()


class LandmarkLike:
    """MediaPipe の NormalizedLandmark ライクなオブジェクト用の Protocol ライク定義。
    x, y, z, visibility を持っていることを想定。
    """
    x: float
    y: float
    z: float
    visibility: float


def _dist(a: LandmarkLike, b: LandmarkLike) -> float:
    dx, dy = a.x - b.x, a.y - b.y
    return math.hypot(dx, dy)


def _angle_deg(a: LandmarkLike, b: LandmarkLike, c: LandmarkLike) -> float:
    """b を頂点とする ∠abc の角度[deg]"""
    v1 = (a.x - b.x, a.y - b.y)
    v2 = (c.x - b.x, c.y - b.y)
    dot = v1[0] * v2[0] + v1[1] * v2[1]
    n1 = math.hypot(*v1)
    n2 = math.hypot(*v2)
    if n1 == 0 or n2 == 0:
        return 0.0
    cosang = max(-1.0, min(1.0, dot / (n1 * n2)))
    return math.degrees(math.acos(cosang))


def _is_visible(lm: LandmarkLike, min_vis: float) -> bool:
    try:
        return getattr(lm, "visibility", 1.0) >= min_vis
    except Exception:
        return True


def _get_scale(lm: Sequence[LandmarkLike]) -> Optional[float]:
    # スケール推定: 可能なら肩幅、不可なら腰幅。戻り値は0より大の実数。
    # 注意: カメラのアングルで肩幅が小さく写ると、相対比が大きめに出て検出が甘くなる傾向。
    # 対策: 環境で誤検出が多いときは各しきい値をやや大きめに。
    try:
        ls, rs = lm[PL.LEFT_SHOULDER], lm[PL.RIGHT_SHOULDER]
        if _is_visible(ls, TH.min_visibility) and _is_visible(rs, TH.min_visibility):
            d = _dist(ls, rs)
            if d > 0:
                return d
        # 肩幅が無理なら腰幅
        lh, rh = lm[PL.LEFT_HIP], lm[PL.RIGHT_HIP]
        if _is_visible(lh, TH.min_visibility) and _is_visible(rh, TH.min_visibility):
            d = _dist(lh, rh)
            if d > 0:
                return d
    except Exception:
        return None
    return None


def classify_pose_from_landmarks(landmarks: Sequence[LandmarkLike]) -> str:
    """MediaPipeの landmarks (list of 33) を受け取り、ポーズ名を返す."""
    if not landmarks or len(landmarks) < 29:
        return "IDLE"

    scale = _get_scale(landmarks)
    if not scale:
        return "IDLE"

    def has(*idx: int) -> bool:
        return all(0 <= i < len(landmarks) and _is_visible(landmarks[i], TH.min_visibility) for i in idx)

    # --- GUARD 検出 ---
    # 目的: 顔の前で両腕を構える姿勢。パンチやキックの途中で誤検出しないよう、両側の条件を満たす必要あり。
    # 調整ポイント:
    # - 近さ判定: guard_wrist_to_face_scale / guard_wrist_to_shoulder_scale
    # - 曲がり判定: guard_elbow_angle_max（小さくすると「より曲げている」必要）
    guard_cond = False
    if has(PL.NOSE, PL.LEFT_SHOULDER, PL.RIGHT_SHOULDER, PL.LEFT_ELBOW, PL.RIGHT_ELBOW, PL.LEFT_WRIST, PL.RIGHT_WRIST):
        nose = landmarks[PL.NOSE]
        l_sh, r_sh = landmarks[PL.LEFT_SHOULDER], landmarks[PL.RIGHT_SHOULDER]
        l_el, r_el = landmarks[PL.LEFT_ELBOW], landmarks[PL.RIGHT_ELBOW]
        l_wr, r_wr = landmarks[PL.LEFT_WRIST], landmarks[PL.RIGHT_WRIST]

        l_close = (_dist(l_wr, nose) <= TH.guard_wrist_to_face_scale * scale) or (
            _dist(l_wr, l_sh) <= TH.guard_wrist_to_shoulder_scale * scale
        )
        r_close = (_dist(r_wr, nose) <= TH.guard_wrist_to_face_scale * scale) or (
            _dist(r_wr, r_sh) <= TH.guard_wrist_to_shoulder_scale * scale
        )
        l_elbow_bent = _angle_deg(l_sh, l_el, l_wr) <= TH.guard_elbow_angle_max
        r_elbow_bent = _angle_deg(r_sh, r_el, r_wr) <= TH.guard_elbow_angle_max
        guard_cond = l_close and r_close and l_elbow_bent and r_elbow_bent

    # --- PUNCH 検出（左右どちらか） ---
    # 目的: 腕を伸ばして肩より前に突き出す動き。肩高さと大きくズレる（上下にブレる）場合は除外。
    # 調整ポイント:
    # - 伸び判定: punch_elbow_angle_min（高いほど完全伸展のみ）
    # - 前方距離: punch_wrist_to_shoulder_scale
    # - 高さ整合: punch_wrist_y_align_scale（小さいほど厳格）
    punch_left = False
    punch_right = False
    if has(PL.LEFT_SHOULDER, PL.LEFT_ELBOW, PL.LEFT_WRIST):
        l_sh, l_el, l_wr = landmarks[PL.LEFT_SHOULDER], landmarks[PL.LEFT_ELBOW], landmarks[PL.LEFT_WRIST]
        l_elbow_angle = _angle_deg(l_sh, l_el, l_wr)
        l_wrist_far = _dist(l_wr, l_sh) >= TH.punch_wrist_to_shoulder_scale * scale
        l_wrist_y_align = abs(l_wr.y - l_sh.y) <= TH.punch_wrist_y_align_scale * scale
         # ▼▼▼ Z軸の条件を追加 ▼▼▼
    # 手首が肩より前に出ているか (shoulder.z - wrist.z が正の値になる)
        l_wrist_pushed_forward = (l_sh.z - l_wr.z) >= TH.punch_wrist_z_diff_min

        # ↓ 横(XY)か前(Z)のどちらかを満たせばOK、という形に修正
        punch_left = (l_elbow_angle >= TH.punch_elbow_angle_min) and l_wrist_y_align and (l_wrist_far or l_wrist_pushed_forward)

    if has(PL.RIGHT_SHOULDER, PL.RIGHT_ELBOW, PL.RIGHT_WRIST):
        r_sh, r_el, r_wr = landmarks[PL.RIGHT_SHOULDER], landmarks[PL.RIGHT_ELBOW], landmarks[PL.RIGHT_WRIST]
        r_elbow_angle = _angle_deg(r_sh, r_el, r_wr)
        r_wrist_far = _dist(r_wr, r_sh) >= TH.punch_wrist_to_shoulder_scale * scale
        r_wrist_y_align = abs(r_wr.y - r_sh.y) <= TH.punch_wrist_y_align_scale * scale
         # ▼▼▼ Z軸の条件を追加 ▼▼▼
    # 手首が肩より前に出ているか (shoulder.z - wrist.z が正の値になる)
        r_wrist_pushed_forward = (r_sh.z - r_wr.z) >= TH.punch_wrist_z_diff_min

        punch_right = (r_elbow_angle >= TH.punch_elbow_angle_min) and r_wrist_y_align and (r_wrist_far or r_wrist_pushed_forward)

    punch_cond = punch_left or punch_right

    # --- KICK 検出（左右どちらか） ---
    # 目的: 脚を前に伸ばし上げる動き。直立での誤検出を避けるため、x方向の前方移動量または足首が膝より上を要求。
    # 調整ポイント:
    # - 伸び判定: kick_knee_angle_min
    # - 前方距離: kick_ankle_x_to_hip_scale（大きく→厳しい）
    # - 上昇量: kick_ankle_above_knee_scale（大きく→検出しやすい）
    kick_left = False
    kick_right = False
    if has(PL.LEFT_HIP, PL.LEFT_KNEE, PL.LEFT_ANKLE):
        l_hip, l_kn, l_an = landmarks[PL.LEFT_HIP], landmarks[PL.LEFT_KNEE], landmarks[PL.LEFT_ANKLE]
        l_knee_angle = _angle_deg(l_hip, l_kn, l_an)
        # 誤検出抑止: x方向の前方移動量 or 足首が膝より高い
        l_ankle_far_x = abs(l_an.x - l_hip.x) >= TH.kick_ankle_x_to_hip_scale * scale
        l_ankle_above_knee = (l_an.y + TH.kick_ankle_above_knee_scale * scale) <= l_kn.y

        # ▼▼▼ Z軸の条件を追加 ▼▼▼
        l_ankle_pushed_forward = (l_hip.z - l_an.z) >= TH.kick_ankle_z_diff_min
        kick_left = (l_knee_angle >= TH.kick_knee_angle_min) and (l_ankle_far_x or l_ankle_above_knee or l_ankle_pushed_forward)

    if has(PL.RIGHT_HIP, PL.RIGHT_KNEE, PL.RIGHT_ANKLE):
        r_hip, r_kn, r_an = landmarks[PL.RIGHT_HIP], landmarks[PL.RIGHT_KNEE], landmarks[PL.RIGHT_ANKLE]
        r_knee_angle = _angle_deg(r_hip, r_kn, r_an)
        r_ankle_far_x = abs(r_an.x - r_hip.x) >= TH.kick_ankle_x_to_hip_scale * scale
        r_ankle_above_knee = (r_an.y + TH.kick_ankle_above_knee_scale * scale) <= r_kn.y

        # ▼▼▼ Z軸の条件を追加 ▼▼▼
        r_ankle_pushed_forward = (r_hip.z - r_an.z) >= TH.kick_ankle_z_diff_min
        kick_right = (r_knee_angle >= TH.kick_knee_angle_min) and (r_ankle_far_x or r_ankle_above_knee or r_ankle_pushed_forward)

    kick_cond = kick_left or kick_right

     # --- FORWARD 検出（前傾姿勢） ---
    forward_cond = False
    if has(PL.LEFT_SHOULDER, PL.LEFT_HIP, PL.RIGHT_SHOULDER, PL.RIGHT_HIP):
        l_sh, l_hip = landmarks[PL.LEFT_SHOULDER], landmarks[PL.LEFT_HIP]
        r_sh, r_hip = landmarks[PL.RIGHT_SHOULDER], landmarks[PL.RIGHT_HIP]

        # 両肩と両腰の平均座標を計算
        avg_sh_z = (l_sh.z + r_sh.z) / 2
        avg_hip_z = (l_hip.z + r_hip.z) / 2

        # 平均座標を使って、上半身全体が前に傾いているか判定
        forward_cond = (avg_hip_z - avg_sh_z) >= TH.forward_lean_z_diff_min

    # --- BACKWARD 検出（後傾姿勢） ---
    backward_cond = False
    if has(PL.LEFT_SHOULDER, PL.RIGHT_SHOULDER, PL.LEFT_ANKLE, PL.RIGHT_ANKLE):
        l_sh, r_sh = landmarks[PL.LEFT_SHOULDER], landmarks[PL.RIGHT_SHOULDER]
        l_an, r_an = landmarks[PL.LEFT_ANKLE], landmarks[PL.RIGHT_ANKLE]

        # 両肩と両足首の平均Z座標を計算
        avg_sh_z = (l_sh.z + r_sh.z) / 2
        avg_an_z = (l_an.z + r_an.z) / 2

        # 肩が足首より後ろにあるかで判定
        lean_value = avg_sh_z - avg_an_z
        print(f"Backward Lean (Shoulder-Ankle Z): {lean_value:.2f} / Req: {TH.backward_lean_shoulders_ankles_z_diff}")

        backward_cond = lean_value >= TH.backward_lean_shoulders_ankles_z_diff
      # --- CROUCH 検出（左右どちらか） ---
    crouch_left = False
    crouch_right = False
    if has(PL.LEFT_HIP, PL.LEFT_KNEE, PL.LEFT_ANKLE):
        l_hip, l_kn, l_an = landmarks[PL.LEFT_HIP], landmarks[PL.LEFT_KNEE], landmarks[PL.LEFT_ANKLE]
        l_knee_angle = _angle_deg(l_hip, l_kn, l_an)

        # ▼▼▼ 新しい判定ロジック ▼▼▼
        # 腰と足首のY座標（垂直方向）の距離を計算
        l_hip_ankle_dist_y = abs(l_hip.y - l_an.y)
        # 距離がしきい値以下かチェック
        l_hip_low_enough = l_hip_ankle_dist_y <= (TH.crouch_hip_ankle_dist_max * scale)

        crouch_left = (l_knee_angle <= TH.crouch_knee_angle_max) and l_hip_low_enough

    if has(PL.RIGHT_HIP, PL.RIGHT_KNEE, PL.RIGHT_ANKLE):
        r_hip, r_kn, r_an = landmarks[PL.RIGHT_HIP], landmarks[PL.RIGHT_KNEE], landmarks[PL.RIGHT_ANKLE]
        r_knee_angle = _angle_deg(r_hip, r_kn, r_an)

        # ▼▼▼ 新しい判定ロジック ▼▼▼
        r_hip_ankle_dist_y = abs(r_hip.y - r_an.y)
        r_hip_low_enough = r_hip_ankle_dist_y <= (TH.crouch_hip_ankle_dist_max * scale)

        crouch_right = (r_knee_angle <= TH.crouch_knee_angle_max) and r_hip_low_enough

    crouch_cond = crouch_left or crouch_right

    # --- CROUCH_PUNCH 検出（しゃがみ＋片腕伸展） ---
    crouch_punch_cond = False
    crouch_punch_cond = (crouch_left or crouch_right) and (punch_left or punch_right)

    # --- CROUCH_KICK 検出（しゃがみ＋片脚前方伸展） ---
    crouch_kick_cond = False
    crouch_kick_cond = (crouch_left or crouch_right) and (kick_left or kick_right)

    # --- CROUCH_GUARD 検出（しゃがみ＋両手ガード） ---
    crouch_guard_cond = crouch_cond and guard_cond

    # --- 優先順位で判定 ---
    if crouch_punch_cond:
        return "CROUCH_PUNCH"
    if crouch_kick_cond:
        return "CROUCH_KICK"
    if punch_cond:
        return "PUNCH"
    if kick_cond:
        return "KICK"
    if crouch_guard_cond:
        return "CROUCH_GUARD"
    if guard_cond:
        return "GUARD"
    if crouch_cond:
        return "CROUCH"
    if forward_cond:
        return "FORWARD"
    if backward_cond:
        return "BACKWARD"
    return "STAND"


def classify_pose_from_results(results) -> str:
    """MediaPipe の results から直接判定。pose_landmarks が無ければ "IDLE"。"""
    if not getattr(results, "pose_landmarks", None):
        return "IDLE"
    return classify_pose_from_landmarks(results.pose_landmarks.landmark)


# 簡易動作テスト（任意）: カメラから読み取り、現在のポーズ名を標準出力
if __name__ == "__main__":  # pragma: no cover
    import cv2
    try:
        import mediapipe as mp
    except Exception as e:
        print("mediapipe が見つかりません:", e)
        raise SystemExit(1)

    mp_pose = mp.solutions.pose

    cap = cv2.VideoCapture(0)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    if not cap.isOpened():
        print("Error: Camera not found.")
        raise SystemExit(1)

    window_name = "PoseLogic Demo - press q to quit"
    cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)

    with mp_pose.Pose(model_complexity=1, enable_segmentation=False) as pose:
        while True:
            ok, frame = cap.read()
            if not ok:
                break
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            rgb.flags.writeable = False
            results = pose.process(rgb)

            pose_name = classify_pose_from_results(results)
            if pose_name != "IDLE":
                print(pose_name)

            vis = frame.copy()
            if getattr(results, "pose_landmarks", None):
                mp.solutions.drawing_utils.draw_landmarks(
                    vis, results.pose_landmarks, mp_pose.POSE_CONNECTIONS
                )
            cv2.putText(vis, pose_name, (30, 50), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 255, 255), 2, cv2.LINE_AA)
            cv2.imshow(window_name, vis)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

    cap.release()
    cv2.destroyAllWindows()
