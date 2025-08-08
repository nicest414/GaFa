# GaFa (Pose Duel)
画像認識ファイターズ / Webカメラのポーズで操作する対戦ゲーム（プロトタイプ）

## 技術スタック
- フロントエンド: p5.js（CDN読込）
- バックエンド: Flask + Flask-Sock（WebSocket）
- 主要ライブラリ: OpenCV, MediaPipe
- デプロイ想定: Railway/Heroku + Gunicorn（WSはワーカ調整が必要）

## 必要環境
- Python 3.11 系（MediaPipe互換のため必須）
- Git（任意）
- Webカメラ
- OS: Windows/Mac/Linux（開発は主にWindows想定）

## セットアップ
1) 仮想環境の作成・有効化（Windows PowerShell 例）
```
py -3.11 -m venv .venv
./.venv/Scripts/Activate.ps1
python -V  # 3.11.x が表示されればOK
```
macOS/Linux の例:
```
python3.11 -m venv .venv
source .venv/bin/activate
python -V
```

2) 依存関係のインストール
```
pip install -U pip setuptools wheel
pip install -r requirements.txt
```
（確認）
```
python -c "import mediapipe as mp; print(mp.__version__)"  # 0.10系ならOK
```

## 動作確認（タスク1.3〜2.4）
事前に仮想環境を有効化しておくこと（.venv）。

- 1.3 Webサーバーテスト（Hello World）
  - 起動: `python backend/app.py`
  - 確認: ブラウザで http://127.0.0.1:5000 → "Hello World" が表示

- 1.4 ゲーム描画テスト（p5.js）
  - `frontend/index.html` をブラウザで開く
  - 期待: 640x480 キャンバスに円が表示、矢印キーで円が動く

- 2.1 ポーズ判定ロジック（単体）
  - 実行: `python backend/pose_test.py`（終了は q キー）
  - 期待: 骨格が描画され、ターミナルにランドマーク座標が出力される

- 2.2 WebSocketサーバー（配信）
  - 実行: `python backend/app.py`
  - WSエンドポイント: `ws://127.0.0.1:5000/ws`（JSON: {"pose":"..."}）

- 2.3 WebSocketクライアント（受信）
  - サーバー起動中に `frontend/index.html` を開く
  - ブラウザのコンソールで `WS connected` ログが出る

- 2.4 描画へのリアルタイム反映
  - カメラ前でポーズを取る
    - PUNCH: 片腕を前に突き出す → 円が赤
    - KICK: 片脚を高く上げる → 円がオレンジ
    - GUARD: 両手を顔前で上げて近づける → 円が青
    - IDLE: それ以外 → 円が黄

## プロジェクト構成
```
backend/
  app.py            # Flask + Flask-Sock（/ と /ws）
  pose_logic.py     # ポーズ4分類（PUNCH/KICK/GUARD/IDLE）
  pose_test.py      # カメラ+MediaPipe単体テスト
frontend/
  index.html        # p5.js ローダ
  sketch.js         # 円の移動＋WS受信で色変更
requirements.txt    # 依存
Procfile            # Gunicorn 起動（要WS対応の調整検討）
runtime.txt         # python-3.11.9
```

## デプロイの注意（WebSocket）
- GunicornのデフォルトワーカーではWebSocketが扱えないため、本番は以下いずれかを推奨:
  - gevent/eventlet ワーカーを使用（例）
    - `web: gunicorn -k geventwebsocket.gunicorn.workers.GeventWebSocketWorker backend.app:app`
  - もしくは ASGI サーバ（Hypercorn/Uvicorn + Quart など）に移行
- Pythonバージョンは `runtime.txt`（3.11.9）で固定

## トラブルシュート
- ModuleNotFoundError: flask_sock
  - 仮想環境が有効か確認（プロンプト先頭に `(.venv)`）。`pip show flask-sock` でインストール場所を確認。
  - 実行も仮想環境の Python で行う（例: `./.venv/Scripts/python.exe backend/app.py`）。
- カメラが掴めない/映らない
  - 他アプリの占有解除、OSのカメラ権限確認、デバイスIDを `0/1` に切替。
- WebSocketが繋がらない
  - サーバ起動中か、ポート5000がファイアウォールで許可されているか確認。
- OpenCV ImportError
  - `pip install --force-reinstall opencv-python` を試す。

## ライセンス
- 素材（サウンド/画像）利用時は各ライセンスに従うこと。
