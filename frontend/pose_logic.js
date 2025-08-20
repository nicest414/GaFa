/**
 * pose_logic.pyをJavaScriptに移植したポーズ分類関数群
 */

// --- ランドマークのインデックス定義 (PythonのPoseLandmarkクラスに相当) ---
const PL = {
    NOSE: 0,
    LEFT_SHOULDER: 11, RIGHT_SHOULDER: 12,
    LEFT_ELBOW: 13, RIGHT_ELBOW: 14,
    LEFT_WRIST: 15, RIGHT_WRIST: 16,
    LEFT_HIP: 23, RIGHT_HIP: 24,
    LEFT_KNEE: 25, RIGHT_KNEE: 26,
    LEFT_ANKLE: 27, RIGHT_ANKLE: 28,
};

// --- しきい値の定義 (PythonのThresholdsクラスに相当) ---
const TH = {
    min_visibility: 0.5,
    guard_elbow_angle_max: 130.0,
    guard_wrist_to_face_scale: 1.2,
    guard_wrist_to_shoulder_scale: 0.8,
    punch_elbow_angle_min: 150.0,
    punch_wrist_to_shoulder_scale: 1.1,
    punch_wrist_y_align_scale: 0.35,
    kick_knee_angle_min: 165.0,
    kick_ankle_x_to_hip_scale: 0.6,
    kick_ankle_above_knee_scale: 0.3,
};

// --- ヘルパー関数 ---

// 2点間の2D距離を計算
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

// bを頂点とする3点a,b,cの角度を度数法で計算
const angleDeg = (a, b, c) => {
    // cos = (v1・v2)/(|v1||v2|)
    const v1 = { x: a.x - b.x, y: a.y - b.y }; //bからaに向かうベクトル
    const v2 = { x: c.x - b.x, y: c.y - b.y }; //bからcに向かうベクトル
    const dot = v1.x * v2.x + v1.y * v2.y; //ベクトルの内積
    const n1 = Math.hypot(v1.x, v1.y); //|v1|
    const n2 = Math.hypot(v2.x, v2.y); //|v2|
    if (n1 === 0 || n2 === 0) return 0.0; //分母が0なら角度は0
    const cos = Math.max(-1.0, Math.min(1.0, dot / (n1 * n2)));//-1<=内積<=1になるようにする。コンピュータ計算で誤差が起きた時に対応する
    return Math.acos(cos) * (180 / Math.PI); //θを求め、それを弧度法に直す
};

// ランドマークが十分な信頼度で見えているか
const isVisible = (lm) => (lm?.visibility ?? 0) >= TH.min_visibility;

// 体の大きさの基準となるスケール（肩幅または腰幅）を取得
function getScale(landmarks) {
    const ls = landmarks[PL.LEFT_SHOULDER];
    const rs = landmarks[PL.RIGHT_SHOULDER];
    if (isVisible(ls) && isVisible(rs)) {
        const d = dist(ls, rs);
        if (d > 0) return d;
    }
    const lh = landmarks[PL.LEFT_HIP];
    const rh = landmarks[PL.RIGHT_HIP];
    if (isVisible(lh) && isVisible(rh)) {
        const d = dist(lh, rh);
        if (d > 0) return d;
    }
    return null;
}


/**
 * MediaPipeのlandmarks配列を受け取り、ポーズ名を返すメイン関数
 * @param {Array<Object>} landmarks - 33個のランドマークオブジェクトの配列
 * @returns {string} ポーズ名 ("GUARD", "PUNCH", "KICK", "IDLE")
 */
function classifyPoseFromLandmarks(landmarks) {
    if (!landmarks || landmarks.length < 29) {
        return "IDLE";
    }

    const scale = getScale(landmarks);
    if (!scale) {
        return "IDLE";
    }

    // 指定されたインデックスのランドマークが全て見えているか確認するヘルパー
    const has = (...indices) => indices.every(i => landmarks[i] && isVisible(landmarks[i]));

    // --- GUARD 検出 ---
    if (has(PL.NOSE, PL.LEFT_SHOULDER, PL.RIGHT_SHOULDER, PL.LEFT_ELBOW, PL.RIGHT_ELBOW, PL.LEFT_WRIST, PL.RIGHT_WRIST)) {
        const nose = landmarks[PL.NOSE];
        const [l_sh, r_sh] = [landmarks[PL.LEFT_SHOULDER], landmarks[PL.RIGHT_SHOULDER]];
        const [l_el, r_el] = [landmarks[PL.LEFT_ELBOW], landmarks[PL.RIGHT_ELBOW]];
        const [l_wr, r_wr] = [landmarks[PL.LEFT_WRIST], landmarks[PL.RIGHT_WRIST]];

        // 左手首が鼻 or 左肩に近い
        const l_close = (dist(l_wr, nose) <= TH.guard_wrist_to_face_scale * scale) ||
            (dist(l_wr, l_sh) <= TH.guard_wrist_to_shoulder_scale * scale);
        // 右手首が鼻 or 右肩に近い
        const r_close = (dist(r_wr, nose) <= TH.guard_wrist_to_face_scale * scale) ||
            (dist(r_wr, r_sh) <= TH.guard_wrist_to_shoulder_scale * scale);
        // 左肘が十分に曲がっている
        const l_elbow_bent = angleDeg(l_sh, l_el, l_wr) <= TH.guard_elbow_angle_max;
        // 右肘が十分に曲がっている
        const r_elbow_bent = angleDeg(r_sh, r_el, r_wr) <= TH.guard_elbow_angle_max;

        if (l_close && r_close && l_elbow_bent && r_elbow_bent) {
            return "GUARD";
        }
    }

    // --- PUNCH 検出 ---
    let punch_left = false;
    if (has(PL.LEFT_SHOULDER, PL.LEFT_ELBOW, PL.LEFT_WRIST)) {
        const [l_sh, l_el, l_wr] = [landmarks[PL.LEFT_SHOULDER], landmarks[PL.LEFT_ELBOW], landmarks[PL.LEFT_WRIST]];
        const l_elbow_angle = angleDeg(l_sh, l_el, l_wr);
        const l_wrist_far = dist(l_wr, l_sh) >= TH.punch_wrist_to_shoulder_scale * scale;
        const l_wrist_y_align = Math.abs(l_wr.y - l_sh.y) <= TH.punch_wrist_y_align_scale * scale;
        // 左肘がまっすぐ and 手首が肩から遠い and 手首と肩の高さがほぼ同じ
        punch_left = (l_elbow_angle >= TH.punch_elbow_angle_min) && l_wrist_far && l_wrist_y_align;
    }

    let punch_right = false;
    if (has(PL.RIGHT_SHOULDER, PL.RIGHT_ELBOW, PL.RIGHT_WRIST)) {
        const [r_sh, r_el, r_wr] = [landmarks[PL.RIGHT_SHOULDER], landmarks[PL.RIGHT_ELBOW], landmarks[PL.RIGHT_WRIST]];
        const r_elbow_angle = angleDeg(r_sh, r_el, r_wr);
        const r_wrist_far = dist(r_wr, r_sh) >= TH.punch_wrist_to_shoulder_scale * scale;
        const r_wrist_y_align = Math.abs(r_wr.y - r_sh.y) <= TH.punch_wrist_y_align_scale * scale;
        // 右肘がまっすぐ and 手首が肩から遠い and 手首と肩の高さがほぼ同じ
        punch_right = (r_elbow_angle >= TH.punch_elbow_angle_min) && r_wrist_far && r_wrist_y_align;
    }

    if (punch_left || punch_right) {
        return "PUNCH";
    }

    // --- KICK 検出 ---
    let kick_left = false;
    if (has(PL.LEFT_HIP, PL.LEFT_KNEE, PL.LEFT_ANKLE)) {
        const [l_hip, l_kn, l_an] = [landmarks[PL.LEFT_HIP], landmarks[PL.LEFT_KNEE], landmarks[PL.LEFT_ANKLE]];
        const l_knee_angle = angleDeg(l_hip, l_kn, l_an);
        const l_ankle_far_x = Math.abs(l_an.x - l_hip.x) >= TH.kick_ankle_x_to_hip_scale * scale;
        // y座標は上が小さくなるので、この式で「足首が膝より上」を判定
        const l_ankle_above_knee = (l_an.y + TH.kick_ankle_above_knee_scale * scale) <= l_kn.y;
        // 左ひざがまっすぐ and (左足首xが腰xから遠い or 左足首が左膝より高い)
        kick_left = (l_knee_angle >= TH.kick_knee_angle_min) && (l_ankle_far_x || l_ankle_above_knee);
    }

    let kick_right = false;
    if (has(PL.RIGHT_HIP, PL.RIGHT_KNEE, PL.RIGHT_ANKLE)) {
        const [r_hip, r_kn, r_an] = [landmarks[PL.RIGHT_HIP], landmarks[PL.RIGHT_KNEE], landmarks[PL.RIGHT_ANKLE]];
        const r_knee_angle = angleDeg(r_hip, r_kn, r_an);
        const r_ankle_far_x = Math.abs(r_an.x - r_hip.x) >= TH.kick_ankle_x_to_hip_scale * scale;
        const r_ankle_above_knee = (r_an.y + TH.kick_ankle_above_knee_scale * scale) <= r_kn.y;
        // 右ひざがまっすぐ and (右足首xが腰xから遠い or 右足首が右膝より高い)
        kick_right = (r_knee_angle >= TH.kick_knee_angle_min) && (r_ankle_far_x || r_ankle_above_knee);
    }

    if (kick_left || kick_right) {
        return "KICK";
    }

    return "IDLE";
}